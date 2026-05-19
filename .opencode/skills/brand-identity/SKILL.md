---
name: brand-identity
description: 品牌识别设计方法论。教 designer agent 如何从一句话需求出发，输出完整的 DESIGN.md 单一事实源（定位/色彩/字体/调性/反模式），作为下游所有视觉与文案物料的约束源。当用户需求涉及"品牌形象/品牌设计/品牌识别/visual identity"时加载。
---

# Brand Identity Skill —— 品牌识别方法论

## 何时加载

只要 planner 给出的 WBS 中包含"brand-spec / DESIGN.md / 品牌定位"任务，designer 必须**最先**调用此 skill，并在所有其他设计任务之前完成 DESIGN.md 输出。

## 工作流（5 步）

1. **背景调研** — 用 `webfetch` 查询品牌主体的真实信息（如"创智学院 上海"），抓取定位、受众、文化基因。若信息稀缺，基于品牌名做合理推断并在 DESIGN.md 中注明"推断"。
2. **方向选择** — 在以下 5 个确定性方向中选 1 个，避免"AI slop"（无方向感的折中风）：
   - **学术经典**：深蓝/酒红主色 + 衬线字体 + 徽章式构图（适合大学/研究机构）
   - **科技先锋**：靛紫/电青主色 + Geometric Sans 字体 + 抽象几何（适合 AI/科技公司）
   - **东方雅韵**：墨黑/朱砂主色 + 宋体/楷书 + 留白构图（适合文旅/文化）
   - **活力创新**：橙黄/翠绿主色 + Rounded Sans + 拼贴风（适合教育/儿童）
   - **极简专业**：单色/低饱和 + Inter/思源 + 网格构图（适合 B2B/工具）
3. **色彩落地** — 给出主色（1 个）、辅助色（1-2 个）、中性色（2-3 个），用 OKLch 表示并附 HEX。例：`Primary #1B3A8A oklch(35% 0.16 260)`
4. **字体落地** — 中英双栈：中文 1 个标题字 + 1 个正文字（推荐"思源宋体/思源黑体/霞鹜文楷"等开源字体）；英文 1 个标题字 + 1 个正文字（Inter / Playfair Display / Geist）
5. **写入 DESIGN.md** — 调用 `write_design_doc` 工具，**9 个 section 全部填写**，不允许某个 section 留空或写"TBD"。

## DESIGN.md 9 个 Section 必填要点

| Section | 必含要素 |
|---|---|
| Positioning | 服务对象 / 核心价值 / 差异化 / 一句话 brand promise |
| Color | 主色 + 辅助色 + 中性色，OKLch 与 HEX 双标 |
| Typography | 中英字体栈 + 字重 + h1-h6 字号 |
| Spacing | 基础单元（推荐 4pt 或 8pt 网格）+ 留白比例 |
| Layout | 栅格列数 + 视觉权重分布 + 信息密度建议 |
| Components | Logo 留白 / 按钮形态 / 卡片圆角 / 图标风格 |
| Motion | 即使是静态设计也填："静态优先；纸面物料无动效" |
| Voice | 人称（"我们/学院"）+ 语气（专业克制/活力亲和）+ 禁用词 |
| Anti-Patterns | 至少 5 条明确禁止：例如"禁止纯渐变背景"/"禁止赛博朋克霓虹色" |

## 材质语言备忘（v3.2 · 升级 colors → 物理质感）

每个色不只是 HEX，还要附**物理材质描述** —— 这让 designer 在 prompt 里能把抽象 HEX 升级到具体物理感。模型 latent 里材质语言比 HEX 强得多。

**5 个品牌方向的材质模板**：

| 方向 | 主色材质 | 辅色材质 | 中性色材质 |
|---|---|---|---|
| **学术经典** | deep ink with matte finish, no reflection | aged brass with soft patina | weighted matte cream paper |
| **科技先锋** | brushed-steel ultramarine, slight metallic flake | OLED screen glow / electric cyan | matte concrete grey |
| **东方雅韵** | matte charcoal ink, completely unreflective | vibrant cinnabar / vermillion red with slight print-varnish sheen | handmade kozo paper with visible plant fibers |
| **活力创新** | glossy candy-coated tangerine | soft-touch matcha green with rubber finish | cream paper with subtle texture |
| **极简专业** | matte black ceramic | soft satin gold leaf | smooth bone-white paper |

**材质描述词汇表**：

| 类型 | 词汇 |
|---|---|
| 表面光泽 | matte / satin / glossy / mirror-finish / varnish-sheen / lacquered |
| 纸张 | weighted matte / handmade / kozo / kraft / coated art / vellum / rice paper |
| 金属 | brushed steel / forged iron / aged brass / polished gold leaf / oxidized copper |
| 织物 | linen weave / silk twill / felt soft / canvas raw / wool felted |
| 木材 | weathered cedar / lacquered cherry / raw oak / charred Shou Sugi Ban |
| 陶瓷 | matte ceramic glaze / glossy porcelain / raku-fired / unglazed terracotta |
| 印刷 | foil-stamped / embossed / debossed / silkscreen ink / letterpress |

**写 brand-spec.json 时的指南**：每个色附 1-2 个材质形容词，让下游 designer 在产品 mockup / 公共家具 / 宣传册 prompt 里直接复用。

```json
"colors": {
  "primary": {
    "hex": "#1A1A1A",
    "oklch": "oklch(20% 0.005 250)",
    "material": "matte charcoal ink, completely unreflective, like deep traditional Chinese ink stick"
  },
  "accent": {
    "hex": "#C73E2E",
    "oklch": "oklch(50% 0.18 25)",
    "material": "vibrant cinnabar vermillion with subtle print-varnish sheen, like hand-pressed seal stamp ink"
  }
}
```

## 输出样例（节选）

```markdown
## 1. Positioning
**创智学院** 是面向 AI 时代的应用型 + 创业型混合教育机构，服务 18-35 岁的开发者与早期创业者。
核心价值：**用真实产业项目代替学院派课堂**。
差异化：**导师 = 在职工程师 + 创业者**，而非纯学者。
Brand promise：**"在做中学，在创中悟"**。

## 2. Color
| 角色 | OKLch | HEX | 物理材质（v3.2 新增） | 用途 |
|---|---|---|---|---|
| Primary  | oklch(45% 0.18 265) | #2B3FAB | brushed-steel ultramarine, matte finish, slightly metallic flake | 主标题 / Logo / CTA |
| Accent   | oklch(78% 0.16 75)  | #F2B544 | warm amber with soft varnish sheen, like polished brass | 强调 / 数据高亮 |
| Ink      | oklch(20% 0.02 250) | #1B1F2A | deep matte charcoal ink, completely unreflective | 正文 |
| Paper    | oklch(98% 0.01 90)  | #FBFAF6 | premium matte cream paper, subtle handmade fiber texture | 背景 |
| Mute     | oklch(72% 0.02 250) | #A9AEB8 | 次要文本 |
```

## 反模式（不要做的事）

- ❌ **方向折中**：同时使用学术经典 + 科技先锋的元素会变成"廉价大学官网"
- ❌ **色板过多**：超过 5 个色（含中性色）就会失控，logo 失去识别度
- ❌ **字体堆叠**：超过 3 种字体会让品牌没有 voice
- ❌ **DESIGN.md 空泛**：每个 section 必须给出**可执行的具体值**，禁止"主色为暖色系"这种废话
- ❌ **忽视 anti-patterns**：anti-patterns 部分是品牌保险丝，至少 5 条
- ❌ **colors 字段缺 material**：v3.2 起每个色必须附物理材质描述，让下游 designer prompt 能直接消费
