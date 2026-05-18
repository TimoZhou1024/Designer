---
description: 一句话设计需求 → 完整品牌形象设计交付。背后由 design-orchestrator 调度 planner / designer / critic 协同完成。
agent: design-orchestrator
---

# /design

请按 design-orchestrator 的标准工作流完成以下设计需求：

**用户需求**：$ARGUMENTS

要求：
1. 严格按 Step 0 → Step 5 的顺序执行（生成 slug → planner → designer → critic → 条件 retry → 汇总）
2. 全部产物落盘到 `artifacts/<slug>/` 目录
3. 最终给用户简洁的 Markdown 汇总，含 Critique 总分与产物索引链接
