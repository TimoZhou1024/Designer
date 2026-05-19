---
name: poster-composition
description: 主视觉海报构图原则与 prompt 模板。教 designer agent 为品牌生成多张主视觉海报，复用 brand-spec 色彩/字体，海报中**直接渲染中文标题与副标题**（依赖 text-rendering skill）。当 WBS 含 poster / banner / 主视觉 / 宣传图任务时加载。
---

# Poster Composition Skill —— 海报构图与提示词

## 何时加载

WBS 中出现 `category: "poster"` / 主视觉 / banner / 宣传图任务时加载。**先 `skill("text-rendering")` 再 `skill("poster-composition")`**。

## 构图原则（5 条）

1. **聚焦法则** — 海报必须有**唯一视觉焦点**，焦点占画面 30-50% 区域
2. **三分法栅格** — 焦点放在三分线交点而非死中央
3. **色彩等级** — 主色面积 ≥ 60%，辅助色 20-30%，中性色填充剩余；禁止三色等分
4. **留白节奏** — 上下左右各留 8-15% 安全边距
5. **品牌一致** — 复用 brand-spec.json 的主色/字体，与 Logo 视觉同源

## Prompt 模板（已含 text-rendering + OpenAI 指南拟真触发词）

OpenAI 指南：海报场景应用 **photorealistic / editorial poster / magazine cover quality** 等关键词触发模型的"production-quality"模式。如果品牌方向偏写实摄影，加入 photography language（lens / lighting / framing）+ "real texture (fabric wear, imperfections)"。

```
Premium editorial poster, magazine cover quality, [STYLE_DIRECTIVE].
Brand poster for [BRAND_NAME_EN] ([BRAND_NAME_CN]).
Render the Chinese headline "[HEADLINE_TEXT]" (verbatim, no extra characters) in [TITLE_FONT_EN] Bold, large (about 25-30% of canvas height), positioned at [TITLE_POSITION]. Ensure the headline appears once and only once.
Render the Chinese subtitle "[SUBTITLE_TEXT]" in [BODY_FONT_EN] Regular, medium, positioned [SUBTITLE_POSITION]. Ensure the subtitle appears once and only once.
Theme: [POSTER_THEME].
Composition: [COMPOSITION_PATTERN].
Color palette: primary [PRIMARY_HEX] dominant ~60%, accent [ACCENT_HEX] ~25%, neutral [PAPER_HEX] balance.
Mood: [MOOD_KEYWORDS].
Visual elements: [VISUAL_METAPHORS].
Style: [STYLE_QUALIFIER — flat editorial illustration / photorealistic 35mm / ink-wash painting / vector-friendly].
[OPTIONAL: For photorealistic mode add: shot like a 35mm film photograph, [LENS]mm lens, [LIGHTING], shallow depth of field, subtle film grain, real texture and natural color balance, no studio polish.]
Output aspect: 9:16 portrait, ready for both print and social media.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than specified, no realistic human faces unless specified, no embedded extra text beyond what's specified, no logos, no watermarks, no copyrighted characters, no clutter, no chromatic aberration.
```

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
- ❌ **传 provider 参数给 text_to_image**：违反 designer.md 第 6 条
- ❌ **变体之间只是色彩微调**：变体应在"构图模式 + 隐喻物"维度变化

## 实例（朱家角 - 主视觉海报）

```
Minimal, modern, brand-identity quality poster.
Brand poster for ZhuJiaJiao Ancient Town (朱家角).
Render the Chinese headline "梦回水乡" in Source Han Serif Bold, very large (about 28% of canvas height), positioned in the upper third of the canvas.
Render the Chinese subtitle "千年江南 · 一桥一梦" in Source Han Serif Regular, medium, positioned just below the headline.
Theme: a poetic morning view of the ancient stone bridge and waterways awakening at dawn.
Composition: vertical layered composition — hero band top with text and misty sky, content middle with the iconic Fang Sheng Bridge over rippled water, identity strip bottom with subtle vermillion seal logo.
Color palette: primary #1A1A1A ink black dominant ~55% (sky and silhouettes), accent #C73E2E vermillion ~10% (only the seal stamp), neutral paper #FBFAF6 ~35% (water and mist).
Mood: tranquil, poetic, nostalgic, refined.
Visual elements: a curved stone arch bridge in mid-distance, soft morning mist rising from the canal water, a single moored wooden boat under the bridge, ink-wash style distant rooftops with upturned eaves.
Style: editorial poster, magazine cover quality, ink-wash painting blended with flat vector elements, vector-friendly.
Output aspect: 9:16 portrait, ready for both print and social media.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no realistic human faces, no embedded extra text, no watermarks, no copyrighted characters, no clutter, no neon.
```
