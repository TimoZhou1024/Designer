---
name: poster-composition
description: 主视觉海报构图原则与 prompt 模板。教 designer agent 如何为品牌生成 1 张主视觉海报，复用 DESIGN.md 的色彩/字体/调性，避免视觉与 Logo 脱节。当 WBS 含 poster/banner/主视觉/宣传图任务时加载。
---

# Poster Composition Skill —— 海报构图与提示词

## 何时加载

WBS 中出现"海报 / 主视觉 / banner / 宣传图"任务时加载。

## 构图原则（5 条）

1. **聚焦法则** — 海报必须有**唯一视觉焦点**，焦点占画面 30-50% 区域
2. **三分法栅格** — 焦点放在三分线交点而非死中央
3. **色彩等级** — 主色面积 ≥ 60%，辅助色 20-30%，中性色填充剩余；禁止三色等分
4. **留白节奏** — 上下左右各留 8-15% 安全边距
5. **品牌一致** — 复用 brand-spec.json 的主色/字体，与 Logo 视觉同源

## Prompt 模板

```
[STYLE_DIRECTIVE]
Brand poster for [BRAND_NAME_EN] ([BRAND_NAME_CN]).
Theme: [POSTER_THEME].
Composition: [COMPOSITION_PATTERN].
Color palette: primary [PRIMARY_HEX] dominant ~60%, accent [ACCENT_HEX] ~25%, neutral [PAPER_HEX] balance.
Mood: [MOOD_KEYWORDS].
Visual elements: [VISUAL_METAPHORS] (no text overlays).
Style: editorial poster, magazine cover quality, flat or semi-flat illustration, vector-friendly.
Output aspect: 9:16 portrait, ready for both print and social media.
[NEGATIVE_PROMPT]
```

**字段填充规则**：
- `POSTER_THEME` 1-2 句话总结海报主题，从用户需求 + brand promise 推导
- `COMPOSITION_PATTERN` 选一种：
  - `central focal hero + radial supporting elements`（焦点居中辐射）
  - `rule-of-thirds with focal element at upper-right intersection, supporting cluster bottom-left`（三分法对角）
  - `vertical layered composition: hero band top, content middle, identity strip bottom`（横向分层）
- `MOOD_KEYWORDS` 3-5 个词，来自 DESIGN.md voice，避免空话
- `VISUAL_METAPHORS` 1-3 个具体可视化的隐喻物（**禁止**抽象词如"未来"/"希望"）
- `NEGATIVE_PROMPT` 固定：`Negative: no realistic human faces, no embedded text, no logos, no watermarks, no copyrighted characters, no clutter, no chromatic aberration.`

## 调用顺序

```
读取 artifacts/<slug>/brand-spec.json + DESIGN.md
↓
text_to_image({
  prompt: <填充后>,
  output_name: "poster/main.png",
  artifact_slug: <slug>,
  aspect: "9:16",
  n: 1
})
↓
保存 poster/README.md 记录 prompt + 排版建议（标题文字位置、Logo 位置）
```

## 反模式

- ❌ **要求海报里出现具体文字** — 文字交给 Figma 后期排版，prompt 中加入"no embedded text"
- ❌ **试图一张海报装下所有信息** — 海报只承担"情绪 + 视觉锤"，详情留给宣传册
- ❌ **强行 photorealistic** — 写实风需要极高 prompt 工程功底，对品牌物料反而显廉价；用 flat / illustrative 更稳
- ❌ **复用 Logo 的 prompt** — Logo 是符号语言，海报是场景语言，应分开重新组织

## 输出样例 prompt（创智学院主视觉）

```
Minimal, modern, brand-identity quality poster.
Brand poster for ChuangZhi Academy (创智学院).
Theme: a new generation of builders learning by shipping real projects.
Composition: rule-of-thirds with focal element at upper-right intersection, supporting cluster bottom-left.
Color palette: primary #2B3FAB dominant ~60%, accent #F2B544 ~25%, neutral #FBFAF6 balance.
Mood: ambitious, grounded, collaborative, optimistic.
Visual elements: a stylized triangle constellation of connected nodes ascending, with subtle blueprint grid background and one rising sunburst at the focal point (no text overlays).
Style: editorial poster, magazine cover quality, flat or semi-flat illustration, vector-friendly.
Output aspect: 9:16 portrait, ready for both print and social media.
Negative: no realistic human faces, no embedded text, no logos, no watermarks, no copyrighted characters, no clutter, no chromatic aberration.
```
