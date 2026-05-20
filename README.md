# Designer Multi-Agent · 多智能体平面设计系统

> 夏令营实训课题《AI for Design》交付包
> 基于 [Open Code](https://opencode.ai/) Harness 构建的轻量版 Claude Design / Open Design 复刻——一句话自然语言驱动的 Vibe Design 系统。

```
用户：/design 请为创智学院做一套品牌形象设计
       │
       ▼
🧭 design-orchestrator (primary)
       │
       ├──> 🔍 researcher  ─── webfetch 多源调研 → research-brief.md
       ├──> 📋 planner    ─── 智能拆解 ≥4 类设计 + 动态问卷（review 模式）
       ├──> 🎨 designer   ─── 多类别多变体生成 + 中文渲染 + 微文案完整层级
       └──> 🔬 critic     ─── 5 维 rubric 评审 + 自动 retry
       │
       ▼
artifacts/<slug>/  含 DESIGN.md / brand-spec.json / copywriting.md /
                     logo×4 / poster×N / merch×3 / ui×2 / brochure / critique-report.md
```

---

## 1. 一句话定位

**4 智能体协同 × 10 设计方法论 × 3 工具，让 AI 像设计团队一样工作**——只需一句中文需求，自动产出**含中文文字渲染**的完整品牌设计包（≥4 个类别，每类 4 direction × 4 seed = **16 张图给用户挑选**），全程 ~60 分钟无人工干预；可选 review 模式让用户在关键决策点参与（动态问卷）。

## 2. 核心能力（v3.5）

| 能力 | 实现 |
|---|---|
| **多智能体协同** | 4 个 subagent（researcher / planner / designer / critic），每个独立上下文窗口 + tools 白名单隔离 |
| **设计方法论沉淀** | 8 个 SKILL.md：brand-identity / logo-design / poster-composition / product-mockup / public-furniture / ui-mockup / brochure-design / text-rendering + design-critique / creative-copywriting |
| **图含中文文字渲染** | text-rendering skill 7 条规则：verbatim 引用 + once-and-only-once + 字体 anatomy fallback + 反语义污染 |
| **微文案完整层级** | task.micro_copy 字段：headline / subtitle / body_paragraph / data_points / footnote / navigation —— 把"AI 通稿"升级为"真实交付物" |
| **双层 fan-out · 每类 16 张**（v3.6） | 外层循环 4 direction × 内层 n=4 seed = 每类 16 张图给用户挑选；总产出 ~80 张满足 AI 生图不确定性 |
| **多 Provider 适配器** | text_to_image 工具支持 MiniMax / OpenAI / 通义万相 / **任意 OpenAI 兼容 API**（custom），切换只需改 .env |
| **双模式 UX** | `/design`（auto 全自动）+ `/design-review`（动态问卷 → 用户选偏好 → 偏好硬约束） |
| **质量自评 + retry** | critic 5 维 rubric（Philosophy / Hierarchy / Detail / Function / Innovation）；总分 < 35 自动 retry 一次 |
| **Schema 防越权** | text_to_image 工具 schema 物理收敛到 6 字段，LLM 无法越权传 provider/model/key |

## 3. 整体架构

```
┌─────────────────────────────────────────────────────────────────────┐
│  USER: /design <自然语言需求>                                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  🧭 design-orchestrator (primary agent)                             │
│     工作流: Step 0 slug → 0.5 调研 → 1 规划 → 2 执行 → 3 评审       │
│             → 4 条件 retry → 5 汇总输出                              │
│     review 模式: Step 1 扩展为 1a 出题 → 1b 用户答题 → 1c 偏好规划   │
└─────────────────────────────────────────────────────────────────────┘
        │                │                │                │
        ▼                ▼                ▼                ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │🔍 researcher│   │📋 planner │   │🎨 designer│   │🔬 critic │
   │ webfetch  │   │ 3 modes:  │   │ 多类别+   │   │ 5 维     │
   │ 4 来源调研 │   │ plan/     │   │ 多变体    │   │ rubric   │
   │ 输出 brief│   │ options/  │   │ 中文渲染   │   │ 自动     │
   │ 7 sections│   │ choices   │   │ 微文案    │   │ retry    │
   └─────────┘      └─────────┘      └─────────┘      └─────────┘
        │                │                │                │
        └────────────────┴────────────────┴────────────────┘
                                │
                          按需加载 skill ↓
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   方法论层（8 SKILL.md）                            副作用层（3 工具）
   ┌──────────────────────┐     ┌──────────────────────┐
   │ • brand-identity     │     │ • text_to_image.ts   │
   │ • logo-design        │     │   (4 provider 适配器) │
   │ • poster-composition │     │ • write_design_doc.ts│
   │ • product-mockup     │     │ • save_artifact.ts   │
   │ • public-furniture   │     └──────────────────────┘
   │ • ui-mockup          │
   │ • brochure-design    │
   │ • creative-copywriting│
   │ + text-rendering     │
   │ + design-critique    │
   └──────────────────────┘
                                │
                                ▼
   artifacts/<brand-slug>-<timestamp>/
   ├── research-brief.md         # researcher 调研报告（7 sections）
   ├── DESIGN.md                 # 品牌单一事实源（9 sections）
   ├── brand-spec.json           # 机器可读 token（含材质字段）
   ├── copywriting.md            # 创意文案合集（slogan / 主张 / tagline / 场景）
   ├── logo/                     # 4 方向 Logo + README
   ├── poster/                   # 多张主视觉
   ├── merch/ furniture/ ui/ brochure/  # 按 planner 决定的类别
   └── critique-report.md        # 5 维评审报告
```

## 4. 目录结构

```
D:/Designer/
├── opencode.json                # 主配置：providers / agents / permissions
├── package.json                 # @opencode-ai/plugin 依赖（bun runtime）
├── .env.example                 # API key 模板（含 4 provider 配置示例）
├── .opencode/
│   ├── agents/                  # 5 个 agent
│   │   ├── design-orchestrator.md   # primary, 双模式工作流调度
│   │   ├── researcher.md            # webfetch 多源调研
│   │   ├── planner.md               # 3 mode: plan / options / plan-with-choices
│   │   ├── designer.md              # 多类别多变体执行
│   │   └── critic.md                # 5 维质量评审
│   ├── tools/                   # 3 个自定义 TS 工具
│   │   ├── text_to_image.ts         # 多 provider 适配器（含 .env 自动加载）
│   │   ├── write_design_doc.ts      # 结构化 DESIGN.md 写入
│   │   └── save_artifact.ts         # 通用 artifact 落盘
│   ├── skills/                  # 10 个方法论 SKILL.md
│   │   ├── brand-identity/          # 品牌方向 5 选 1 + 9 sections schema
│   │   ├── creative-copywriting/    # slogan / 主张 / tagline / 场景文案
│   │   ├── text-rendering/          # 中文文字渲染 7 条规则
│   │   ├── logo-design/             # Task-Level Fan-Out 多方向探索
│   │   ├── poster-composition/      # 海报构图 + 完整微文案
│   │   ├── product-mockup/          # 文创周边产品摄影
│   │   ├── public-furniture/        # 公共家具建筑可视化
│   │   ├── ui-mockup/               # APP/Web UI shipped product 框架
│   │   ├── brochure-design/         # 宣传册 artifact spec 框架
│   │   └── design-critique/         # 5 维 rubric
│   └── commands/                # 2 个 slash 命令
│       ├── design.md                # /design auto 模式入口
│       └── design-review.md         # /design-review 交互模式入口
├── scripts/
│   └── test-image-gen.ts        # 文生图链路诊断脚本（独立可跑）
├── artifacts/                   # 运行时产物（gitignored，但 demo 保留）
└── docs/
    ├── ARCHITECTURE.md          # 完整技术架构 + Mermaid 图
    └── slides/deck.md           # 3 页答辩 PPT（Marp 格式）
```

## 5. 快速开始

### 5.1 安装 Open Code

```powershell
# Windows
irm https://opencode.ai/install.ps1 | iex

# macOS / Linux
curl -fsSL https://opencode.ai/install | bash
```

### 5.2 配置 .env（关键）

```powershell
cp .env.example .env
```

编辑 `.env` 设置文生图 provider。**推荐 custom 模式**（OpenAI 兼容协议，可对接任何中转或自部署）：

```ini
DESIGNER_IMAGE_PROVIDER=custom
CUSTOM_IMAGE_BASE_URL=https://api.zyai.online/v1
CUSTOM_IMAGE_API_KEY=sk-xxx
CUSTOM_IMAGE_MODEL=gpt-image-2
CUSTOM_IMAGE_DEFAULT_QUALITY=medium
```

⚠️ **关键设计**：provider / model / baseURL / key **完全由 .env 决定**。Agent 物理上无法越权传这些参数（v3.5 起 schema 已收敛到 6 字段）。这避免了"LLM 在长上下文下偷偷切到 dryrun"等问题。

### 5.3 安装依赖与认证

```powershell
bun install                  # 装 @opencode-ai/plugin 等
opencode providers login     # 选 Anthropic / OpenAI 等作 LLM 推理后端
```

### 5.4 测试文生图链路（推荐先跑这个）

```powershell
bun run scripts/test-image-gen.ts --quality=high --aspect=1:1
```

预期看到 ~50s 内生成 700KB+ 真图保存到 `.tmp/test-image-gen/`。如果失败说明 .env 配置有问题，**优先排查这一步**再跑完整 designer。

### 5.5 运行——双模式

#### 模式 A · `/design`（全自动 · 默认）

```powershell
opencode
# 进入 TUI 后输入：
/design 请为创智学院做一套品牌形象设计
```

**全程 ~60 分钟无人工干预**（每类 16 张图 × 5 类 ≈ 80 张图，总 API 调用 ~20 次）。orchestrator 依次跑：
1. `Step 0` 生成 slug `chuangzhi-college-20260520`
2. `Step 0.5` researcher 调研 → `research-brief.md`
3. `Step 1` planner 输出 `{wbs, decision_brief}`
4. `Step 2` designer 按 wbs 执行所有图像与文档生成
5. `Step 3` critic 5 维评审 → `critique-report.md`
6. `Step 4` 总分 < 35 时自动 retry 一次
7. `Step 5` 汇总输出含 markdown 链接

适合：标准品牌 / 快速迭代 / 探索性 demo。

#### 模式 B · `/design-review`（动态问卷 · 人机协同）

```powershell
opencode
# /design-review 请为创智学院做一套品牌形象设计
```

planner 在 designer 启动前**主动出题**——基于 brief 自主决定该问哪些 5-8 个关键偏好（不同品牌问题不同）：

```markdown
🎨 设计偏好选择

1 / 5 · 品牌设计方向 · 风险等级：致命
| 选 | 标识 | 选项 | 说明 |
| ⭐ | oriental-elegance | 东方雅韵 | 墨黑+朱砂 / 衬线 / 留白 |
|   | vibrant-modern    | 活力创新 | 橙绿 / 圆润黑体 |
|   | academic-classic  | 学术经典 | 深蓝+酒红 / 徽章式 |

2 / 5 · 设计类别组合 · 风险等级：重要
（多选）logo / poster / merch / furniture / ui / brochure
...
```

用户回复方式：
- `全部默认` → 一键通过所有 ⭐ 推荐项
- 结构化或自然语言（如 `"画面密度选 minimal，类别去掉 brochure，其他默认"`）
- `重新出题` 或 `取消`

用户选择**作为硬约束级联**到 wbs 与所有下游 prompt（如 image-density=minimal 会注入到所有 image task 的 notes）。

适合：核心品牌 / 答辩演示 / 心中有偏好但没想过如何表达的场景。

## 6. 核心设计哲学（v3.5 演进总结）

经过 5 个版本迭代，本系统形成 **8 条 prompt 工程 + agent 设计经验**，是答辩可讲的核心创新点：

### 6.1 Schema 物理收敛 > Prompt 反复警告（v3.5）

LLM tool use 的核心原则：**what's in schema is what gets called**。如果 schema 里有 `provider` 字段，无论 description 怎么写"禁止传"，LLM 都会填。
**修法**：直接从 schema 删除字段，让模型物理上无法越权。代码减少 25 行，正确性显著提升。

### 6.2 中文文字直接渲染 > Figma 后期合成（v3.2）

旧策略 "no embedded text" 是 v1 模型时代妥协。gpt-image-2 / FLUX.1-dev 等已能稳定渲染中文。
**修法**：text-rendering skill 7 条规则——verbatim 引用 + once-and-only-once + 字体 anatomy fallback + 反语义污染（禁止偏旁拆解）。

### 6.3 微文案完整层级 > 大标题独尊（v3.1）

OpenAI cookbook 的 market slide 之所以专业，是因为给了 `TAM $42B / SAM $8.7B / "AGI Research, 2024"` 这种**具体数字+来源+时间**。
**修法**：task.micro_copy 字段含 headline / subtitle / body_paragraph / data_points / footnote / navigation 完整层级。

### 6.4 Task-Level Variant Fan-Out > n=4 多方向 Prompt（v3.5）

API 的 n=4 是"同一 prompt 跑 4 个 seed"，**不会**自动分配方向。在 prompt 里塞多方向只会让模型揉风格。
**修法**：planner 在 logo task 写 variant 数组（如 `["wordmark","seal","abstract-mark","handwritten"]`），designer 循环 N 次每次 n=1 + 单方向 prompt。

### 6.5 Gestalt 语言 > CSS 比例切分（v3.2）

`primary 60% / accent 25% / neutral 15%` 这种 CSS 思维让模型为凑数学约束牺牲美学。
**修法**：用设计师母语——`anchor / counter-balance / negative space breathing / aligned axis`，给意图不锁比例。

### 6.6 光学参数 + 材质感光 > 通用风格词（v3.2）

`"editorial product photography"` 不够具体。`"shot on 85mm macro lens f/2.8, soft directional light from upper-left"` 触发模型的"摄影 latent"而非"CG 渲染 latent"。
**修法**：5 个 image skill 的 prompt 模板都加入光学 setup 段；brand-spec.json colors 字段加 `material` 子字段（如 `"matte charcoal ink, completely unreflective"`）。

### 6.7 字体 anatomy fallback > 单纯字体名（v3.2）

`Source Han Serif SC Heavy` 模型 latent 里"猜"。给 anatomy 描述（`heavy high-contrast traditional Song-style serif with sharp triangular endings, thick stems`）则有 fallback。
**修法**：text-rendering skill 配 12 个常用中英字体的 anatomy 映射表。

### 6.8 真文案 30-80 字 > 假笔画占位（v3.2）

模型 latent 里**没有**"假装中文的笔画"特征——它会陷入逻辑混乱生成"外星文"。但**有** "editorial body paragraph" 清晰特征。
**修法**：brochure / 长文场景用真实 50-80 字段落；planner 主动生成 micro_copy.body_paragraph。

## 7. 课题要求映射（《AI for Design》答辩对照）

| # | 课题硬性要求 | 实现位置 |
|---|---|---|
| ① | Planner / Designer / Critic 三个独立上下文 agent | `.opencode/agents/{planner,designer,critic}.md` 各自 subagent 模式 + tools 白名单隔离。**实际超额完成**：增加 researcher，达到 4 智能体协同 |
| ② | 文生图等设计工具 | `.opencode/tools/text_to_image.ts`（4 provider 适配）+ `save_artifact.ts` + `write_design_doc.ts` |
| ③ | Agent Harness（任务调度 / 信息传递 / 上下文管理 / 错误处理） | 调度：Open Code 内置 `task` 工具 / 传递：orchestrator 维护 slug+brief+wbs 三元组转发 / 上下文：subagent 各自独立窗口 / 错误处理：critic 自动 retry + 工具层抛错 fail-loud |
| ④ | CLI 交互（用户输入需求获取结果） | Open Code TUI + `/design` (auto) + `/design-review` (动态问卷)，**双模式覆盖** |
| ⑤ | 创意文案生成 | `skills/creative-copywriting/SKILL.md` + designer 流程固定环节，输出 slogan×3 + 品牌主张 + tagline×3 + 场景文案×3 + 中英文双版 |
| 📦 | 最终交付：3 页 PPT 含架构图 | `docs/slides/deck.md`（Marp）—— Page 1 三智能体架构 / Page 2 系统分层 + 实证 / Page 3 双模式对比 |
| 📦 | 最终交付：完整代码 + 设计样例 | 整个 `D:/Designer/` 目录 + `artifacts/chuangzhi-college-*/`（创智学院 demo）+ `artifacts/zhujiajiao-*/`（朱家角 demo） |

## 8. 关键文件阅读顺序（答辩 / 移交时）

| # | 文件 | 看什么 |
|---|---|---|
| 1 | `README.md`（本文件） | 项目全貌 |
| 2 | `docs/ARCHITECTURE.md` | 完整技术架构 + Mermaid 时序图 |
| 3 | `opencode.json` | Agent 注册 / 权限策略 |
| 4 | `.opencode/agents/design-orchestrator.md` | 双模式工作流 prompt（核心调度逻辑） |
| 5 | `.opencode/agents/planner.md` | 3 mode 智能拆解（plan / options / plan-with-choices） |
| 6 | `.opencode/skills/text-rendering/SKILL.md` | 中文文字渲染 7 条规则（v3.5 设计精华） |
| 7 | `.opencode/skills/brand-identity/SKILL.md` | 品牌 5 方向决策 + 9 sections schema + 材质语言 |
| 8 | `.opencode/tools/text_to_image.ts` | 多 provider 适配器 + .env 三层兜底加载 + schema 收敛 |
| 9 | `artifacts/chuangzhi-college-*/critique-report.md` | 5 维评审实证（系统跑通的关键证据） |

## 9. 故障排查

| 症状 | 根因 | 修法 |
|---|---|---|
| PNG 文件 68 字节（dryrun 占位） | `.env` 未设 `DESIGNER_IMAGE_PROVIDER` 或设成了 `dryrun` | 改 .env 设 `DESIGNER_IMAGE_PROVIDER=custom` + 配 base_url/key/model；重启 opencode |
| `CUSTOM_IMAGE_BASE_URL not set` | .env 没被工具进程读到（opencode 子进程 env 隔离） | 工具内置三层兜底加载（ctx.directory / cwd / 工具相对路径），直接重启 opencode 即可 |
| `Unknown agent type: researcher...奚落地...` | 当前 LLM（如非官方 GPT-5.x 中转）tool use JSON 输出不稳定 | 切换更稳定的模型（Anthropic Claude / OpenAI 官方），或缩短 orchestrator.md 长度 |
| 图中文字渲染乱码 | 字数过多 / 模型对该字体识别度低 | 减少字数到 ≤30 字 / 字体改为 Source Han Sans（黑体比宋体稳定） |
| critic 总是低分死循环 | retry 上限保护已生效（最多 1 次） | 看 critique-report.md 找出真问题，手动修 .env / WBS 重跑 |

## 10. License

MIT。仅用于夏令营《AI for Design》课题交付。





