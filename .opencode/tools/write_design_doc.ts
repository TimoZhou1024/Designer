/**
 * write_design_doc.ts —— DESIGN.md 与 brand-spec.json 结构化生成工具
 *
 * 与 save_artifact 区别：这个工具强制按 Open Design 的 9-section schema 生成
 * 单一事实源文档，避免 agent 自由发挥导致结构漂移。同时同步生成机器可读的
 * brand-spec.json，方便下游 designer 在 text_to_image prompt 里引用 token。
 */

import { tool } from "@opencode-ai/plugin"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"

const SECTION_KEYS = [
  "positioning",
  "color",
  "typography",
  "spacing",
  "layout",
  "components",
  "motion",
  "voice",
  "antiPatterns",
] as const

type Section = (typeof SECTION_KEYS)[number]

function renderDesignMd(spec: Record<Section, string>, brandName: string): string {
  return `# ${brandName} — DESIGN.md

> 品牌单一事实源。所有下游 agent / 工具在生成具体物料前必须读取此文件。

## 1. Positioning（品牌定位）
${spec.positioning}

## 2. Color（色彩系统）
${spec.color}

## 3. Typography（字体规范）
${spec.typography}

## 4. Spacing（空间节奏）
${spec.spacing}

## 5. Layout（布局原则）
${spec.layout}

## 6. Components（组件语言）
${spec.components}

## 7. Motion（动效原则）
${spec.motion}

## 8. Voice（语言调性）
${spec.voice}

## 9. Anti-Patterns（反模式 / 不要做的事）
${spec.antiPatterns}
`
}

export default tool({
  description:
    "生成结构化 DESIGN.md（Open Design 9-section schema）+ 机器可读 brand-spec.json，" +
    "作为品牌单一事实源，强制约束下游 designer 的 Logo/海报 prompt 与文案调性。" +
    "返回 DESIGN.md 与 brand-spec.json 的绝对路径。",
  args: {
    artifact_slug: tool.schema.string().describe("当前 artifact 目录名"),
    brand_name: tool.schema.string().describe("品牌中文名（出现在 DESIGN.md 标题）"),
    positioning: tool.schema.string().min(20).describe("品牌定位段落：服务对象 / 核心价值 / 差异化"),
    color: tool.schema.string().min(10).describe("色彩系统：主色 / 辅助色 / 中性色，用 OKLch 或 HEX 标注"),
    typography: tool.schema.string().min(10).describe("字体规范：中英字体栈 / 字重 / 字号层级"),
    spacing: tool.schema.string().min(5).describe("空间节奏：8pt 网格 / 留白原则"),
    layout: tool.schema.string().min(10).describe("布局原则：栅格 / 视觉层级 / 信息密度"),
    components: tool.schema.string().min(10).describe("组件语言：按钮 / 卡片 / 表单的统一形态"),
    motion: tool.schema.string().min(5).describe("动效原则：缓动 / 时长 / 触发原则（CLI 场景可填'静态优先'）"),
    voice: tool.schema.string().min(10).describe("语言调性：人格 / 语气 / 禁用词"),
    antiPatterns: tool.schema.string().min(10).describe("反模式：明确禁止的设计选择"),
    /** 机器可读 token，下游 designer 直接读 */
    tokens: tool.schema.string().describe("brand-spec.json 的完整 JSON 内容字符串（包含 colors/fonts/sizes 等机器可读 token）"),
  },
  async execute(args, ctx) {
    const artifactsDir = process.env.ARTIFACTS_DIR ?? "artifacts"
    const base = resolve(ctx.directory, artifactsDir, args.artifact_slug)
    const mdPath = resolve(base, "DESIGN.md")
    const jsonPath = resolve(base, "brand-spec.json")

    const spec: Record<Section, string> = {
      positioning: args.positioning,
      color: args.color,
      typography: args.typography,
      spacing: args.spacing,
      layout: args.layout,
      components: args.components,
      motion: args.motion,
      voice: args.voice,
      antiPatterns: args.antiPatterns,
    }

    await mkdir(dirname(mdPath), { recursive: true })
    await writeFile(mdPath, renderDesignMd(spec, args.brand_name), "utf-8")

    let parsed: unknown
    try {
      parsed = JSON.parse(args.tokens)
    } catch (e) {
      throw new Error(`tokens must be valid JSON: ${(e as Error).message}`)
    }
    await writeFile(jsonPath, JSON.stringify(parsed, null, 2), "utf-8")

    return JSON.stringify({ designMd: mdPath, brandSpecJson: jsonPath }, null, 2)
  },
})
