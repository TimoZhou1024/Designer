# artifacts/ —— 设计产物输出目录

每次运行 `/design <需求>`，系统会在此目录下创建 `<brand-slug>-<YYYYMMDD>/` 子目录，存放所有产物。

## 已收录的 demo

### `chuangzhi-college-20260514/`

对应输入：`/design 请为创智学院做一套品牌形象设计`

| 文件 | 内容 |
|---|---|
| `DESIGN.md` | 品牌单一事实源（9 sections） |
| `brand-spec.json` | 机器可读 design token |
| `copywriting.md` | 3 候选 Slogan + 品牌主张 + 3 Tagline + 3 场景文案 + 英文版 |
| `logo/v1-minimal.png` + `.prompt.txt` | 极简字标版 Logo |
| `logo/v2-abstract.png` + `.prompt.txt` | 图形抽象版 Logo |
| `logo/v3-emblem.png` + `.prompt.txt` | 古典徽章版 Logo |
| `logo/README.md` | Logo 三版对比 + Figma 后期排版指南 |
| `poster/main.png` + `.prompt.txt` | 9:16 主视觉海报 |
| `poster/README.md` | 海报构图说明 + 文字层后期叠加指南 |
| `critique-report.md` | 5 维评审报告（总分 41/50，通过） |

### 关于图像文件的说明

- 仓库中提交的 `.png` 文件**可能是 dry-run 占位**（1×1 透明 PNG）或**真实文生图产物**，取决于运行环境是否配置了 API key
- 每个 `.png` 都伴有 `.prompt.txt` 文件，记录发送给文生图模型的**完整 prompt**——这是产物的真正"源代码"，即使图像本身丢失也可以通过 prompt 完美复现
- 复现真图：配置 `.env` 里的 `DESIGNER_IMAGE_PROVIDER` + 对应 API key，重新运行 `/design 请为创智学院做一套品牌形象设计`

## 自己运行

```powershell
# 1. 配置环境
cp .env.example .env
# 编辑 .env 填入 MINIMAX_API_KEY 或 OPENAI_API_KEY

# 2. 安装依赖
bun install

# 3. 进入 TUI 跑设计
opencode
# 在 TUI 内输入：/design 请为创智学院做一套品牌形象设计

# 或单次命令
opencode run --agent design-orchestrator "请为创智学院做一套品牌形象设计"
```

跑完去 `artifacts/<新生成的 slug>/` 查看产物。
