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

## 文字承载策略

宣传册的文字承载量介于"海报"与"网页正文"之间——既要有视觉冲击力的标题，又要让读者能阅读基础信息。**关键经验**：

- **必渲染**：封面大标题（4-12 字）/ 副标题（≤ 20 字）/ 章节标题
- **占位为主**：正文段落用 "abstract horizontal text strokes suggesting body copy" 让模型生成**笔画状的占位线条**而不是真实长文，由后期 InDesign / Figma 填真文字
- **不渲染**：长段落 / 项目列表 / 联系方式（这些都后期补）

这个策略平衡了"图含字"的演示效果与"长文易出错"的模型能力边界。

## Prompt 模板

```
A printed [BROCHURE_TYPE] design for [BRAND_NAME_CN] [BRAND_DESCRIPTION_BRIEF].
Render the Chinese headline "[HEADLINE_TEXT]" in [TITLE_FONT_EN] Bold, very large, positioned [TITLE_POSITION].
Render the Chinese subtitle "[SUBTITLE_TEXT]" in [TITLE_FONT_EN] Regular, medium, positioned [SUBTITLE_POSITION].
[OPTIONAL: Render section heading "[SECTION_TEXT]" in [BODY_FONT_EN] Bold small, [SECTION_POSITION].]
Body content: abstract horizontal text strokes suggesting paragraph body copy, no actual readable Chinese paragraph text (placeholder).
Layout: [LAYOUT_DESCRIPTION].
Visual elements: [HERO_VISUAL_DESCRIPTION].
Color palette: primary [PRIMARY_HEX] for headline and brand mark, [ACCENT_HEX] for highlights, neutral [BG_HEX] for paper.
Material suggestion: [PAPER_HINT] (visible in the rendering as subtle texture).
Style: editorial print design, magazine-quality typography, clean modern layout.
Output aspect: [ASPECT_RATIO].
Negative: no garbled characters in the headline/subtitle/section, no missing strokes, no Western letters mistaken for Chinese in the title areas, no logos other than the brand's, no watermarks, no Lorem Ipsum (the placeholder body copy should look like Chinese strokes, not Latin letters).
```

**字段填充指引**：
- `BROCHURE_TYPE`：cover / two-page spread / tri-fold pamphlet
- `LAYOUT_DESCRIPTION`：例 "asymmetric grid with hero image occupying 60% upper area, headline in lower-left third, body copy strokes filling lower-right third"
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
Render the Chinese headline "朱家角" in Source Han Serif Bold, very large (about 30% of canvas height), positioned in the upper-left third.
Render the Chinese subtitle "千年古镇 · 江南水乡" in Source Han Serif Regular, medium, positioned just below the headline.
Body content: abstract horizontal text strokes suggesting paragraph body copy near the bottom-left, no actual readable Chinese paragraph text (placeholder).
Layout: asymmetric vertical layout with ink-wash hero illustration occupying right two-thirds and lower half, headline area on upper-left with generous whitespace.
Visual elements: ink-wash painting of the Fang Sheng arch bridge fading into mist, with subtle vermillion seal stamp in the lower-right corner.
Color palette: primary #1A1A1A ink black for headline, accent #C73E2E vermillion for seal stamp, neutral cream #FBFAF6 for paper background.
Material suggestion: weighted matte cream paper, visible as very subtle handmade paper texture in the rendering.
Style: editorial print design with classical Chinese aesthetic, magazine-quality typography.
Output aspect: 5:7 (A-series cover).
Negative: no garbled characters in the headline/subtitle, no missing strokes, no Western letters mistaken for Chinese in the title areas, no logos other than the brand's, no watermarks, no Lorem Ipsum, no real photographs (the visual is illustration only).
```

## 反模式

- ❌ **要求模型渲染长段中文正文**：超过 30 字的长文必失败，用 placeholder strokes
- ❌ **变体只是色彩或字号微调**：变体应跨"封面 + 跨页 + 折页"，或跨"主题章节"
- ❌ **传 provider 参数**：违反 designer.md 第 6 条
- ❌ **过度复杂的版式**：宣传册比海报更克制，留白比例应 ≥ 35%
