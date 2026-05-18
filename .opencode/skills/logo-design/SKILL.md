---
name: logo-design
description: Logo 设计 prompt 模板与变体策略。教 designer agent 如何把 DESIGN.md 的品牌定位翻译成 text_to_image prompt，并按"极简字标/图形抽象/古典徽章"三种风格生成 3 版变体，保证品牌一致性的同时给客户多选项。当 WBS 含 logo 任务时加载。
---

# Logo Design Skill —— Logo 提示词与变体策略

## 何时加载

WBS 中出现"logo / 标志 / 标识"任务时，designer 必须先 `skill("logo-design")` 再调 `text_to_image`。

## 三种风格变体（必须全部生成，让客户多选）

| 风格 | 适用场景 | 核心特征 |
|---|---|---|
| **v1 极简字标 (Wordmark)** | 任何场景；首选 | 仅用品牌名 + 1 个微调字符；零图形元素；强调字体本身的设计 |
| **v2 图形抽象 (Abstract Mark)** | 科技/创新品牌 | 1 个抽象几何符号 + 品牌名小字附属；符号能在小尺寸单独使用 |
| **v3 古典徽章 (Emblem)** | 学院/文旅品牌 | 圆形或盾形外框 + 内部图文 + 装饰元素；正式感强 |

## Prompt 模板

所有 prompt **必须遵循**以下结构（顺序不可变）：

```
[STYLE_DIRECTIVE]
A professional logo design for [BRAND_NAME_EN] ([BRAND_NAME_CN]),
[POSITIONING_ONE_LINE].
Style: [STYLE_VARIANT].
Color palette: primary [PRIMARY_HEX], accent [ACCENT_HEX], on [BG_HEX] background.
Typography reference: [FONT_STACK].
Composition: centered, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital.
[NEGATIVE_PROMPT]
```

**字段填充规则**：
- `STYLE_DIRECTIVE` 固定："Minimal, modern, brand-identity quality logo."
- `BRAND_NAME_EN` / `BRAND_NAME_CN` 从 DESIGN.md Positioning 抽取
- `POSITIONING_ONE_LINE` 用 DESIGN.md 的 brand promise（不超过 15 词英文）
- `STYLE_VARIANT` 取下表：
  - v1: `minimalist wordmark, refined typography, only the brand name with subtle character treatment`
  - v2: `abstract geometric mark + small wordmark, the mark is a simple [圆/三角/方/线条] symbol metaphor for [品牌核心隐喻]`
  - v3: `classical emblem with circular/shield border, brand name arched at top, small icon center, est. year at bottom`
- `PRIMARY_HEX` / `ACCENT_HEX` / `BG_HEX` 来自 brand-spec.json colors
- `FONT_STACK` 中英各 1 个字体
- `NEGATIVE_PROMPT` 固定：`Negative: no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects, no AI hallucinated text.`

## 调用顺序

```
读取 artifacts/<slug>/brand-spec.json
↓
对每个变体 v1/v2/v3：
  1. 用上面模板填充得到 prompt
  2. text_to_image({
       prompt: <填充后>,
       output_name: "logo/v{1,2,3}-{minimal,abstract,emblem}.png",
       artifact_slug: <slug>,
       aspect: "1:1",
       n: 1
     })
↓
最后写一个 logo/README.md 记录 3 版 prompt + 选择建议
```

## 反模式

- ❌ **不要**在 prompt 里要求文字（AI 文生图对中文文字几乎必坏）。Logo 中的文字交给后期 PS / Figma 排版，AI 只生成图形部分或纯英文
- ❌ **不要**在 prompt 里写"漂亮/精美/4K/高清"这种空话——它们让模型走向 AI slop
- ❌ **不要**让 3 版风格趋同（v1 v2 v3 必须**视觉显著差异**），否则失去多选意义
- ❌ **不要**用渐变 / 霓虹 / 玻璃拟态 —— 这些是流行趋势但 5 年内会过时

## 输出样例 prompt（创智学院 v2 图形抽象）

```
Minimal, modern, brand-identity quality logo.
A professional logo design for ChuangZhi Academy (创智学院),
an applied AI education institute where engineers and founders learn by doing.
Style: abstract geometric mark + small wordmark, the mark is a simple ascending-triangle symbol made of three nodes connected by lines, metaphor for collaborative growth.
Color palette: primary #2B3FAB, accent #F2B544, on #FBFAF6 background.
Typography reference: Inter Bold (English), Source Han Serif Bold (Chinese).
Composition: centered, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital.
Negative: no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects, no AI hallucinated text.
```
