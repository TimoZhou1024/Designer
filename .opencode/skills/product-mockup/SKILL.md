---
name: product-mockup
description: 文创周边产品视觉生成 prompt 模板。教 designer agent 把品牌延伸到明信片 / 雪糕 / 丝巾 / 帆布袋 / 笔记本 / 马克杯 / 印章 / 茶具 等实物上，每个产品图直接渲染中文文字（依赖 text-rendering skill）。当 WBS 含 merch / 文创 / 周边 任务时加载。
---

# Product Mockup Skill —— 文创周边视觉生成

## 何时加载

WBS 中出现 `category: "merch"` / 文创 / 周边 / 衍生品 任务时加载。**先 `skill("text-rendering")` 再 `skill("product-mockup")`**。

## 产品形态库（按品牌类型适配）

| 品牌类型 | 推荐产品形态 |
|---|---|
| **文旅古镇** | 明信片 / 雪糕 / 丝巾 / 印章 / 折扇 / 油纸伞 / 茶具 / 笔记本 |
| **教育 / 学院** | 笔记本 / 帆布袋 / T恤 / 徽章 / 马克杯 / 文具盒 |
| **科技 / SaaS** | 贴纸 / 帆布袋 / T恤 / 马克杯 / 鼠标垫 |
| **文化 / 艺术** | 出版物 / 折页 / 海报 / 帆布袋 / 丝巾 |
| **消费品** | 包装纸 / 礼盒 / 购物袋 / 胶带 / 贴纸 |

每张产品图都要回答 3 个问题：
1. **产品视角**：俯视图 / 侧视图 / 立体角度图 / 平铺展开图
2. **场景**：纯白背景孤立 / 摆放在桌面木质感 / 挂在场景墙
3. **文字位置与内容**：从 task.embed_text 取，决定要在产品哪一面渲染

## Prompt 模板

```
Product mockup photography for a [PRODUCT_TYPE] from [BRAND_NAME_CN] brand.
Render the Chinese text "[EMBED_TEXT]" on the product surface in [FONT_EN] [WEIGHT], [PRINT_STYLE_HINT].
Product detail: [PHYSICAL_FORM_DESCRIPTION].
Visual scene: [SCENE_SETTING].
Color palette: primary [PRIMARY_HEX], accent [ACCENT_HEX], on [BG_HEX] background or surface.
Style: [STYLE_HINT — flat lay photo / 3D render / hand-drawn illustration / collage].
Lighting: [LIGHTING_HINT — soft natural / studio softbox / golden hour].
Output aspect: [ASPECT_RATIO].
Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no logos other than the brand's, no watermarks, no copyrighted patterns, no clutter, no realistic human hands holding the product unless specified.
```

**字段填充指引**：
- `PRODUCT_TYPE`：明信片 = postcard / 雪糕 = popsicle / 丝巾 = silk scarf / 帆布袋 = canvas tote / T恤 = T-shirt / 笔记本 = notebook / 马克杯 = ceramic mug / 印章 = stamp seal
- `PRINT_STYLE_HINT`：foil-stamped gold（烫金）/ embossed（压凸）/ silkscreen printed（丝印）/ ink-stamped（印章式）/ embroidered（刺绣）
- `PHYSICAL_FORM_DESCRIPTION`：要详细到能让模型理解产品的物理结构，例如"a silk scarf 90×90cm flat-laid with diagonal folds catching soft light"
- `SCENE_SETTING`：根据品牌调性选——朱家角的产品适合"placed on dark wood grain table next to a porcelain teacup"；创智学院的产品适合"on minimalist concrete surface with subtle blueprint grid"
- `ASPECT_RATIO`：通常 1:1 (产品孤立) / 4:3 (场景中) / 16:9 (banner 用)

## 调用顺序

```
读取 brand-spec.json + DESIGN.md
↓
对每个文创变体任务：
  1. 用 task.variant 决定产品形态
  2. 用 task.embed_text 决定要渲染的文字
  3. 套模板生成 prompt
  4. text_to_image({ prompt, output_name, artifact_slug, aspect: <按产品选>, n: 1 })
↓
写一份 merch/README.md 列出所有产品 + 实际生产工艺建议（材料、工艺、尺寸）
```

## 实例（朱家角 - 明信片）

```
Product mockup photography for a postcard from 朱家角 (ZhuJiaJiao) brand.
Render the Chinese headline "梦回水乡" in Source Han Serif Bold large at the top, and "朱家角 · 千年古镇" in Source Han Serif Regular medium near the bottom, all in vermillion #C73E2E ink on cream paper.
Product detail: a 10×15cm horizontal postcard, slight texture suggesting hand-pressed paper, soft deckle edges.
Visual scene: full-bleed front cover featuring the Fang Sheng arch bridge in ink-wash style across the lower two-thirds, with negative space top for the headline.
Color palette: primary #1A1A1A ink for the bridge illustration, accent #C73E2E vermillion for the text, on warm cream #FBFAF6 paper background.
Style: ink-wash painting illustration combined with classical Chinese postcard aesthetic.
Lighting: soft natural daylight, no harsh shadows.
Output aspect: 4:3 horizontal.
Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no logos other than the brand's, no watermarks, no copyrighted patterns, no clutter, no postage stamps unless specified.
```

## 实例（朱家角 - 雪糕包装）

```
Product mockup photography for three popsicles standing side by side, brand 朱家角 (ZhuJiaJiao).
Render the Chinese text "朱家角" in Source Han Serif Bold and "江南雪糕" in smaller Source Han Sans on each popsicle wrapper, foil-stamped style.
Product detail: three popsicles in a row, each ~10cm long, wrapped in folded paper packaging, slight bite marks not shown.
Visual scene: top-down flat lay on a dark wood grain surface with subtle ink wash brush stroke nearby, soft scattered shadow.
Color palette: primary #C73E2E vermillion red for the wrapper, gold foil text, dark wood #3A2E1E background.
Style: editorial product photography, slightly stylized with subtle ink wash overlay.
Lighting: soft directional from upper-left, gentle highlights on foil text.
Output aspect: 1:1.
Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no other brand logos, no watermarks, no melting effects.
```

## 反模式

- ❌ **生成不存在的怪异产品形态**：不要让模型生成"会发光的明信片"等奇幻产品
- ❌ **场景过于写实导致模型暴露幻觉**：写实人手 / 写实人脸都不要出现在产品图里
- ❌ **传 provider 参数**：违反 designer.md 第 6 条
- ❌ **同一类别 3 张全是同一产品微调**：3 张应该是 3 个不同产品（如明信片 + 雪糕 + 丝巾），而不是 3 张明信片
