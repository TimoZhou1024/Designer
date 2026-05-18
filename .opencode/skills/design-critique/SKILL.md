---
name: design-critique
description: 5 维设计评审 rubric。教 critic agent 如何对一个 artifact 目录的产出做结构化打分（Philosophy / Hierarchy / Detail / Function / Innovation 各 1-10 分），输出 critique-report.md，并给出"是否需要 retry"的明确建议。当 critic agent 被调用时必须加载。
---

# Design Critique Skill —— 5 维评审 rubric

## 何时加载

critic agent **每次被调用必须先加载**此 skill。

## 评审对象

一个完整的 artifact 目录，应包含：
- `DESIGN.md`
- `brand-spec.json`
- `copywriting.md`
- `logo/v1-*.png` / `v2-*.png` / `v3-*.png`
- `poster/main.png`

## 5 个维度（每维 1-10 分，无 0 分）

### 1. Philosophy（设计理念，权重 20%）
评估 DESIGN.md 是否在 Positioning + Voice 上形成了**有方向感、不折中**的品牌内核。
- **10 分**：方向明确（5 选 1），定位、调性、anti-pattern 三者互相印证
- **5 分**：定位清晰但缺少 anti-pattern，或调性与定位轻微脱节
- **1 分**：完全折中、面面俱到、什么都像什么都不像

### 2. Hierarchy（视觉层次，权重 20%）
评估视觉资产（Logo + 海报）是否建立了清晰的视觉权重。
- **10 分**：海报有唯一焦点、Logo 在最小尺寸仍可识别、3 版 Logo 视觉显著差异
- **5 分**：海报焦点存在但偏弱，或 Logo 变体之间过于相似
- **1 分**：海报像贴满信息的传单，Logo 在小尺寸糊成一坨

### 3. Detail（执行细节，权重 20%）
评估 prompt 工程质量 + 产物完成度。
- **10 分**：所有 prompt 含负面词清单、产物完整无缺、文件命名规范
- **5 分**：产物齐全但 prompt 较粗糙
- **1 分**：产物缺失或文件结构混乱

### 4. Function（功能契合，权重 20%）
评估设计与"用户需求 + 品牌定位"的契合度。
- **10 分**：每个产物都能溯源到用户需求中的某个具体诉求
- **5 分**：产物大致符合方向但未呼应特定诉求
- **1 分**：产物与需求脱节，像在做另一个品牌

### 5. Innovation（创新性，权重 20%）
评估在同类品牌的视觉惯例上是否做出**有自觉的偏移**。
- **10 分**：在保持识别度的前提下做出了 1-2 个独特记忆点
- **5 分**：完全跟随同类惯例，但执行得不错
- **1 分**：全是模板/陈词滥调，与竞品无法区分

## critique-report.md 输出格式

```markdown
# Critique Report · [品牌名] · [artifact_slug]

> 评审时间：[ISO 时间戳]
> 评审人：critic agent (skill: design-critique v1)

## 总分：XX / 50

| 维度 | 得分 | 加权 | 核心判断 |
|---|---|---|---|
| Philosophy  | X/10 | X.X | [一句话] |
| Hierarchy   | X/10 | X.X | [一句话] |
| Detail      | X/10 | X.X | [一句话] |
| Function    | X/10 | X.X | [一句话] |
| Innovation  | X/10 | X.X | [一句话] |
| **合计**    | **XX/50** | **XX%** | |

## 详细发现

### Philosophy（X/10）
[3-5 句具体观察，引用 DESIGN.md 具体片段]

### Hierarchy（X/10）
[同上]

### Detail（X/10）
[同上]

### Function（X/10）
[同上]

### Innovation（X/10）
[同上]

## 优先级改进建议（按 ROI 排序）

1. **[P0 必改]** [具体问题] → [具体修复动作]
2. **[P1 应改]** [具体问题] → [具体修复动作]
3. **[P2 可改]** [具体问题] → [具体修复动作]

## Retry 建议

- 总分 ≥ 35 → ✅ 验收通过，无需 retry
- 25 ≤ 总分 < 35 → ⚠️ 建议 retry 一次，仅修复 P0 + P1 项
- 总分 < 25 → ❌ 重大问题，建议从 DESIGN.md 重启

**本次结论**：[通过 / 建议 retry / 重启]
**给 designer 的指令**（若 retry）：[具体到要重做哪个文件、用什么修复方向]
```

## 反模式（critic 自身也要避免）

- ❌ **不引用具体片段**：每个打分必须引用 DESIGN.md 或 prompt 的原文支撑
- ❌ **抽象空话**：禁止"整体感觉不错"/"还可以更好"这种无信息量的评价
- ❌ **打高分讨好**：critic 的价值在于诚实——若每次都打 45+ 分则失去校准意义
- ❌ **推翻 designer 的方向**：critic 评估"执行质量"，不挑战 planner 给定的方向；如要改方向应明确建议"重启"
