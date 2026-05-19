---
name: public-furniture
description: 公共家具与导视系统视觉生成 prompt 模板。教 designer agent 把品牌延伸到导视牌 / 公共座椅 / 灯笼 / 路标 / 信息亭 等户外公共物件，每个图直接渲染中文（依赖 text-rendering skill）。当 WBS 含 furniture / 公共家具 / 导视 任务时加载。
---

# Public Furniture Skill —— 公共家具与导视系统

## 何时加载

WBS 中出现 `category: "furniture"` / 公共家具 / 导视 / 街头家具 任务时加载。**先 `skill("text-rendering")` 再 `skill("public-furniture")`**。

## 物件类型库

| 物件 | 主要应用场景 | 文字承载量 |
|---|---|---|
| **导视牌 (Signage)** | 景区路口 / 校园岔路 / 城市地标指引 | 大（含路名 + 距离） |
| **公共座椅 (Bench)** | 古镇巷道 / 校园广场 / 商业街 | 小（仅 Logo） |
| **路标灯柱 (Lamp Post)** | 古镇街道 / 校园主路 | 中（仅地名 + 编号） |
| **信息亭 (Kiosk)** | 入口 / 集散广场 | 大（说明 + 地图） |
| **古镇灯笼 (Lantern)** | 古镇街巷悬挂 | 小（单字 / 双字） |
| **校园展示架 (Display Board)** | 校园公告区 | 大（标题 + 正文占位） |

## Prompt 模板（v3.2 · OpenAI 指南 architectural visualization + 35mm film 参数）

OpenAI 指南：环境物件 / 公共家具最稳定的模式词是 **"architectural visualization" / "real-world setting" / "photographed in situ"**——这会触发模型用建筑可视化级别的材质、光影、比例来渲染物件。

⚠️ **v3.2 关键升级**：加入**光学参数**——35mm architectural film photograph + eye-level + natural sidelight。这是触发"街拍真实感"latent 的开关，让模型从"产品孤立"切到"嵌入街景"。

```
Shot like a 35mm architectural film photograph of a [FURNITURE_TYPE] for [BRAND_NAME_CN], photographed in its real-world setting as if it were already installed and in use.
Render the Chinese text "[EMBED_TEXT]" (verbatim, no extra characters) on the [SURFACE_DETAIL] in [FONT_EN] [WEIGHT] (described as [FONT_ANATOMY]), [SIZE_HINT]. Ensure the text appears once and only once.

Furniture detail: [PHYSICAL_DESCRIPTION].

Setting: [LOCATION_CONTEXT].

Material palette: [PRIMARY_MATERIAL_WITH_REALISM] (e.g. weathered cedar wood with visible grain and slight knots) for the structure, [ACCENT_MATERIAL_WITH_REALISM] (e.g. blackened forged iron with subtle hammer marks) for the text and brand mark.
Material realism: real material wear — slightly weathered patina / fresh installation gloss / aged copper green / hand-tooled imperfections. NO factory-perfect plastic look.
Color palette: complementing the brand's [PRIMARY_HEX] subtly through material tone, not direct color overlay.

Optical setup (camera + lighting):
  - 35mm film photograph aesthetic, eye-level (~1.6m human height) — as if a passerby took the photo
  - [LIGHTING_HINT — soft afternoon sidelight from west / golden-hour warm directional / overcast diffuse north light]
  - Realistic ambient shadows on the ground, subtle atmospheric depth
  - Subtle 35mm film grain
  - Natural color balance, NO HDR, NO color grading, NO cinematic LUT

Style: architectural visualization with cinematic atmosphere (NOT product render, NOT studio isolation).
Camera angle: [ANGLE_HINT — three-quarter view / low angle / direct front], at human eye level.
Output aspect: 4:3 or 16:9 for full scene context.

Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no character radicals depicted as separate visual elements, no text duplicated more than specified, no realistic human faces, no other brand logos, no watermarks, no neon, no studio-isolated product look, no levitating objects, no plastic-shiny CG surfaces.
```

**字段填充指引**：
- `FURNITURE_TYPE`：wayfinding signage post / public bench / street lamp post / information kiosk / hanging lantern
- `SURFACE_DETAIL`：metal plate / wood panel / lantern paper / engraved stone block
- `PHYSICAL_DESCRIPTION`：例 "a ~2m tall vertical signage post made of weathered cedar wood with a forged-iron top plate, slightly tilted toward the path"
- `LOCATION_CONTEXT`：古镇 = "stone-paved alley with whitewashed walls and tiled rooftops in the background"；校园 = "modern campus plaza with concrete benches and young trees"
- `PRIMARY_MATERIAL` / `ACCENT_MATERIAL`：依品牌调性选——文旅古镇用 weathered wood + iron + handmade paper；学院用 brushed steel + concrete + glass
- `STYLE_HINT`：默认 architectural visualization 最稳定

## 调用顺序

```
读取 brand-spec.json
↓
对每个公共家具变体任务：
  1. 用 task.variant 决定物件类型
  2. 用 task.embed_text 决定承载文字
  3. 套模板生成 prompt
  4. text_to_image({ prompt, output_name, artifact_slug, aspect: "4:3" or "16:9", n: 1 })
↓
写 furniture/README.md 含 实际制作工艺建议（材料、尺寸、安装方式）
```

## 实例（朱家角 - 导视牌）

```
Architectural rendering of a wayfinding signage post for 朱家角 ancient town in its real-world setting.
Render the Chinese text "朱家角古镇" as the large headline and "↑ 北大街" as the directional indicator on the iron name plate, in Source Han Serif Bold, deeply engraved.
Furniture detail: a ~1.8m tall vertical signage post made of weathered Ming-dynasty style cedar wood with mortise-and-tenon joinery, topped with a hand-forged blackened iron plate ~30×60cm tilted at 15°, slightly tilted toward the alley.
Setting: a stone-paved Jiangnan alley with whitewashed walls and dark tiled rooftops in the background, soft afternoon mist.
Material palette: weathered cedar wood for the post structure, blackened forged iron for the name plate, vermillion-painted accents on small details.
Color palette: complementing #1A1A1A ink black with subtle #C73E2E vermillion seal stamp.
Style: architectural visualization with cinematic atmosphere.
Camera angle: three-quarter view from a pedestrian's eye level.
Lighting: soft afternoon sidelight casting gentle shadow toward foreground.
Output aspect: 4:3 portrait-of-place.
Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no realistic human faces, no other brand logos, no watermarks, no neon, no modern street signs.
```

## 反模式

- ❌ **现代品牌用古镇风格家具或反之**：导视风格必须服从 brand-spec.direction
- ❌ **生成科幻发光家具**：除非品牌方向明确科技未来，否则保持物质感真实
- ❌ **把文字写在不合理的位置**：例如把"北大街"写在凳子靠背上
