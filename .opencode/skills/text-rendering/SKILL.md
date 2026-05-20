---
name: text-rendering
description: 让文生图模型稳定渲染中文文字的 prompt 工程最佳实践。所有需要图中含字的 skill 必须引用本 skill 提供的"prompt 文字渲染规则"作为子规则。
---

# Text Rendering Skill —— 中文字渲染 prompt 最佳实践

## 何时加载

任何需要在生成图像里**直接渲染中文文字**的任务（Logo / 海报 / 包装 / 导视 / UI mockup / 宣传册）必须先 `skill("text-rendering")` 加载本规则。

## 背景

2026 年的主流文生图模型（gpt-image-2 / gpt-image-1 / FLUX.1-dev / Recraft v3 / Ideogram v2）已经能在大多数场景稳定渲染中文文字，并且可以直接在 prompt 里承载较多真实中文内容。旧策略"no embedded text + Figma 后期"已经过时——它会浪费模型能力且增加交付复杂度。本 skill 教你如何写出**让模型稳定渲染中文**的 prompt。

## 核心规则（7 条 · 综合 OpenAI gpt-image 官方指南 + 中文场景实战修正）

### 规则 1 ─ 文字内容必须**逐字精确**用直角引号包起来 + 关键词 verbatim

```
✅ 好：The poster shows the headline "梦回水乡" (verbatim, no extra characters) in seal-script Chinese typography.
❌ 差：The poster shows a Chinese title meaning "dream of water town".
```

模型对**精确字符 + verbatim 提醒**的渲染稳定性远高于"含义描述"。直角引号 `「」` 或英文 `"…"` 都可以。在重要文字后面加 `(verbatim, no extra characters)` 是 OpenAI 官方指南的推荐写法，能显著降低模型擅自添加修饰字符的概率。

### 规则 2 ─ 文字渲染指令必须放在 prompt **第一行或第二行**

模型对 prompt 开头部分的关注度最高。把"render Chinese text 「XX」"放在描述完主体之后立刻出现，**不要放到 prompt 末尾**。

```
✅ 好：A minimalist brand logo. Render the Chinese text "朱家角" in Source Han Serif Bold, large and centered. The character strokes should be …
❌ 差：[长篇 prompt 描述] … and please add Chinese text "朱家角" at the bottom.
```

### 规则 3 ─ ⚠️ 严禁字典式拆解 / 偏旁解释 / 字符语义注释

**OpenAI 原指南**说的 `spell out tricky words letter-by-letter` 是针对**英文罕见单词**（K-O-D-A-K 这种字母拼写），**绝不**适用中文。中文场景如果做"字典式拆解"会触发**语义污染**（Semantic Contamination）：

```
❌ 极差（语义污染陷阱）：
  Render "创智学院". Note that 「智」(zhì - intelligence) is composed of 矢 (knife) + 口 (mouth) + 日 (sun).
  → 模型会在背景里偷偷画刀、画嘴、画太阳，污染整张图

❌ 差：
  The brand name 「创智」 means "create intelligence" in English.
  → 模型可能加入 robot / brain / circuit 等 "intelligence" 的视觉联想

✅ 好：
  Render the Chinese text "创智学院" (verbatim, no extra characters). Treat the characters as visual glyphs only — preserve all strokes intact, do not interpret the meaning of individual characters semantically, do not depict their radicals or pictographic origins as visual elements in the background.
```

**实战经验**：现代多模态模型（gpt-image-2 / FLUX.1-dev）对中文字符识别已经是**原生能力**——它知道「朱家角」是怎么写的、怎么连笔。你**只需要给它精确字符 + 字体 + 字号**，让它自己做字形渲染。任何"解释字含义"的注释都是反向干扰。

**唯一可接受的"额外信息"**：当字符**生僻**或**形近字易混**时，可以加 `the character is visually distinct from [类似字符]` —— 这是字形层面的提示，不是语义层面：

```
✅ 可以：For 「日」, ensure it's a square shape with one horizontal middle line — visually distinct from 「目」 which has two middle lines.
❌ 不行：「日」means sun, render the character carefully.
```

### 规则 4 ─ 字体描述用"双路径"——字体名 + anatomy fallback

**底层原理**：图像大模型**没有内置字体文件**（不是 Figma 或浏览器）。它在 latent space 里寻找带有该字体标签的图像特征：
- 主流字体（Source Han Serif / Inter / Helvetica）训练数据里有充分曝光，**直接给名字**就能命中
- 稀有字重 / 小众字体（Source Han Sans Heavy SC / IBM Plex Mono Medium）模型只能"猜"——这时候它需要**字体骨架描述**（Typeface Anatomy）作为兜底

**双路径写法**（推荐）：

```
✅ 最佳：The Chinese text "朱家角" rendered in Source Han Serif Bold — described as a heavy, high-contrast traditional Chinese Serif font (Song-style) with sharp triangular serifs and thick vertical stems.
✅ 可接受：The Chinese text "朱家角" rendered in Source Han Serif Bold.
⚠️ 字重稀有时风险高：The Chinese text rendered in Source Han Serif SC Heavy.
✅ 稀有字体的最佳处理：The Chinese text rendered in a heavy, dramatic-contrast Song-style typeface with sharp terminals and thick stems.
```

**字体名 + anatomy 配对参考表**（designer 在 prompt 里两个一起给）：

| 字体名 | Anatomy 描述（fallback） |
|---|---|
| **中文字体** | |
| Source Han Serif / Noto Serif SC | high-contrast Song-style serif with sharp triangular endings, balanced thick verticals and thin horizontals |
| Source Han Sans / Noto Sans SC | clean modern Chinese sans-serif with even stroke width, geometric construction, neutral reading rhythm |
| Kaiti (楷体) | hand-written Kaishu calligraphy style with brush stroke variation, soft endings, slight slant |
| Chinese Seal Script (Zhuanshu 篆体) | ancient seal-script style with curved bowed strokes, even thickness, archaic stamped character forms |
| Chinese Lishu (隶书) | clerical-script style with horizontal flat strokes, sharp wave endings (蚕头雁尾), wide horizontal proportions |
| Xingshu / Semi-cursive (行书) | flowing semi-cursive brush style with connected strokes, varied speed, calligraphic energy |
| Heiti Heavy (黑体加粗) | thick, even-weight Chinese sans-serif with strong rectangular feel, suitable for posters and signage |
| **西文字体** | |
| Inter / Roboto / Helvetica | clean geometric sans-serif with even stroke width, neutral grotesque style, optimized for screen |
| IBM Plex Sans | technical-feeling humanist sans-serif with subtle stroke contrast, slight stroke endings, professional |
| IBM Plex Mono / JetBrains Mono | clean monospaced typewriter-style font with even character width, technical/coding aesthetic |
| Playfair Display | high-contrast modern serif with dramatic thick-thin transitions, sharp serifs, editorial elegance |
| Inter Bold | heavy geometric sans-serif with strong vertical emphasis, modern UI typography |

**字重 / 大小指令**：
- 字重：bold / regular / light（避免"Heavy"/"Black"等罕见词，改 anatomy 描述里的 `very thick stems`）
- 大小：`large headline / medium subtitle / small caption` 或相对比例 `about 30% of canvas height`
- 中英混排时**显式说**：`Chinese characters in [中文 anatomy]; Latin numbers and English in [西文 anatomy]; both rendered at the same baseline alignment`

```
✅ 好示例：The Chinese text "朱家角" rendered in Source Han Serif Bold (a heavy high-contrast traditional Song-style serif with sharp triangular endings and thick stems), as a large central headline (about 30% of canvas height).
```

### 规则 5 ─ 标点符号与排版方向显式化

中文排版有横排 / 竖排两种传统。竖排能强化古典感，横排现代感。**必须显式说**：

```
horizontal layout / 横排
vertical traditional Chinese reading direction (top-to-bottom, right-to-left) / 竖排
```

中文标点（。「」、）也要显式说，否则模型可能把句号渲染成西文 period。

### 规则 6 ─ 文字数量越少越稳定 + 强制"once and only once"

| 字数 | 渲染稳定性 |
|---|---|
| 1-4 字（如 Logo / 标题） | 极稳定 ✅✅✅ |
| 5-12 字（如 slogan / 副标题） | 稳定 ✅✅ |
| 13-30 字（如一段 tagline） | 稳定 ✅ |
| 30-80 字（如宣传册正文 / UI 说明段） | gpt-image-2 下可用，建议 quality="high" ✅ |
| > 80 字（多段正文 / 表格密集文字） | 建议拆分版面或缩短 ⚠️ |

**经验法则**：若需要长文（如宣传册正文 / UI 界面长说明），优先直接写入真实中文段落，控制在 30-80 字，并简化构图层级。不要用 placeholder strokes 伪装中文正文；那会降低真实交付物质感。

**重复防御**：每条文字渲染指令都要加 `Ensure the text appears once and only once.`，否则模型可能在多个位置重复渲染同一行。OpenAI 指南在 marketing creatives 章节明确这条。

### 规则 7 ─ Quality 等级与类别 Negative Prompt

OpenAI 指南：**密集小字 / 多字体 layout / 含 footnote 必须用 quality="high"**。我们的工具支持透传：

| 任务类型 | 推荐 quality |
|---|---|
| Logo（< 6 字大字） | `high`（笔画清晰最重要） |
| 海报 headline + subtitle（< 20 字） | `high` |
| 宣传册封面（含 footnote） | `high` |
| UI mockup（多个 tab + button 短文字） | `high` |
| 文创周边产品标签 | `medium` |
| 公共家具远景导视 | `medium` |
| 探索性变体 / 草图 | `low` |

Negative prompt 只放**类别级排除项**，例如不要水印、不要无关品牌、不要版权角色、不要过度塑料感、不要 2x2 拼图等。不要再把中文字符渲染纠错写进 Negative 段；中文字形质量由正文 prompt 的精确字符、verbatim、字体、位置和字号约束来保证。

## Prompt 注入模板（已含 OpenAI 指南所有要点 + 中文实战修正）

任何主 skill 的 image prompt 都可在最前面 inject 这一段（替换占位符）：

```
[STYLE_DIRECTIVE].
[BRAND_DESCRIPTION].
Render the Chinese text "[EMBED_TEXT]" (verbatim, no extra characters) in [FONT_EN_NAME] [WEIGHT] (described as [FONT_ANATOMY]), [SIZE_HINT], [LAYOUT_DIRECTION]. Treat the characters as visual glyphs only — preserve all strokes intact, do not interpret the meaning of individual characters semantically, do not depict their radicals as visual elements in the background. Ensure the text appears once and only once.
[REST_OF_PROMPT_BODY].
Negative: [CATEGORY_NEGATIVE_ONLY].
```

## 附录：构图语言备忘（Gestalt 完形心理学 + 视觉张力）

⚠️ **写 prompt 描述 layout / composition 时**，使用以下设计师母语，避免 CSS 思维的过度控制：

| ❌ 不要这么写（CSS 思维） | ✅ 改成这样（设计师母语） |
|---|---|
| `left two thirds vertically stacked` | `the headline anchors the left side, supported by a vertical axis of body text aligned beneath it` |
| `right one third holds a thin vertical hairline` | `the right side breathes as elegant negative space, broken only by a thin vertical alignment guide` |
| `body image occupies 60% of upper area` | `the hero image dominates the upper portion as the primary visual anchor` |
| `headline at exactly upper third intersection` | `headline placed in the upper third, naturally falling near the rule-of-thirds intersection` |
| `tab bar fills bottom 10%` | `tab bar resting at the bottom edge as a clear horizontal foundation` |
| `4 cards in 2x2 grid with 16px gap` | `four cards arranged in a balanced 2x2 cluster with consistent breathing room between them` |

**核心 Gestalt 词汇**：
- `anchor` / `counter-balance`：建立视觉锚点和平衡
- `negative space breathing`：留白节奏
- `aligned axis` / `shared baseline`：对齐线（强化秩序感）
- `cluster` / `gathered`：相似元素的聚集
- `rule of thirds intersection`：三分线交点（保留专业网格语言但不死锁）
- `asymmetrical balance` / `dynamic tension`：非对称张力（最高级的构图技巧）
- `visual rhythm` / `pacing`：视觉节奏

**经验法则**：先描述**视觉意图**（"我想让用户先看到 X，再被 Y 吸引"），再描述**空间逻辑**（"X 锚定 Y 跟随"），**最后**才用方位词（"upper third / lower-left"）。**禁止**用百分比和精确比例切分。

## 反模式

- ❌ 在 prompt 里同时给两套不同文字（"上方写 A，下方写 B"）—— 模型会混淆，建议拆成两次生成
- ❌ 仅用 metaphor 描述文字（"some Chinese characters about peace"）—— 必须给精确字符
- ❌ 字号给具体 px 值 —— 模型不懂 px，给比例描述如 "30% of canvas height"
- ❌ 同时要求复杂构图 + 多行长文字 —— 二选一，长文字时构图必须简化
- ❌ Negative 段保留旧的 "no embedded text" —— 直接覆盖前面所有"渲染中文"的指令
- ❌ 把中文字形纠错放进 Negative 段 —— gpt-image-2 更适合在正文 prompt 里直接接收真实中文与排版约束

## 失败兜底

若多次重跑仍出现明显字形错误（笔画错 / 偏旁错 / 渲染成日文汉字）：
1. 把字数减半（拆成两条 prompt）
2. 把字体改为 Source Han Sans（黑体比宋体更稳）
3. 仍失败 → 降低同张图内的文字层级或拆成多张物料；只有生产稿阶段才考虑后期补字
