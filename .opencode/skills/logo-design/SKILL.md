---
name: logo-design
description: Logo 设计 prompt 模板。教 designer agent 通过单次 n=4 调用让 text_to_image 一次性产出 4 个差异化方向的 Logo（字标 / 抽象图形 / 古印章 / 徽章 / 手写 / 图文复合），每版都直接渲染中文品牌名（依赖 text-rendering skill）。当 WBS 含 logo 任务时加载。
---

# Logo Design Skill —— Logo 提示词与变体策略

## 何时加载

WBS 中出现 `category: "logo"` 任务时，designer 必须先 `skill("text-rendering")` 与 `skill("logo-design")`，再调 `text_to_image`。

## 核心策略：一次 n=4 调用出多版（OpenAI 官方推荐）

**与旧版的关键区别**：planner 在 WBS 里只放**1 个 logo 任务**，designer 调用 `text_to_image({ ..., n: 4 })` **单次出 4 版差异化 Logo**。

为什么这样做（OpenAI 指南依据）：
- **token 节省 ~60%**：4 张图共享一份 prompt 上下文
- **时间节省 ~50%**：单次推理 vs 4 次串行推理
- **变体差异更自然**：模型在同一上下文中"内省"出 4 个不同方向，比 4 次独立调用更协调
- **OpenAI 指南原文**："You can specify parameter 'n' to denote the number of variations you would like to generate."

落盘文件命名：n=4 时工具会自动生成 `logo-1.png` / `logo-2.png` / `logo-3.png` / `logo-4.png`，无需手动后缀。

## 风格家族库（让模型在边界内自由探索）

不再固定 3 种风格——给模型**可选探索清单**，让它从中挑 4 个差异化方向：

| 风格家族 | 适用调性 | 核心特征 |
|---|---|---|
| **字标 (Wordmark)** | 任何 | 仅品牌中文名 + 1 个微调字符；零图形元素 |
| **图形抽象 (Abstract Mark)** | 科技 / 现代 | 1 个抽象几何符号 + 中文小字附属 |
| **古印章 (Seal)** | 文旅 / 文化 / 古镇 | 朱砂方印或圆印，篆体单字 / 双字 |
| **古典徽章 (Emblem)** | 学院 / 公益 | 圆形或盾形外框 + 内部图文 |
| **图文复合 (Combination)** | 消费品 / 餐饮 | 图形与文字平行组合 |
| **手写 (Handwritten)** | 文化 / 文创 / 个人 IP | 毛笔或硬笔手写中文 |

## Prompt 模板（n=4 模式）

```
A premium professional logo design exploration for [BRAND_NAME_CN] [BRAND_DESCRIPTION_BRIEF].
Generate 4 distinct creative directions, each visually different from the others.
Each design should clearly render the Chinese text "[BRAND_NAME_CN]" (verbatim, no extra characters) in [PRIMARY_FONT_EN] or appropriate Chinese typography for the chosen style. Ensure the Chinese text appears once and only once per design.

Brand context: [POSITIONING_ONE_LINE].
Brand mood: [MOOD_KEYWORDS_3_TO_5].

Suggested creative directions to explore (pick 4 distinct ones, do not repeat):
- Minimalist Chinese wordmark with subtle character treatment
- Abstract geometric mark + small wordmark hybrid
- Classical Chinese seal stamp (印章) aesthetic
- Modern emblem with circular border
- Brushwork handwritten / calligraphic style
- Pictorial-text combination logo

Color palette: primary [PRIMARY_HEX], accent [ACCENT_HEX], on [BG_HEX] background.
Composition: each logo centered, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital, scalable to favicon (32x32) without losing legibility.

Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than the brand name itself, no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects.
```

**字段填充规则**：
- `BRAND_NAME_CN` 从 brand-spec.json `brand.name_cn` 取
- `BRAND_DESCRIPTION_BRIEF`：1 句话品牌描述（来自 DESIGN.md §1）
- `POSITIONING_ONE_LINE`：DESIGN.md §1 brand promise 一句话
- `MOOD_KEYWORDS_3_TO_5`：从 DESIGN.md §8 voice 抽 3-5 个调性词
- `PRIMARY_FONT_EN`：从 brand-spec.json `typography.zh.heading` 转英文名
- `PRIMARY_HEX / ACCENT_HEX / BG_HEX`：来自 brand-spec.json `colors`

## 调用顺序（**n=4 模式**）

```
读取 artifacts/<slug>/brand-spec.json + DESIGN.md
↓
单次调用：
  text_to_image({
    prompt: <填充后模板>,
    output_name: "logo/logo.png",
    artifact_slug: <slug>,
    aspect: "1:1",
    n: 4,            ⚠️ 关键：一次 4 版
    quality: "high"  ⚠️ Logo 必须 high（笔画清晰最重要）
  })
  ⚠️ 不传 provider 参数（违反 designer.md 第 6 条硬规则）
↓
工具自动落盘 logo/logo-1.png ~ logo-4.png
↓
designer 写一份 logo/README.md，对每版做"事后命名 + 推荐使用场景"
（不是事先指定 v1=字标，而是看实际生成的图后归类，例如：
  logo-1.png → 极简字标版（推荐用于公文）
  logo-2.png → 古印章版（推荐用于校友勋章）
  logo-3.png → 抽象图形 + 字标（推荐主用，可独立做 favicon）
  logo-4.png → 手写笔意版（推荐用于文创周边））
```

## 实例（朱家角 - 完整 prompt）

```
A premium professional logo design exploration for 朱家角 (ZhuJiaJiao Ancient Town), a 1700-year-old Jiangnan water town in Shanghai known for its arch bridges, canals, and ink-wash aesthetic.
Generate 4 distinct creative directions, each visually different from the others.
Each design should clearly render the Chinese text "朱家角" (verbatim, no extra characters) in Source Han Serif Bold or appropriate Chinese typography for the chosen style. Ensure the Chinese text appears once and only once per design.

Brand context: a poetic thousand-year-old water town offering refined Jiangnan cultural experience.
Brand mood: tranquil, refined, nostalgic, poetic, ink-and-water.

Suggested creative directions to explore (pick 4 distinct ones, do not repeat):
- Minimalist Chinese wordmark with subtle calligraphic ink-stroke treatment
- Classical Chinese seal stamp (印章) — vermillion square seal with the character "朱"
- Pictorial-text combination — abstract arch bridge + 朱家角 wordmark
- Brushwork handwritten / calligraphic style — flowing semi-cursive 朱家角

Color palette: primary #1A1A1A ink black, accent #C73E2E vermillion (used sparingly for seal accents only), on #FBFAF6 paper-color background.
Composition: each logo centered, generous whitespace, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, suitable for both print and digital, scalable to favicon (32x32) without losing legibility.

Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than the brand name itself, no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects.
```

调用：

```
text_to_image({
  prompt: <上面整段>,
  output_name: "logo/logo.png",
  artifact_slug: "zhujiajiao-20260516",
  aspect: "1:1",
  n: 4,
  quality: "high"
})
```

## 反模式

- ❌ **退化为 N 次串行调用**：planner 拆 v1/v2/v3 多个 task 是旧策略，新策略是 1 task + n=4
- ❌ **prompt 里指令"必须出现 v1 字标 v2 印章 …"**：模型不擅长按指定顺序产出，只会把所有要求堆到第一张图。让模型在 "suggested directions" 里**自由挑 4 个不同方向**
- ❌ **不传 quality 参数 / 传 medium**：Logo 是品牌根基，必须 high
- ❌ **品牌名超过 6 字时硬塞**：超长品牌名建议 Logo 用品牌名缩写或主字
- ❌ **不读 brand-spec.json 凭印象填色**：HEX 必须从 brand-spec 取
- ❌ **传 provider 参数给 text_to_image**：违反 designer.md 第 6 条
