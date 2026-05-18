---
name: logo-design
description: Logo 设计 prompt 模板与变体策略。教 designer agent 把品牌定位翻译成 text_to_image prompt，根据品牌类型选择 2-4 种风格家族（如字标 / 抽象图形 / 古印章 / 徽章），每版 Logo 都直接渲染中文品牌名（依赖 text-rendering skill）。当 WBS 含 logo 任务时加载。
---

# Logo Design Skill —— Logo 提示词与变体策略

## 何时加载

WBS 中出现 `category: "logo"` 任务时，designer 必须先 `skill("logo-design")` 与 `skill("text-rendering")`，再调 `text_to_image`。

## 风格家族（按品牌类型适配）

不再固定 3 种风格——根据 brand-spec.json 的 `direction` 字段从下表选 2-4 种作为变体：

| 风格家族 | 适用调性 | 核心特征 |
|---|---|---|
| **字标 (Wordmark)** | 任何 | 仅品牌中文名 + 1 个微调字符；零图形元素；强调字体本身 |
| **图形抽象 (Abstract Mark)** | 科技 / 现代 | 1 个抽象几何符号 + 中文小字附属；符号能在小尺寸单独使用 |
| **古印章 (Seal)** | 文旅 / 文化 / 古镇 | 朱砂方印或圆印，篆体单字 / 双字；明清古印章美学 |
| **古典徽章 (Emblem)** | 学院 / 公益 | 圆形或盾形外框 + 内部图文 + 装饰；正式仪式感 |
| **图文复合 (Combination)** | 消费品 / 餐饮 | 图形与文字平行组合，可单独使用 |
| **手写 (Handwritten)** | 文化 / 文创 / 个人 IP | 毛笔或硬笔手写中文，强调温度感 |

## Prompt 模板（已含 text-rendering 规则）

```
Minimal, modern, brand-identity quality logo.
Render the Chinese text "[BRAND_NAME_CN]" in [FONT_EN_NAME] [WEIGHT], [SIZE_HINT], horizontal layout.
[STYLE_VARIANT_DESCRIPTION].
Brand context: [POSITIONING_ONE_LINE].
Color palette: primary [PRIMARY_HEX], accent [ACCENT_HEX], on [BG_HEX] background.
Composition: centered, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects.
```

**字段填充规则**：
- `BRAND_NAME_CN` 从 brand-spec.json `brand.name_cn` 取
- `FONT_EN_NAME` 从 brand-spec.json `typography.zh.heading` 取，转成 text-rendering skill 的英文名映射
- `STYLE_VARIANT_DESCRIPTION`：根据风格家族填具体描述（参考下方实例）
- `POSITIONING_ONE_LINE`：DESIGN.md §1 brand promise 一句话
- `PRIMARY_HEX / ACCENT_HEX / BG_HEX`：来自 brand-spec.json `colors`

## 调用顺序

```
读取 artifacts/<slug>/brand-spec.json + DESIGN.md
↓
对 WBS 中每个 logo 变体任务：
  1. 用上方模板填充 prompt（注意 embed_text 字段）
  2. text_to_image({
       prompt: <填充后>,
       output_name: <task.deliverable 中的相对路径>,
       artifact_slug: <slug>,
       aspect: "1:1",
       n: 1
     })  ⚠️ 不传 provider 参数（违反 designer.md 第 6 条硬规则）
  3. 检查返回 meta，记录到 logo/README.md
↓
最后写一个 logo/README.md 记录所有版本对比 + 真实使用的 model/endpoint
```

## 实例（朱家角 - 印章版）

```
Minimal, modern, brand-identity quality logo.
Render the Chinese character "朱" in Chinese Seal Script (Zhuanshu) bold, large and centered, occupying about 60% of the canvas height in classical seal layout.
Style variant: ancient Chinese vermillion seal stamp (印章), square shape with subtle weathered edges suggesting Ming-dynasty craftsmanship.
Brand context: a thousand-year-old Jiangnan water town with poetic stillness.
Color palette: primary #C73E2E (vermillion red) for the seal background, the character "朱" in #FBFAF6 reverse-out white, on #FBFAF6 paper-color background.
Composition: centered, generous whitespace around the seal, no gradient, no photo, no 3D, slight texture suggesting hand-pressed ink imprint.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects.
```

## 实例（创智学院 - 抽象图形 + 字标）

```
Minimal, modern, brand-identity quality logo.
Render the Chinese text "创智学院" in Source Han Sans Bold, medium size, horizontal layout, positioned to the right of an abstract mark.
Style variant: abstract geometric mark + wordmark — the mark is a simple ascending-triangle symbol made of three connected nodes, metaphor for collaborative growth and breakthrough.
Brand context: an applied AI institute training pioneers who dare to ship.
Color palette: primary #0D47FF (the mark and wordmark), accent #FF6B2C (the highest node only), on #FBFAF6 background.
Composition: mark on the left, wordmark on the right with proper baseline alignment, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital.
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects.
```

## 反模式

- ❌ **直接复述旧规则 "Chinese text will be added in post"**：本 skill 已升级为图含字策略，不要保留旧策略残留
- ❌ **变体只在颜色或字号上微调**：3 版必须**风格家族不同**，不是同一家族的 3 种字号
- ❌ **品牌名超过 6 字时硬塞进 Logo**：超长品牌名建议 Logo 用品牌名缩写或主字（如"创智学院"可在抽象版只用"创智"）
- ❌ **不读 brand-spec.json 凭印象填色**：HEX 必须从 brand-spec 取，违反则色彩漂移
- ❌ **传 provider 参数给 text_to_image**：违反 designer.md 第 6 条
