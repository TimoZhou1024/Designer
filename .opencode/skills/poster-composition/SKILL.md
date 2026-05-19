---
name: poster-composition
description: 主视觉海报构图原则与 prompt 模板。教 designer agent 为品牌生成多张主视觉海报，复用 brand-spec 色彩/字体，海报中**直接渲染中文标题与副标题**（依赖 text-rendering skill）。当 WBS 含 poster / banner / 主视觉 / 宣传图任务时加载。
---

# Poster Composition Skill —— 海报构图与提示词

## 何时加载

WBS 中出现 `category: "poster"` / 主视觉 / banner / 宣传图任务时加载。**先 `skill("text-rendering")` 再 `skill("poster-composition")`**。

## 构图原则（5 条）

1. **聚焦法则** — 海报必须有**唯一视觉焦点**，焦点占据画面**显眼位置**（约 1/3 ~ 1/2 视觉权重）
2. **三分法栅格** — 焦点放在三分线交点而非死中央
3. **色彩等级** — 主色为画面**主导色调**，辅助色仅用于**点睛位置**，中性色填充呼吸空间；**禁止**让三色等量分配（视觉会失衡），但也**禁止**在 prompt 里指定数学百分比（模型不擅长面积计算，会为凑数学约束牺牲美学）
4. **留白节奏** — 上下左右留出**舒适的安全边距**，让画面有呼吸感
5. **品牌一致** — 复用 brand-spec.json 的主色/字体，与 Logo 视觉同源

## Prompt 模板（v3.1 · 完整微文案层级 + OpenAI 拟真触发词）

OpenAI 指南：海报场景应用 **photorealistic / editorial poster / magazine cover quality** 等关键词触发模型的"production-quality"模式。如果品牌方向偏写实摄影，加入 photography language（lens / lighting / framing）+ "real texture (fabric wear, imperfections)"。

⚠️ **v3.1 重要修正**：旧模板只塞 headline + subtitle 导致画面"字太少 / AI 通稿感"。新模板**强制注入完整信息层级**：headline / subtitle / body / data points / footnote。这是 design fidelity 的关键。

```
Premium editorial poster, magazine cover quality, [STYLE_DIRECTIVE].
Brand poster for [BRAND_NAME_EN] ([BRAND_NAME_CN]).

Render the following Chinese text exactly as specified, treating each character as a visual glyph (preserve all strokes, do not interpret semantically). Each text element appears once and only once:
  • Headline (largest, most prominent): "[MICRO_COPY.HEADLINE]"
  • Subtitle (medium, just below headline): "[MICRO_COPY.SUBTITLE]"
  • Body lines (small, supporting layer):
      - "[MICRO_COPY.BODY_LINES[0]]"
      - "[MICRO_COPY.BODY_LINES[1]]"  (if present)
  • Data points (small, fact-rich callouts as visual markers):
      "[MICRO_COPY.DATA_POINTS[0]]"  ·  "[MICRO_COPY.DATA_POINTS[1]]"  ·  ...
  • Footnote (smallest, at the bottom edge): "[MICRO_COPY.FOOTNOTE]"

Typography:
  - Headline in [TITLE_FONT_EN] Bold
  - Subtitle in [TITLE_FONT_EN] Regular
  - Body / data points / footnote in [BODY_FONT_EN] Regular small
All Chinese characters in the same font family for visual cohesion.

Theme: [POSTER_THEME].
Composition: [COMPOSITION_PATTERN — describe layout in directional terms like "headline upper third, hero image dominating the middle, data points scattered along the lower edge, footnote bottom-center", NOT in percentage areas].
Color palette: [PRIMARY_HEX] (rendered as [PRIMARY_MATERIAL] — e.g. matte ink, brushed metal, glossy ceramic) dominant, [ACCENT_HEX] (rendered as [ACCENT_MATERIAL]) used sparingly for emphasis, [PAPER_HEX] (rendered as [PAPER_MATERIAL] — e.g. handmade kozo paper, weighted matte cream, smooth bone-white) as breathing space. Let the composition feel naturally distributed.
Mood: [MOOD_KEYWORDS].
Visual elements: [VISUAL_METAPHORS].
Style: [STYLE_QUALIFIER — flat editorial illustration / photorealistic 35mm / ink-wash painting / vector-friendly].
[OPTIONAL: For photorealistic mode add: shot like a 35mm film photograph, [LENS]mm lens, [LIGHTING], shallow depth of field, subtle film grain, real texture and natural color balance, no studio polish.]

Output aspect: 9:16 portrait, ready for both print and social media.

Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than specified, no character radicals depicted as separate visual elements in the background, no realistic human faces unless specified, no embedded extra text beyond what's specified, no logos, no watermarks, no copyrighted characters, no clutter, no chromatic aberration.
```

**字段填充规则**：
- 所有 `MICRO_COPY.*` 字段直接从 `task.micro_copy` 读取，无值则跳过该行（不要捏造）
- `BODY_LINES` / `DATA_POINTS` 是数组，**逐项展开**为带项目符号的列表
- 如果 `MICRO_COPY` 整体为空（极少见），fallback 用 `embed_text` 当 headline，但 critic 会扣 Function 维度分

**字段填充规则**：
- `HEADLINE_TEXT` 必填——通常来自 copywriting.md 的 slogan 主推或 brand promise（4-12 字）
- `SUBTITLE_TEXT` 可选——副标题或英文翻译（≤ 15 字）
- `TITLE_POSITION` 三选一：`upper third` / `centered above the focal element` / `bottom third over visual cluster`
- `COMPOSITION_PATTERN` 选一种：
  - `central focal hero + radial supporting elements`（焦点居中辐射）
  - `rule-of-thirds with focal element at upper-right intersection, supporting cluster bottom-left`（三分法对角）
  - `vertical layered composition: hero band top, content middle, identity strip bottom`（横向分层）
- `MOOD_KEYWORDS` 3-5 个词，来自 brand-spec.voice
- `VISUAL_METAPHORS` 1-3 个具体可视化的隐喻物（**禁止**抽象词如"未来 / 希望"）

## 调用顺序

```
读取 artifacts/<slug>/brand-spec.json + DESIGN.md + copywriting.md
↓
对每个海报变体任务：
  1. 从 task.embed_text 取标题文字
  2. 用上方模板填充 prompt
  3. text_to_image({ prompt, output_name, artifact_slug, aspect: "9:16", n: 1 })
↓
保存 poster/README.md 记录每张 prompt + 真实 model/endpoint + 备注
```

## 反模式

- ❌ **保留旧策略 "no embedded text"**：本 skill 已升级，海报必须含中文标题
- ❌ **试图一张海报装下所有信息**：海报承担"情绪 + 视觉锤 + 短标题"，详情留给宣传册
- ❌ **强行 photorealistic**：除非品牌方向明确要写实摄影，否则用 flat / illustrative 更稳
- ❌ **变体之间只是色彩微调**：变体应在"构图模式 + 隐喻物"维度变化

## 实例（朱家角 - 主视觉海报）

```
Minimal, modern, brand-identity quality poster.
Brand poster for ZhuJiaJiao Ancient Town (朱家角).
Render the Chinese headline "梦回水乡" in Source Han Serif Bold, very large (about 28% of canvas height), positioned in the upper third of the canvas.
Render the Chinese subtitle "千年江南 · 一桥一梦" in Source Han Serif Regular, medium, positioned just below the headline.
Theme: a poetic morning view of the ancient stone bridge and waterways awakening at dawn.
Composition: vertical layered composition — hero band top with text and misty sky, content middle with the iconic Fang Sheng Bridge over rippled water, identity strip bottom with subtle vermillion seal logo.
Color palette: #1A1A1A ink black as the dominant tone (sky, silhouettes, headline), #C73E2E vermillion used very sparingly for a single seal stamp accent only, #FBFAF6 paper-color providing balance through water and mist. Let the composition feel naturally distributed — do not force exact area percentages.
Mood: tranquil, poetic, nostalgic, refined.
Visual elements: a curved stone arch bridge in mid-distance, soft morning mist rising from the canal water, a single moored wooden boat under the bridge, ink-wash style distant rooftops with upturned eaves.
Style: editorial poster, magazine cover quality, ink-wash painting blended with flat vector elements, vector-friendly.
Output aspect: 9:16 portrait, ready for both print and social media.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no realistic human faces, no embedded extra text, no watermarks, no copyrighted characters, no clutter, no neon.
```
