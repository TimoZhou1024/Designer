---
name: brochure-design
description: 宣传册 / 折页 / 出版物视觉设计 prompt 模板。教 designer agent 生成封面 / 跨页 / 折页 等印刷物，含中文标题与短文（依赖 text-rendering skill）。当 WBS 含 brochure / 宣传册 / 折页 / 出版物 任务时加载。
---

# Brochure Design Skill —— 宣传册与印刷物

## 何时加载

WBS 中出现 `category: "brochure"` / 宣传册 / 折页 / 出版物 任务时加载。**先 `skill("text-rendering")` 再 `skill("brochure-design")`**。

## 印刷物类型

| 类型 | 主要场景 | 推荐尺寸 |
|---|---|---|
| **封面 (Cover)** | A4 / A5 单面 | 1:1.414 (A 系列纵横比) |
| **跨页 (Spread)** | 翻开两页对版 | 2:1.414 |
| **三折页 (Tri-fold)** | 横向 3 折 | 3:1 |
| **图书封面书脊** | 完整书脊 + 前后封 | 自定 |
| **海报折页** | A2 / A3 大幅折叠 | 1:1.414 |

## 文字承载策略（v3.2 关键升级 · 真文案 > 假占位）

⚠️ **重要修正**：早期版本让模型用 `"abstract horizontal text strokes"` 占位代替真实正文 —— **这是 v1 模型时代的妥协经验**，在 gpt-image-2 上**反而破坏画面质感**。原因：模型 latent 里**没有"假装中文的笔画"特征**，会陷入逻辑混乱生成"外星文"；但**有"editorial body paragraph"清晰特征**，渲染 30-80 字真实段落比假占位**稳定得多**。

**新策略**：

| 文字层 | 处理方式 | 来源 |
|---|---|---|
| Headline / Subtitle / Section title | 真实渲染（必） | `task.micro_copy.headline` 等 |
| **正文段落 (30-80 字)** | **真实渲染**（推荐） | `task.micro_copy.body_paragraph` |
| 长正文 (> 100 字) / 列表 / 联系方式 | 真实短段落 + 后期 InDesign 补长内容 | designer 取 body_paragraph 头部 80 字 |
| 数据 callouts / footnote | 真实渲染（必） | data_points / footnote |
| Lorem Ipsum / 假笔画占位 | ❌ 禁用 | — |

**经验法则**：宁可让模型渲染 **80 字真实可读中文段落**，也不要让它"画假笔画"。前者出来是杂志级质感，后者出来是涂鸦。

## Prompt 模板（v3.2 · OpenAI 指南 "artifact spec" 框架 + 真文案 + 微文案完整层级）

```
Create one [BROCHURE_TYPE] page that feels like a real, published printed brochure for [BRAND_NAME_CN] [BRAND_DESCRIPTION_BRIEF].

Render the following Chinese text exactly as specified, treating each character as a visual glyph (preserve all strokes, do not interpret semantically). Each text element appears once and only once at its specified location:

  • Headline (very large, primary visual focus): "[MICRO_COPY.HEADLINE]"
  • Subtitle (medium, just below headline): "[MICRO_COPY.SUBTITLE]"
  • Body paragraph (real readable Chinese, magazine-style body copy, dense neat justified block, NOT placeholder):
      "[MICRO_COPY.BODY_PARAGRAPH]"
  • Data callouts (small badges or inline highlights, fact-rich):
      "[MICRO_COPY.DATA_POINTS[0]]"  ·  "[MICRO_COPY.DATA_POINTS[1]]"  ·  "[MICRO_COPY.DATA_POINTS[2]]"
  • Footnote (smallest, bottom edge — source / publisher / year): "[MICRO_COPY.FOOTNOTE]"

Typography:
  - Headline in [TITLE_FONT_EN] Bold (described as [TITLE_FONT_ANATOMY])
  - Subtitle in [TITLE_FONT_EN] Regular
  - Body paragraph in [BODY_FONT_EN] Regular small, formatted as a justified block to mimic professional magazine body copy. Line height comfortable for reading, character spacing balanced.
  - Data callouts in [BODY_FONT_EN] Bold small (numbers can be in [MONO_FONT_EN])
  - Footnote in [BODY_FONT_EN] Regular very small

Layout: [LAYOUT_DESCRIPTION — use Gestalt language: anchor, counter-balance, negative space, aligned axis. NO percentage areas, NO grid third切分].
Visual elements: [HERO_VISUAL_DESCRIPTION].
Color palette: [PRIMARY_HEX] rendered as [PRIMARY_MATERIAL_DESCRIPTION] for headline and brand mark, [ACCENT_HEX] as [ACCENT_MATERIAL_DESCRIPTION] for highlights and data callouts, on [BG_HEX] as [PAPER_MATERIAL_DESCRIPTION].
Material suggestion: [PAPER_HINT] (visible in the rendering as subtle texture: weighted matte cream / textured handmade kozo / glossy art coating / kraft natural).
Style: editorial print design, magazine-quality typography, polished spacing, professional print spread aesthetic. Looks like it belongs in a real published brochure, not a template.

Output aspect: [ASPECT_RATIO].

Negative: no text duplicated more than specified, no logos other than the brand's, no watermarks, no Lorem Ipsum, no placeholder typography strokes, no template-style stock layout.
```

**字段填充指引**：
- `MICRO_COPY.BODY_PARAGRAPH` 是 v3.2 新增 —— 当 task 提供时**优先用真实段落**；没提供时省略正文层，不再退回假笔画占位
- 真文案段落控制在 30-80 字最稳定；超过 100 字要么截短要么拆成 2 段

**字段填充指引**：
- `BROCHURE_TYPE`：cover / two-page spread / tri-fold pamphlet
- `LAYOUT_DESCRIPTION`：例 "asymmetric grid with hero image dominating the upper portion, headline anchored in the lower-left, body copy strokes balancing the lower-right"（描述方位与权重，**不要**给精确百分比）
- `HERO_VISUAL_DESCRIPTION`：依品牌调性——朱家角用"ink-wash painting of Fang Sheng Bridge"；学院用"abstract geometric pattern in brand colors"
- `PAPER_HINT`：weighted matte paper / textured handmade paper / glossy art paper / kraft natural paper
- `ASPECT_RATIO`：A4 cover ≈ 0.707:1 → 用 5:7 / spread → 2:1 / tri-fold → 3:1

## 调用顺序

```
读取 brand-spec.json + DESIGN.md + copywriting.md
↓
对每个宣传册变体：
  1. 用 task.variant 决定印刷物类型
  2. 从 copywriting.md 取标题文字
  3. 套模板填充
  4. text_to_image({ prompt, output_name, artifact_slug, aspect: <按尺寸>, n: 1 })
↓
写 brochure/README.md 含 印刷工艺建议（纸张克重、装订、烫金/UV）+ 后期 InDesign 填字模板
```

## 实例（朱家角 - 宣传册封面）

```
A printed brochure cover design for 朱家角 (ZhuJiaJiao Ancient Town), a 1700-year-old Jiangnan water town in Shanghai.
Render the Chinese headline "朱家角" in Source Han Serif Bold, very large (about 30% of canvas height), anchored in the upper-left with strong negative space breathing around it.
Render the Chinese subtitle "千年古镇 · 江南水乡" in Source Han Serif Regular, medium, positioned just below the headline.
Body paragraph near the bottom-left: "朱家角以九条老街、三十六座古桥与水岸人家构成江南生活的温柔切面。清晨的放生桥、午后的阿婆茶、傍晚的摇橹声，共同留下古镇最真实的呼吸。"
Layout: asymmetric layout with the ink-wash hero illustration acting as the primary visual anchor along the right and lower edge, the headline placed at the upper-left as a counter-balance, the body copy and seal stamp aligned along a shared vertical axis below the headline. Strong negative space connects the elements.
Visual elements: ink-wash painting of the Fang Sheng arch bridge fading into mist, with subtle vermillion seal stamp in the lower-right corner.
Color palette: primary #1A1A1A ink black for headline, accent #C73E2E vermillion for seal stamp, neutral cream #FBFAF6 for paper background.
Material suggestion: weighted matte cream paper, visible as very subtle handmade paper texture in the rendering.
Style: editorial print design with classical Chinese aesthetic, magazine-quality typography.
Output aspect: 5:7 (A-series cover).
Negative: no logos other than the brand's, no watermarks, no Lorem Ipsum, no placeholder typography strokes, no real photographs (the visual is illustration only).
```

## 反模式

- ❌ **用假笔画占位替代正文**：gpt-image-2 可以直接承载 30-80 字真实中文段落，优先写真实文案
- ❌ **变体只是色彩或字号微调**：变体应跨"封面 + 跨页 + 折页"，或跨"主题章节"
- ❌ **过度复杂的版式**：宣传册比海报更克制，留白比例应 ≥ 35%
