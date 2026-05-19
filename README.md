# Designer Multi-Agent · 多智能体平面设计系统

> 夏令营实训课题《AI for Design》：基于 [Open Code](https://opencode.ai/) Harness 框架构建的轻量版 Open Design / Claude Design 复刻系统，实现自然语言驱动的 Vibe Design 能力。

## 1. 它是什么

一个 Open Code 的项目级插件包（`.opencode/` 目录 + `opencode.json`），把 Open Code 的 Coding Agent 改造成 **Design Agent Harness**。用户输入一句话设计需求（例如"请为创智学院做一套品牌形象设计"），系统会自主完成：

1. **需求理解** → 拆解成 5-7 个带依赖的设计任务（WBS）
2. **品牌策略** → 输出 `DESIGN.md` 单一事实源（定位 / 色彩 / 字体 / 调性 / 反模式）
3. **创意文案** → slogan / 品牌主张 / tagline / 应用场景文案
4. **视觉资产** → 3 版 Logo + 1 张主视觉海报（通过 `text_to_image` 工具生成）
5. **质量评审** → 5 维 rubric 自评 + 改进建议，必要时自动迭代一轮

所有产物以"项目包"形式落盘到 `artifacts/<slug-timestamp>/`。

## 2. 架构一览

```
┌──────────────────────────────────────────────────────────────┐
│  /design "请为 XX 做品牌形象设计"                              │
│         ↓                                                    │
│  design-orchestrator (primary agent)                         │
│      ├─ task(planner)     → WBS JSON                         │
│      ├─ task(designer)    → 调用 skills + text_to_image      │
│      └─ task(critic)      → 5 维评分 + 改进建议                │
│                                                              │
│  共享工具:  text_to_image | save_artifact | write_design_doc │
│  共享方法论: 5 个 SKILL.md (brand / logo / poster / 文案 / 评审)│
└──────────────────────────────────────────────────────────────┘
```

详细架构图与 dataflow 见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 3. 目录结构

```
D:/Designer/
├── opencode.json                # 主配置：providers / agents / permissions
├── package.json                 # Open Code plugin 依赖
├── .env.example                 # API key 模板
├── .opencode/
│   ├── agents/                  # 4 个 agent (orchestrator + 3 个子)
│   ├── tools/                   # 3 个自定义工具 (TS)
│   ├── skills/                  # 5 个设计方法论 skill (Markdown)
│   └── commands/                # /design 入口命令
├── artifacts/                   # 运行时产物 (gitignored)
├── docs/
│   ├── ARCHITECTURE.md          # 技术架构文档
│   └── slides/deck.md           # 3 页 PPT (Marp)
└── reference/                   # 课题原文
```

## 4. 快速开始

### 4.1 安装 Open Code

```bash
# macOS / Linux
curl -fsSL https://opencode.ai/install | bash

# Windows (PowerShell)
irm https://opencode.ai/install.ps1 | iex
```

### 4.2 配置 API key

```powershell
cp .env.example .env
# 编辑 .env 填入 MINIMAX_API_KEY (或 OPENAI_API_KEY)
```

### 4.3 安装依赖

```powershell
bun install
```

### 4.4 运行（双模式）

**模式 A · 全自动** （默认）：

```powershell
opencode
# /design 请为创智学院做一套品牌形象设计
```

20 分钟内一气呵成，全程无人工干预。

**模式 B · 人机协同动态问卷**（v3.4 升级）：

```powershell
opencode
# /design-review 请为创智学院做一套品牌形象设计
```

planner 在 designer 启动前**主动出题**——基于 brief 自主生成 5-8 个关键偏好选项（带风险等级、默认值、AI 推荐理由）：

```
🎨 设计偏好选择

我已经做完调研。在生成最终方案之前，请选择以下 5 个关键偏好。
⭐ 标记的是我基于调研推荐的默认选项。

1 / 5 · 品牌设计方向 · 风险等级：致命
| 选 | 标识 | 选项 | 说明 |
| ⭐ | oriental-elegance | 东方雅韵 | 墨黑+朱砂 / 衬线 / 留白 |
|   | vibrant-modern | 活力创新 | 橙绿主色 / 圆润黑体 |
|   | academic-classic | 学术经典 | 深蓝+酒红 / 徽章式 |

2 / 5 · 设计类别组合 · 风险等级：重要
（多选，含 logo / poster / merch / furniture / ui / brochure）

...
```

用户回复方式：
- `全部默认` → 一键通过所有 ⭐ 推荐项
- 结构化或自然语言调整（如"画面密度选 minimal"）
- `重新出题` 或 `取消`

用户选择**作为硬约束**级联到 wbs 与所有下游 prompt，保证偏好真正落地而不是表面对话。

适合关键品牌 / 答辩演示 / 心中有偏好但没想过如何表达的场景。决策过程透明可追溯，但**不强制人工干预**——一句"全部默认"即可全程不调整推进。

---

完成后到 `artifacts/<brand-slug>-<timestamp>/` 查看产出。

## 5. 设计资产示例（创智学院 demo）

```
artifacts/chuangzhi-college-20260514/
├── DESIGN.md              # 品牌单一事实源 (9 sections)
├── brand-spec.json        # 机器可读色板/字体 token
├── copywriting.md         # 创意文案合集
├── logo/
│   ├── v1-minimal.png     # 极简字标风
│   ├── v2-abstract.png    # 图形抽象风
│   └── v3-emblem.png      # 古典徽章风
├── poster/
│   └── main.png           # 主视觉海报
└── critique-report.md     # 5 维评分 + 建议
```

## 6. 课题要求映射

| 课题要求 | 实现 |
|---|---|
| ① 三个独立上下文 agent (Planner/Designer/Critic) | `.opencode/agents/{planner,designer,critic}.md` 各自 `subagent` 模式 |
| ② 设计工具 (文生图等) | `.opencode/tools/text_to_image.ts` (多 provider 适配器) + `save_artifact.ts` + `write_design_doc.ts` |
| ③ Agent Harness (调度/传递/上下文/错误处理) | 复用 Open Code 内置 `task` 工具 + subagent 隔离 + orchestrator 的 retry 逻辑 |
| ④ CLI 交互 | Open Code TUI + `/design` slash command |
| ⑤ 创意文案生成 | `skills/creative-copywriting/` + designer 流程固定环节 |

## 7. License

MIT，仅用于夏令营课题交付。
