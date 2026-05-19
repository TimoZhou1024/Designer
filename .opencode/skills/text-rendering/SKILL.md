---
name: text-rendering
description: 让文生图模型稳定渲染中文文字的 prompt 工程最佳实践。所有需要图中含字的 skill 必须引用本 skill 提供的"prompt 文字渲染规则"作为子规则。
---

# Text Rendering Skill —— 中文字渲染 prompt 最佳实践

## 何时加载

任何需要在生成图像里**直接渲染中文文字**的任务（Logo / 海报 / 包装 / 导视 / UI mockup / 宣传册）必须先 `skill("text-rendering")` 加载本规则。

## 背景

2026 年的主流文生图模型（gpt-image-1 / FLUX.1-dev / Recraft v3 / Ideogram v2）已经能在大多数场景稳定渲染中文文字。旧策略"no embedded text + Figma 后期"已经过时——它会浪费模型能力且增加交付复杂度。本 skill 教你如何写出**让模型稳定渲染中文**的 prompt。

## 核心规则（8 条 · 综合 OpenAI gpt-image 官方指南）

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

### 规则 3 ─ 对**易错字 / 多音字 / 罕见字**做 letter-by-letter spell-out

OpenAI 官方指南提到对 tricky words 要 spell out letter-by-letter。中文的等效操作是：

```
For the headline "創智學院", these are the four traditional Chinese characters: 創 (chuàng - to create), 智 (zhì - intelligence), 學 (xué - to learn), 院 (yuàn - institute). Render all four characters intact, with their traditional simplified strokes preserved.
```

**触发场景**：
- 罕见字：如"朱家角"的"角"在某些字体下笔画易丢失
- 形近字：易被混淆为相似字（"己 / 已 / 巳"、"未 / 末"）
- 多音字 / 歧义字：通过英文音义注释让模型确认这是哪个字

### 规则 4 ─ 显式声明字体名称 + 字重 + 大致大小

字体名用**英文国际通用名**，不用中文名。常用映射：

| 中文字体 | 英文 prompt 用名 |
|---|---|
| 思源宋体 | Source Han Serif / Noto Serif SC |
| 思源黑体 | Source Han Sans / Noto Sans SC |
| 楷体 | Kaiti / Chinese Kaishu |
| 篆体 | Chinese Seal Script / Zhuanshu |
| 隶书 | Chinese Lishu / Clerical Script |
| 行书 | Chinese Xingshu / Semi-cursive |

**字重**：bold / regular / light
**大小**：large headline / medium subtitle / small caption

```
✅ 好：The Chinese text "朱家角" rendered in Source Han Serif Bold as a large central headline (about 30% of canvas height).
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
| 13-30 字（如一段 tagline） | 一般 ⚠️ |
| > 30 字（如正文段落） | 容易出错 ❌ |

**经验法则**：若需要长文（如宣传册正文 / UI 界面长说明），**只 prompt 关键标题字 + 占位段落**，正文段落用"placeholder lorem-style strokes"代替，由 Figma 后期填真实文字。

**重复防御**：每条文字渲染指令都要加 `Ensure the text appears once and only once.`，否则模型可能在多个位置重复渲染同一行。OpenAI 指南在 marketing creatives 章节明确这条。

### 规则 7 ─ Quality 等级与文字密度联动

OpenAI 指南明确：**密集小字 / 多字体 layout / 含 footnote 必须用 quality="high"**。我们的工具支持这个透传：

| 任务类型 | 推荐 quality |
|---|---|
| Logo（< 6 字大字） | `high`（笔画清晰最重要） |
| 海报 headline + subtitle（< 20 字） | `medium` 起步，不满意升 `high` |
| 宣传册封面（含 footnote） | `high` |
| UI mockup（多个 tab + button 短文字） | `high` |
| 文创周边产品标签 | `medium` |
| 公共家具远景导视 | `medium` |
| 探索性变体 / 草图 | `low` |

调用 `text_to_image` 时**必传** `quality` 参数，按上表选择。

### 规则 8 ─ Negative Prompt 要禁止"乱码字"而不是禁止"任何字"

旧 prompt 里的 `no embedded text / no AI hallucinated text` 现在要改成：

```
✅ 好：Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than specified.
❌ 差：Negative: no embedded text, no Chinese characters.
```

后者会让模型连主题文字都不渲染，违背意图。

## Prompt 注入模板（已含 OpenAI 指南所有要点）

任何主 skill 的 image prompt 都可在最前面 inject 这一段（替换占位符）：

```
[STYLE_DIRECTIVE].
[BRAND_DESCRIPTION].
Render the Chinese text "[EMBED_TEXT]" (verbatim, no extra characters) in [FONT_EN_NAME] [WEIGHT], [SIZE_HINT], [LAYOUT_DIRECTION]. Ensure the text appears once and only once.
[OPTIONAL: For tricky characters, spell out: 「[CHAR1]」 means [PINYIN1] - [MEANING1], 「[CHAR2]」 means [PINYIN2] - [MEANING2]. Render all characters intact with strokes preserved.]
[REST_OF_PROMPT_BODY].
Negative: no garbled characters, no Western letters mistaken for Chinese, no missing strokes, no extra strokes, no text duplicated more than specified, [PLUS_CATEGORY_NEGATIVE].
```

## 反模式

- ❌ 在 prompt 里同时给两套不同文字（"上方写 A，下方写 B"）—— 模型会混淆，建议拆成两次生成
- ❌ 仅用 metaphor 描述文字（"some Chinese characters about peace"）—— 必须给精确字符
- ❌ 字号给具体 px 值 —— 模型不懂 px，给比例描述如 "30% of canvas height"
- ❌ 同时要求复杂构图 + 多行长文字 —— 二选一，长文字时构图必须简化
- ❌ Negative 段保留旧的 "no embedded text" —— 直接覆盖前面所有"渲染中文"的指令

## 失败兜底

若多次重跑仍出现明显字形错误（笔画错 / 偏旁错 / 渲染成日文汉字）：
1. 把字数减半（拆成两条 prompt）
2. 把字体改为 Source Han Sans（黑体比宋体更稳）
3. 仍失败 → fallback 到"prompt 中不渲染文字 + 在产物 README 标注后期补字"，并在 critic 报告里扣 Detail 维度分
