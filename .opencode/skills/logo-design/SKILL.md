---
name: logo-design
description: Logo 设计 prompt 模板。教 designer agent 通过 Task-Level Fan-Out 模式（在单个 logo task 内循环调用 N 次 text_to_image），每次 prompt 锁定一个明确的设计方向，每版都直接渲染中文品牌名（依赖 text-rendering skill）。当 WBS 含 logo 任务时加载。
---

# Logo Design Skill —— Logo 提示词与变体策略（v3.0 修正版）

## 何时加载

WBS 中出现 `category: "logo"` 任务时，designer 必须先 `skill("text-rendering")` 与 `skill("logo-design")`，再调 `text_to_image`。

## 核心策略：双层 Variant Fan-Out（v3.6 升级 · 每类 16 张）

⚠️ **历史教训**：早期 v3.0 版本让 designer 一次 `n=4` 调用 + prompt 里同时列 4 个不同方向 —— 这是 prompt 工程的根本性错误：API 的 `n=4` 行为是"用同一个 prompt 跑 4 个不同 seed"，模型不会自动把 4 个方向分配到 4 张图，反而会揉风格或画 2×2 网格。

**v3.6 正确做法（双层 fan-out）**：
- planner 在 WBS 里只写 **1 个 logo task**，task.variant 是 4 个 direction 字符串数组
- designer **外层循环 4 次**遍历 variant 数组，每次 prompt 锁定**单一 direction**
- **内层每次调 text_to_image 时传 n=4**——让模型在同一方向下产 4 个 seed 探索（笔触/字号/留白微变）
- 总产出：4 direction × 4 seed = **16 张 logo** 给用户挑选

为什么这样做：
- 每次 prompt 单方向 → 模型不会揉风格，每张图是清晰的方向探索
- n=4 让 seed 多样性叠加在 direction 多样性之上 → 探索空间最大
- 复用 task 上下文：brand-spec / DESIGN.md 在 designer 内存只读 1 次，4 次循环共享
- AI 生图不确定性高，单方向出 4 张让用户挑 → 一次跑出可用图的概率从 ~60% 升到 ~95%

## 风格家族库（candidate directions）

下表是 candidate directions，planner 从中**挑 4 个最契合品牌主体类型**填入 task.variant：

| direction id | 风格家族 | 适用调性 | 核心特征 |
|---|---|---|---|
| `wordmark` | 极简字标 | 任何 | 仅品牌中文名 + 1 个微调字符；零图形元素 |
| `abstract-mark` | 图形抽象 | 科技 / 现代 | 1 个抽象几何符号 + 中文小字附属 |
| `seal` | 古印章 | 文旅 / 文化 / 古镇 | 朱砂方印或圆印，篆体单字 / 双字 |
| `emblem` | 古典徽章 | 学院 / 公益 | 圆形或盾形外框 + 内部图文 |
| `combination` | 图文复合 | 消费品 / 餐饮 | 图形与文字平行组合 |
| `handwritten` | 手写笔意 | 文化 / 文创 / 个人 IP | 毛笔或硬笔手写中文 |
| `stencil` | 模板剪切 | 街头 / 潮牌 / 工业 | 镂空字 + 版画质感 |
| `monogram` | 单字徽标 | 时尚 / 奢侈品 | 取品牌首字做艺术化处理 |

planner 在 WBS 中：
```json
{
  "id": "logo",
  "category": "logo",
  "variant": ["wordmark", "seal", "abstract-mark", "handwritten"],
  ...
}
```

## Prompt 模板（**单方向** · 由 designer 循环填充）

```
A premium professional logo design for [BRAND_NAME_CN] [BRAND_DESCRIPTION_BRIEF].
Render the Chinese text "[BRAND_NAME_CN]" (verbatim, no extra characters) in [PRIMARY_FONT_EN] or appropriate Chinese typography. Ensure the Chinese text appears once and only once.

Brand context: [POSITIONING_ONE_LINE].
Brand mood: [MOOD_KEYWORDS_3_TO_5].

Design direction: [DIRECTION_NAME_AND_FULL_DESCRIPTION_HERE]
[一行明确的 single direction description，例如 "Classical Chinese seal stamp aesthetic — vermillion square seal with the brand's main character rendered in bold seal script (Zhuanshu), slight weathered edges suggesting Ming-dynasty craftsmanship, no other elements."]

Color palette: primary [PRIMARY_HEX], accent [ACCENT_HEX], on [BG_HEX] background.
Composition: centered, generous breathing room around the mark, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, scalable to favicon (32×32) without losing legibility.

Negative: no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects, no 2x2 grid layout, no multiple logos in one image, no watermark, no signature.
```

**字段填充规则**：
- `BRAND_NAME_CN` 从 brand-spec.json `brand.name_cn` 取
- `BRAND_DESCRIPTION_BRIEF`：1 句话品牌描述（来自 DESIGN.md §1）
- `POSITIONING_ONE_LINE`：DESIGN.md §1 brand promise 一句话
- `MOOD_KEYWORDS_3_TO_5`：从 DESIGN.md §8 voice 抽 3-5 个调性词
- `PRIMARY_FONT_EN`：从 brand-spec.json `typography.zh.heading` 转英文名
- `PRIMARY_HEX / ACCENT_HEX / BG_HEX`：来自 brand-spec.json `colors`
- `[DIRECTION_NAME_AND_FULL_DESCRIPTION_HERE]`：根据 task.variant 数组当前循环索引取一项 direction，写**单方向完整描述**

## 调用顺序（**循环模式**）

```
读取 artifacts/<slug>/brand-spec.json + DESIGN.md
↓
For direction in task.variant (e.g. ["wordmark", "seal", "abstract-mark", "handwritten"]):
  prompt = 模板填充（DIRECTION 仅当前一项）
  text_to_image({
    prompt: <prompt>,
    output_name: `logo/logo-${direction}.png`,   # 文件名含 direction id
    artifact_slug: <slug>,
    aspect: "1:1",
    n: 4,                  ⚠️ v3.6 关键：每次 n=4 同方向多 seed 探索
    quality: "high"        ⚠️ Logo 必须 high
  })
↓
工具落盘 logo/logo-wordmark.png / logo-seal.png / logo-abstract-mark.png / logo-handwritten.png
↓
designer 写 logo/README.md 记录每版策略 + 推荐使用场景
```

## 实例（朱家角 - 单方向单次调用 · seal 方向）

```
A premium professional logo design for 朱家角 (ZhuJiaJiao Ancient Town), a 1700-year-old Jiangnan water town.
Render the Chinese character "朱" (verbatim, no extra characters) in Chinese Seal Script (Zhuanshu) bold. Ensure the Chinese text appears once and only once.

Brand context: a poetic thousand-year-old water town offering refined Jiangnan cultural experience.
Brand mood: tranquil, refined, nostalgic, poetic, ink-and-water.

Design direction: Classical Chinese seal stamp aesthetic — a vermillion square seal occupying the center, the character 「朱」 rendered in bold Zhuanshu (篆体) seal script reverse-out white inside the red square, slightly weathered edges suggesting Ming-dynasty hand-pressed craftsmanship, no other elements, no decorative borders.

Color palette: primary #C73E2E vermillion red for the seal background, the character 「朱」 in #FBFAF6 reverse-out white, on #FBFAF6 paper-color background.
Composition: centered, generous breathing room around the seal, no gradient, no photo, no 3D.
Output: flat vector-style raster, isolated on plain background, scalable to favicon (32×32) without losing legibility.

Negative: no realistic illustration, no people faces, no copyrighted symbols, no neon, no glow effects, no 2x2 grid layout, no multiple logos in one image, no watermark, no signature.
```

调用：

```
text_to_image({
  prompt: <上面整段>,
  output_name: "logo/logo-seal.png",
  artifact_slug: "zhujiajiao-20260516",
  aspect: "1:1",
  n: 4,
  quality: "high"
})
```

然后下一个循环换成 `wordmark` 方向，再调用一次 —— **总共 4 次工具调用，每次 n=4**，最终落盘 16 张 logo 图。

## 反模式

- ❌ **n=4 + prompt 里列多方向**：API 不会按方向分配，必出垃圾——必须保持外层循环遍历方向 + 内层 n=4 多 seed
- ❌ **同一 task 内多次调用 n=2/n=3**：折中没意义，要么单方向 n=1，要么真的"同方向多 seed 探索"才用 n=2/3
- ❌ **prompt 里指令"必须出现 v1 字标 v2 印章 …"**：模型不擅长按指定顺序产出
- ❌ **不传 quality / 传 medium**：Logo 是品牌根基，必须 high
- ❌ **品牌名超过 6 字时硬塞**：超长品牌名建议 Logo 用品牌名缩写或主字
- ❌ **不读 brand-spec.json 凭印象填色**：HEX 必须从 brand-spec 取
