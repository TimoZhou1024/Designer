/**
 * save_artifact.ts —— 通用文本产物落盘工具
 *
 * 用途：把 agent 在上下文里生成的 Markdown / JSON / 文本资产保存到 artifacts/<slug>/<rel_path>
 * 与 text_to_image 不同，这里只处理文本；图像由 text_to_image 直接落盘。
 *
 * 设计要点：
 * - 始终落盘到 ctx.directory（项目根）/ artifacts，避免越权写到其他位置
 * - rel_path 校验，禁止 `..` 路径穿越
 * - 自动创建父目录
 */

import { tool } from "@opencode-ai/plugin"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve, relative, isAbsolute } from "node:path"

export default tool({
  description:
    "保存文本类设计产物（Markdown / JSON / 纯文本）到 artifacts/<slug>/<rel_path>。" +
    "用于持久化 DESIGN.md、copywriting.md、brand-spec.json、critique-report.md 等。" +
    "返回写入的绝对路径与字节数。",
  args: {
    artifact_slug: tool.schema
      .string()
      .min(1)
      .describe("当前 artifact 目录名，例如 'chuangzhi-college-20260514'"),
    rel_path: tool.schema
      .string()
      .min(1)
      .describe("相对路径（相对 artifacts/<slug>/），例如 'DESIGN.md' 或 'critique-report.md'"),
    content: tool.schema.string().describe("要写入的完整内容"),
  },
  async execute(args, ctx) {
    if (args.rel_path.includes("..") || isAbsolute(args.rel_path)) {
      throw new Error(`rel_path must be relative and not contain '..': ${args.rel_path}`)
    }

    const artifactsDir = process.env.ARTIFACTS_DIR ?? "artifacts"
    const target = resolve(ctx.directory, artifactsDir, args.artifact_slug, args.rel_path)

    const rel = relative(resolve(ctx.directory, artifactsDir), target)
    if (rel.startsWith("..")) {
      throw new Error(`computed path escapes artifacts/: ${target}`)
    }

    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, args.content, "utf-8")
    const bytes = Buffer.byteLength(args.content, "utf-8")

    return JSON.stringify({ path: target, bytes }, null, 2)
  },
})
