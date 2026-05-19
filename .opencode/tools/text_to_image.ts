/**
 * text_to_image.ts —— 多 provider 文生图工具
 *
 * 设计要点：
 * 1. provider 适配器：MiniMax / OpenAI / 通义 / dry-run，通过参数或环境变量切换
 * 2. 错误透明：单 provider 失败时显式抛错，不做静默 fallback，避免掩盖问题
 * 3. dry-run 模式：无 API key 时生成 1x1 PNG 占位 + 标注 prompt，保证整条流水线能跑通
 * 4. 返回 JSON 而不是 Blob：路径 + 元数据交给 LLM 上下文，图像本体落盘
 * 5. 自加载 .env：Open Code 不会自动加载项目根 .env，所以本工具在首次调用时
 *    用零依赖解析器把 ctx.directory/.env 注入 process.env（不覆盖已有变量）
 */

import { tool } from "@opencode-ai/plugin"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join, resolve } from "node:path"
import { Buffer } from "node:buffer"

/** 已加载过的项目根目录集合，避免重复读 .env */
const loadedDirs = new Set<string>()

/**
 * 零依赖 .env 加载器：把 <projectRoot>/.env 注入 process.env。
 * 不覆盖已有环境变量（让 shell 显式 export 优先级最高）。
 * 兼容 KEY=VALUE / KEY="VALUE" / KEY='VALUE'，忽略 # 注释行与空行。
 *
 * ⚠️ 关键：opencode 工具子进程不一定继承父 shell 的 .env 自动加载行为，
 * 而 ctx.directory 在某些 opencode 版本下可能不是项目根。所以这里做**三层兜底**：
 *   1. <ctx.directory>/.env
 *   2. <cwd>/.env
 *   3. <toolFile>/../../../.env  （从 .opencode/tools/ 往上 3 级回到项目根）
 * 任意一层命中就停。
 */
import { fileURLToPath } from "node:url"

async function readEnvFile(envPath: string): Promise<{ loaded: number; path: string } | null> {
  let raw: string
  try {
    raw = await readFile(envPath, "utf-8")
  } catch {
    return null
  }
  let loaded = 0
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = val
      loaded++
    }
  }
  return { loaded, path: envPath }
}

async function loadDotenvOnce(projectRoot: string): Promise<{ loaded: number; path: string; tried: string[] } | null> {
  if (loadedDirs.has(projectRoot)) return null
  loadedDirs.add(projectRoot)

  // 候选 1：ctx.directory
  const candidates: string[] = [join(projectRoot, ".env")]

  // 候选 2：当前工作目录
  try {
    const cwd = process.cwd()
    if (cwd && cwd !== projectRoot) candidates.push(join(cwd, ".env"))
  } catch {}

  // 候选 3：从 tool 文件位置往上 3 级（.opencode/tools/text_to_image.ts → 项目根）
  try {
    const here = fileURLToPath(import.meta.url)
    const upRoot = resolve(dirname(here), "..", "..", "..")
    candidates.push(join(upRoot, ".env"))
  } catch {}

  const tried: string[] = []
  for (const c of candidates) {
    tried.push(c)
    if (tried.indexOf(c) !== tried.length - 1) continue // 去重
    const r = await readEnvFile(c)
    if (r) return { ...r, tried }
  }
  return { loaded: 0, path: "(none matched)", tried }
}

type Provider = "minimax" | "openai" | "tongyi" | "custom" | "dryrun"

interface ImageResult {
  provider: Provider
  prompt: string
  localPath: string
  remoteUrl?: string
  size: string
  bytes: number
  meta: Record<string, unknown>
}

/** 1x1 透明 PNG (base64) —— dryrun 占位 */
const PLACEHOLDER_PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

async function generateMiniMax(prompt: string, aspect: string, n: number): Promise<{ urls: string[]; raw: any }> {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) throw new Error("MINIMAX_API_KEY not set; cannot call MiniMax image API")
  const model = process.env.MINIMAX_IMAGE_MODEL ?? "image-01"

  const res = await fetch("https://api.minimax.chat/v1/image_generation", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      aspect_ratio: aspect,
      n,
      response_format: "url",
    }),
  })
  if (!res.ok) throw new Error(`MiniMax API error ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as any
  const urls: string[] = data?.data?.image_urls ?? data?.images ?? []
  if (urls.length === 0) throw new Error(`MiniMax returned no images: ${JSON.stringify(data)}`)
  return { urls, raw: data }
}

async function generateOpenAI(prompt: string, aspect: string, n: number): Promise<{ urls: string[]; raw: any }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("OPENAI_API_KEY not set; cannot call OpenAI image API")
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1"
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
  }
  const size = sizeMap[aspect] ?? "1024x1024"

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, prompt, size, n }),
  })
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as any
  const urls: string[] = (data?.data ?? []).map((item: any) => item.url).filter(Boolean)
  if (urls.length === 0) throw new Error(`OpenAI returned no images: ${JSON.stringify(data)}`)
  return { urls, raw: data }
}

/**
 * generateCustom —— OpenAI 兼容文生图通用适配器
 *
 * 适用：SiliconFlow / Pollinations / Together / Replicate / Fireworks / 自部署 ComfyUI 等
 *      凡是暴露 `POST {base}/images/generations` 标准 OpenAI 接口的服务都可走这里。
 *
 * 必需环境变量（或 args 覆盖）：
 *   - CUSTOM_IMAGE_BASE_URL  形如 "https://api.siliconflow.cn/v1"（结尾不带 /images/generations）
 *   - CUSTOM_IMAGE_API_KEY   API key（args 不接受 key 参数，只走 .env，避免 LLM 上下文泄露）
 *   - CUSTOM_IMAGE_MODEL     模型 ID，例如 "black-forest-labs/FLUX.1-schnell"
 *
 * 响应自动兼容 url / b64_json 两种返回格式。
 */
async function generateCustom(
  prompt: string,
  aspect: string,
  n: number,
  qualityOverride?: string,
): Promise<{ urls: string[]; b64s: string[]; raw: any; endpoint: string; model: string; quality?: string }> {
  const baseUrl = (process.env.CUSTOM_IMAGE_BASE_URL ?? "").replace(/\/+$/, "")
  if (!baseUrl) throw new Error("CUSTOM_IMAGE_BASE_URL not set; cannot call custom image API")
  const apiKey = process.env.CUSTOM_IMAGE_API_KEY
  if (!apiKey) throw new Error("CUSTOM_IMAGE_API_KEY not set; cannot call custom image API")
  const model = process.env.CUSTOM_IMAGE_MODEL
  if (!model) throw new Error("CUSTOM_IMAGE_MODEL not set in .env")

  // 长宽比 → OpenAI 标准 size 字符串
  // gpt-image-2 支持任意分辨率（< 3840 边长 / 16 倍数 / 比率 ≤ 3:1 / 总像素 655360-8294400）
  // 这些 preset 是"安全 + 主流"的取值，agent 可用 aspect 简称选择，复杂场景可后续扩展
  const sizeMap: Record<string, string> = {
    "1:1": "1024x1024",      // Square (general purpose)
    "16:9": "1792x1024",     // Wide / hero
    "9:16": "1024x1792",     // Mobile portrait / phone UI
    "4:3": "1456x1088",      // Brochure / poster portrait
    "3:4": "1088x1456",      // Magazine / book cover
    "3:2": "1536x1024",      // HD landscape
    "2:3": "1024x1536",      // HD portrait (gpt-image-2 popular)
  }
  const size = sizeMap[aspect] ?? "1024x1024"
  const endpoint = `${baseUrl}/images/generations`

  // quality: 优先级 args > env CUSTOM_IMAGE_DEFAULT_QUALITY > 不传（让 endpoint 用自己默认）
  const quality = qualityOverride ?? process.env.CUSTOM_IMAGE_DEFAULT_QUALITY

  const body: Record<string, unknown> = {
    model,
    prompt,
    n,
    size,
    // 同时兼容 SiliconFlow / Stability 等使用 image_size 字段的服务
    image_size: size,
    response_format: "url",
  }
  if (quality) body.quality = quality

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Custom API ${endpoint} error ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as any

  // 兼容多种响应壳：data.data[].url / data.data[].b64_json / data.images[] / data.output[]
  const items: any[] = data?.data ?? data?.images ?? data?.output ?? []
  const urls: string[] = items.map((it) => it?.url).filter((u: any) => typeof u === "string")
  const b64s: string[] = items.map((it) => it?.b64_json).filter((b: any) => typeof b === "string")

  if (urls.length === 0 && b64s.length === 0) {
    throw new Error(`Custom API returned no images: ${JSON.stringify(data).slice(0, 500)}`)
  }
  return { urls, b64s, raw: data, endpoint, model, quality }
}

async function generateTongyi(prompt: string, aspect: string, n: number): Promise<{ urls: string[]; raw: any }> {
  const apiKey = process.env.DASHSCOPE_API_KEY
  if (!apiKey) throw new Error("DASHSCOPE_API_KEY not set; cannot call 通义万相 API")
  const model = process.env.TONGYI_IMAGE_MODEL ?? "wanx-v1"

  const submit = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-DashScope-Async": "enable",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: { prompt },
      parameters: { size: aspect === "16:9" ? "1280*720" : "1024*1024", n },
    }),
  })
  if (!submit.ok) throw new Error(`Tongyi submit error ${submit.status}: ${await submit.text()}`)
  const submitData = (await submit.json()) as any
  const taskId = submitData?.output?.task_id
  if (!taskId) throw new Error(`Tongyi missing task_id: ${JSON.stringify(submitData)}`)

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const poll = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    const pollData = (await poll.json()) as any
    const status = pollData?.output?.task_status
    if (status === "SUCCEEDED") {
      const urls = (pollData?.output?.results ?? []).map((r: any) => r.url).filter(Boolean)
      if (urls.length === 0) throw new Error(`Tongyi succeeded but no urls: ${JSON.stringify(pollData)}`)
      return { urls, raw: pollData }
    }
    if (status === "FAILED") throw new Error(`Tongyi task failed: ${JSON.stringify(pollData)}`)
  }
  throw new Error(`Tongyi task ${taskId} timeout after 120s`)
}

async function downloadToFile(url: string, filePath: string): Promise<number> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, buf)
  return buf.byteLength
}

async function writePlaceholder(filePath: string, prompt: string, diag?: Record<string, unknown>): Promise<number> {
  await mkdir(dirname(filePath), { recursive: true })
  const buf = Buffer.from(PLACEHOLDER_PNG_B64, "base64")
  await writeFile(filePath, buf)
  const diagBlock = diag
    ? `\n[DIAGNOSTICS · 为什么走了 dryrun]\n${JSON.stringify(diag, null, 2)}\n`
    : ""
  await writeFile(filePath + ".prompt.txt", `[DRY-RUN PLACEHOLDER]\n\nPROMPT:\n${prompt}\n${diagBlock}`)
  return buf.byteLength
}

async function writeBase64ToFile(b64: string, filePath: string): Promise<number> {
  const buf = Buffer.from(b64, "base64")
  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, buf)
  return buf.byteLength
}

export default tool({
  description:
    "文生图工具：根据 prompt 调用配置好的图像生成 API（MiniMax / OpenAI / 通义万相 / 任意 OpenAI 兼容服务）生成图片并落盘到 artifacts 目录。" +
    "Provider 与 model 完全由项目 .env 决定（DESIGNER_IMAGE_PROVIDER 与对应配置），调用方**禁止传 provider 参数**——越权指定会破坏用户配置。" +
    "调用方只需关心 prompt / output_name / artifact_slug / aspect / n。" +
    "返回 JSON 数组：[{ provider, prompt, localPath, remoteUrl?, size, bytes, meta }]，meta 含真实使用的 model 与 endpoint，可直接抄录到产物 README。",
  args: {
    prompt: tool.schema
      .string()
      .min(8)
      .describe("详细的图像生成提示词（建议英文 + 中文混合，包含主体/风格/构图/色调）"),
    output_name: tool.schema
      .string()
      .describe("输出文件相对路径（相对 artifacts/<slug>/），例如 'logo/v1-minimal.png' 或 'poster/main.png'"),
    artifact_slug: tool.schema
      .string()
      .describe("当前 artifact 目录名（例如 'chuangzhi-college-20260514'），所有产物落到此目录下"),
    // ⚠️ provider / model / base_url 字段已于 v3.5 从 schema 中移除（接口设计原则）：
    //   - provider: 完全由 .env 中的 DESIGNER_IMAGE_PROVIDER 决定
    //   - model:    完全由 .env 中的 *_IMAGE_MODEL 决定
    //   - base_url: 完全由 .env 中的 CUSTOM_IMAGE_BASE_URL 决定
    //   - api_key:  完全由 .env 中的 *_API_KEY 决定
    // 移除原因：保留 schema 字段会诱导 LLM 越权（即使 description 写"禁止传"也会被填充）。
    // 测试 / 切换 provider 请通过修改 .env 文件实现，或用 scripts/test-image-gen.ts 单元测试。
    aspect: tool.schema
      .enum(["1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3"])
      .optional()
      .describe("长宽比，默认 1:1（Logo）；海报推荐 9:16 或 3:4；Hero/Banner 用 16:9 或 3:2；杂志封面用 2:3"),
    n: tool.schema
      .number()
      .int()
      .min(1)
      .max(4)
      .optional()
      .describe(
        "生成张数，默认 1。Logo 推荐传 n=4 让模型在同一上下文中产出 4 个差异化方向（更省 token、变体更多样）。" +
          "其他类别（poster/UI/文创等）保持 n=1，因为变体方向跨度大，需 planner 在 WBS 里拆独立 task。",
      ),
    quality: tool.schema
      .enum(["low", "medium", "high"])
      .optional()
      .describe(
        "图像质量等级：" +
          "high = Logo / 含小字 UI / 含密集 infographic / 含小字宣传册（细节丰富但慢且贵）；" +
          "medium = 海报 / 主视觉 / 文创实物 / 公共家具 / 典型场景（默认推荐）；" +
          "low = 探索性大批量 / 内部预览 / 草图风格（快且便宜）。" +
          "缺省时读 CUSTOM_IMAGE_DEFAULT_QUALITY 环境变量，再缺省则由 endpoint 自己决定。",
      ),
  },
  async execute(args, ctx) {
    // 关键：Open Code 不会自动加载项目根 .env，先把它注入 process.env 再读变量
    const dotenv = await loadDotenvOnce(ctx.directory)

    // Provider 解析：完全由 .env 中的 DESIGNER_IMAGE_PROVIDER 决定
    //
    // v3.5 设计变更：
    //   - 移除 args.provider / args.model / args.base_url 三个 schema 字段
    //   - 让 LLM 物理上无法越权传这些字段（schema 里没有的字段，模型生成不了）
    //   - 如果 .env 未配置 DESIGNER_IMAGE_PROVIDER，直接抛错（不 fallback 到 dryrun）
    //   - dryrun 只在用户在 .env 里**显式设置** DESIGNER_IMAGE_PROVIDER=dryrun 时启用
    const envProvider = process.env.DESIGNER_IMAGE_PROVIDER as Provider | undefined
    if (!envProvider) {
      throw new Error(
        "DESIGNER_IMAGE_PROVIDER not set in .env. " +
          "This tool requires explicit provider configuration via .env file " +
          "(e.g. DESIGNER_IMAGE_PROVIDER=custom + CUSTOM_IMAGE_BASE_URL/KEY/MODEL). " +
          "Tool calls will fail until .env is properly configured.",
      )
    }
    const provider: Provider = envProvider
    const aspect = args.aspect ?? "1:1"
    const n = args.n ?? 1

    const artifactsDir = process.env.ARTIFACTS_DIR ?? "artifacts"
    const baseDir = resolve(ctx.directory, artifactsDir, args.artifact_slug)
    const outPath = resolve(baseDir, args.output_name)

    const results: ImageResult[] = []

    if (provider === "dryrun") {
      // ⚠️ v3.5 起：dryrun 只能由用户在 .env 显式设置 DESIGNER_IMAGE_PROVIDER=dryrun 触发
      //   - args.provider 通路已在前面被硬阻断
      //   - 没设 env 也已在前面抛错
      // 所以这里的 provider==="dryrun" 100% 是用户显式选择的，不是 LLM 越权或 fallback
      const diag = {
        ctxDirectory: ctx.directory,
        cwd: (() => { try { return process.cwd() } catch { return "(unknown)" } })(),
        dotenvLoaded: dotenv ? `${dotenv.loaded} keys from ${dotenv.path}` : "skipped (already loaded)",
        dotenvTriedPaths: dotenv?.tried ?? [],
        envSnapshot: {
          DESIGNER_IMAGE_PROVIDER: process.env.DESIGNER_IMAGE_PROVIDER ?? null,
          CUSTOM_IMAGE_BASE_URL: process.env.CUSTOM_IMAGE_BASE_URL ? "(set)" : null,
          CUSTOM_IMAGE_API_KEY: process.env.CUSTOM_IMAGE_API_KEY ? "(set)" : null,
          CUSTOM_IMAGE_MODEL: process.env.CUSTOM_IMAGE_MODEL ?? null,
          MINIMAX_API_KEY: process.env.MINIMAX_API_KEY ? "(set)" : null,
        },
        providerResolution: `env DESIGNER_IMAGE_PROVIDER="dryrun" (user explicitly chose dryrun mode in .env)`,
        hint: "User explicitly set DESIGNER_IMAGE_PROVIDER=dryrun in .env. To get real images, change it to 'custom' / 'minimax' / 'openai' / 'tongyi' and configure the corresponding *_API_KEY.",
      }
      for (let i = 0; i < n; i++) {
        const suffix = n > 1 ? `-${i + 1}` : ""
        const fp = outPath.replace(/(\.[^.]+)?$/, `${suffix}$1`)
        const bytes = await writePlaceholder(fp, args.prompt, diag)
        results.push({
          provider: "dryrun",
          prompt: args.prompt,
          localPath: fp,
          size: "1x1",
          bytes,
          meta: { note: "dry-run placeholder; prompt saved to .prompt.txt", diagnostics: diag },
        })
      }
      return JSON.stringify(results, null, 2)
    }

    // 通用响应壳：urls 和 b64s 同时容纳，落盘时各走各的分支
    // v3.5 起：args.model / args.base_url 已从 schema 移除（防 LLM 越权）
    //   - model / base_url：完全由 .env 决定，不接受 args 覆盖
    //   - quality：保留 args.quality（这是合法的设计参数，每张图都可能不同）
    let gen: { urls: string[]; b64s?: string[]; raw: any; endpoint?: string; model?: string; quality?: string }
    switch (provider) {
      case "minimax":
        gen = await generateMiniMax(args.prompt, aspect, n)
        break
      case "openai":
        gen = await generateOpenAI(args.prompt, aspect, n)
        break
      case "tongyi":
        gen = await generateTongyi(args.prompt, aspect, n)
        break
      case "custom":
        gen = await generateCustom(args.prompt, aspect, n, args.quality)
        break
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }

    // 优先 url 通路（更省内存且可持久化外链），fallback b64_json
    const total = gen.urls.length + (gen.b64s?.length ?? 0)
    let idx = 0

    for (const url of gen.urls) {
      const suffix = total > 1 ? `-${idx + 1}` : ""
      const fp = outPath.replace(/(\.[^.]+)?$/, `${suffix}$1`)
      const bytes = await downloadToFile(url, fp)
      results.push({
        provider,
        prompt: args.prompt,
        localPath: fp,
        remoteUrl: url,
        size: aspect,
        bytes,
        meta: {
          model: gen.model,
          endpoint: gen.endpoint,
          quality: gen.quality,
          rawProviderResponse: gen.raw,
        },
      })
      idx++
    }

    for (const b64 of gen.b64s ?? []) {
      const suffix = total > 1 ? `-${idx + 1}` : ""
      const fp = outPath.replace(/(\.[^.]+)?$/, `${suffix}$1`)
      const bytes = await writeBase64ToFile(b64, fp)
      results.push({
        provider,
        prompt: args.prompt,
        localPath: fp,
        size: aspect,
        bytes,
        meta: {
          model: gen.model,
          endpoint: gen.endpoint,
          quality: gen.quality,
          decodedFromBase64: true,
        },
      })
      idx++
    }

    return JSON.stringify(results, null, 2)
  },
})
