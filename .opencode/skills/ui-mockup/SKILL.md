---
name: ui-mockup
description: APP / Web 界面 mockup prompt 模板。教 designer agent 生成在 iPhone / iPad / 笔记本设备外壳中的 UI 截图，含中文导航、按钮、内容（依赖 text-rendering skill）。当 WBS 含 ui / 界面 / app / web 任务时加载。
---

# UI Mockup Skill —— 界面设计 mockup 生成

## 何时加载

WBS 中出现 `category: "ui"` / app / 界面 / 网页设计 任务时加载。**先 `skill("text-rendering")` 再 `skill("ui-mockup")`**。

## 设备外壳模板

| 场景 | 外壳 | 长宽比 |
|---|---|---|
| 移动 APP 单屏 | iPhone 15 / iPhone 16 mockup | 9:19.5 (近似 9:20) |
| 移动 APP 双屏 | 两台 iPhone 并排 | 16:9 横版 |
| 平板 APP | iPad Pro mockup | 4:3 |
| 桌面 web | MacBook Pro 16" mockup | 16:10 |
| 浏览器单屏 | Safari/Chrome 浏览器框 | 16:10 |

## Prompt 工程要点（UI 是 5 类里最难的）

UI mockup 要让模型同时**正确渲染**三层信息：
1. **设备外壳**：iPhone 边框 / 灵动岛 / 圆角 / 摄像头位置
2. **界面布局**：分区清晰（status bar / hero / content / tab bar）
3. **多个中文短文字**：导航 tab / 按钮 / 内容标题 / 信息卡片

每一层都要在 prompt 里**显式分块描述**，不能用一句话概括。

**OpenAI 指南关键洞察**：UI mockup 应该 **"describe the product as if it already exists"**——把它当作"已经发布上线的成熟产品"来描述，而不是设计稿或概念图。这会让模型进入"shipped interface"模式而不是"design sketch"模式，结果显著更可信。

## Prompt 模板（v3.1 · "shipped product" 框架 + 完整 micro_copy 注入）

```
A realistic mobile app UI mockup for [APP_NAME], a [BRAND_DESCRIPTION] that is already launched and used by real users. The app feels practical, polished, and shipped — not a design sketch or concept art.
Show today's [PAGE_TYPE] inside a [DEVICE_FRAME] device shell.

Render the following Chinese text exactly as specified, treating each character as a visual glyph (preserve all strokes, do not interpret semantically). Each text element appears once and only once at its specified location:

  • Hero headline (large, top of content area): "[MICRO_COPY.HEADLINE]"
  • Hero subtitle (smaller, just under headline): "[MICRO_COPY.SUBTITLE]"
  • Bottom tab bar (4 tabs): "[MICRO_COPY.NAVIGATION[0]]" · "[MICRO_COPY.NAVIGATION[1]]" · "[MICRO_COPY.NAVIGATION[2]]" · "[MICRO_COPY.NAVIGATION[3]]"
  • Stat cards (small bold numbers + label, e.g. "12 处必打卡景点"):
      "[MICRO_COPY.DATA_POINTS[0]]" · "[MICRO_COPY.DATA_POINTS[1]]" · "[MICRO_COPY.DATA_POINTS[2]]"
  • Content rows / cards body (medium-small lines):
      "[MICRO_COPY.BODY_LINES[0]]"
      "[MICRO_COPY.BODY_LINES[1]]"
  • Status bar: time "9:41" + signal/battery icons (no carrier text)

Layout breakdown (top to bottom):
- Status bar with time and indicators
- Header / Hero zone with headline and subtitle, accented background
- Stat cards row showing data points as bold numbers
- Content middle: card list / row list as described in body lines
- Bottom tab bar with 4 tabs (line icons above each label)

Color palette: [PRIMARY_HEX] for brand accents and active states, [BG_HEX] for screen background, [INK_HEX] for body text. Visual hierarchy: hero zone visually prominent, tab bar subtle but readable.
Typography: all Chinese in [CHINESE_FONT_EN]; numbers in [MONO_FONT_EN if needed].
Style: minimalist modern mobile UI design, iOS Human Interface Guidelines aesthetic, generous breathing room, subtle natural accent colors. Looks like a real, well-designed, beautiful, shipped app.
Camera angle: device shown perfectly straight from the front (no perspective tilt, no marketing render).

Output aspect: [DEVICE_ASPECT_RATIO].

Negative: no garbled characters, no missing strokes, no Western letters mistaken for Chinese, no character radicals depicted as separate visual elements, no Lorem Ipsum placeholder, no other brand logos like Twitter/Apple/Google in the UI content, no notifications other than what's specified, no real photos that look like stock images, no concept-art "wow" lighting, no clutter, no design-tool watermarks like "Sketch / Figma", no text duplicated more than specified.
```

**字段填充规则**：
- `MICRO_COPY.NAVIGATION` 必须有 4 项（移动 APP tab bar 标准），如果 task 没填，从 brand context 推断 4 个常见 tab
- `MICRO_COPY.DATA_POINTS` 推荐 3 项（适合 hero 区下方的 stat cards 横排）
- `MICRO_COPY.BODY_LINES` 推荐 2 项（适合中部 list 的前两条最显眼内容）
- 任何字段为空都跳过对应行，**不要捏造数字** —— 如 data_points 没数据就在 prompt 里删掉那一行

**字段填充指引**：
- `DEVICE_FRAME`：iPhone 15 Pro / iPhone 16 / iPad Pro 11" / MacBook Pro 16"
- `PAGE_TYPE`：home / discovery / detail / profile / search / checkout
- `HERO_DESCRIPTION`：例 "a full-width photo of Fang Sheng Bridge with subtle dark gradient overlay for text legibility"
- `HERO_TEXT`：从 task.embed_text 头部取
- `CARD_FIELD_DESCRIPTION`：例 "an image, a title, a subtitle, and a small distance/price tag"
- `CARD_TEXT_EXAMPLES`：直接引用真实内容，例 `"放生桥 · 距您 320 米"` / `"北大街 · 2.3km 步行 8 分钟"`
- `TAB_LABELS`：精确 4 个 tab 中文，例 `"探索 / 路线 / 美食 / 我的"`
- `CHINESE_FONT_EN`：Source Han Sans / Noto Sans SC（UI 强烈推荐黑体，不用宋体）
- `DEVICE_ASPECT_RATIO`：iPhone 9:19.5 / iPad 4:3 / MacBook 16:10

## 调用顺序

```
读取 brand-spec.json + DESIGN.md
↓
对每个 UI 变体任务：
  1. 决定页面类型（task.variant）
  2. 列出该页面需要的所有中文短文字（按 layout 分块）
  3. 套模板填充
  4. text_to_image({ prompt, output_name, artifact_slug, aspect: <设备比例>, n: 1 })
↓
写 ui/README.md 含 真实开发栈建议（React Native / Flutter / SwiftUI），交付给前端的 design tokens
```

## 反模式

- ❌ **同时塞超过 6 条中文文字到一个 UI**：模型容易渲染错乱，超过应拆成多张 mockup
- ❌ **使用 Lorem Ipsum 占位**：UI mockup 必须用真实中文内容
- ❌ **要求"3D 透视立体"**：保持设备正面平视最稳定
- ❌ **传 provider 参数**：违反 designer.md 第 6 条
- ❌ **多张 UI 全是首页**：变体应该跨页面（首页 + 详情页 + 我的），而不是首页的 3 个色彩版本
