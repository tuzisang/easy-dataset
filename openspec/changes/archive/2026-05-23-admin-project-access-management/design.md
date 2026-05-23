## Context

当前 admin 页面 (`/admin`) 展示用户表格，其中 "Projects" 列仅显示数字（用户关联的项目数量）。Admin 无法查看该用户具体关联了哪些项目，也无法直接编辑项目权限。项目权限管理分散在各个项目的成员页面 (`/projects/[projectId]/members`) 中，以项目维度操作。

**当前技术栈**: Next.js 14 App Router, Prisma 6 + SQLite, MUI 5, framer-motion, react-i18next

**已有接口**:

- `GET /api/admin/users` — 返回用户列表含 `projectCount`
- `GET /api/projects/[projectId]/members` — 项目维度查成员
- `POST/PUT/DELETE /api/projects/[projectId]/members` — 项目维度增删改成员
- `lib/auth.js:requireAdmin()` — admin 鉴权

**数据模型**: `ProjectAccess` 表包含 `id, userId, projectId, role, createAt`，`@@unique([userId, projectId])`

## Goals / Non-Goals

**Goals:**

- Admin 可在用户列表中进入某用户的"项目分配"视图
- 展示所有项目列表，标记该用户已关联的项目及角色
- 支持增、删、改该用户的项目访问权限
- 交互风格一致：使用 MUI Dialog，framer-motion 动画，中英文 i18n

**Non-Goals:**

- 不改变项目成员管理页面 (`/projects/[projectId]/members`) 的行为
- 不修改 `ProjectAccess` 数据模型或 Prisma schema
- 不提供批量跨用户操作（如"给所有用户加项目X"）
- 不在本变更中修改 Navbar 或路由结构

## Decisions

### Decision 1: Dialog 弹窗模式 vs 独立页面

**选择**: MUI Dialog 弹窗

**理由**:

- 当前 admin 页面是单页表格，弹窗模式保持上下文（不离开用户列表）
- 项目列表加载与用户数据解耦，按需获取
- 符合 MUI 常见的"行内操作→弹窗编辑"交互模式

### Decision 2: API 设计 — 按用户获取/更新项目列表

**选择**:

- `GET /api/admin/users/[userId]/projects` — 返回全部项目列表，每项标记该用户是否有权限及角色
- `PUT /api/admin/users/[userId]/projects` — 批量更新该用户的项目访问

**理由**:

- GET 返回"全局项目列表 + 用户权限标记"而非仅返回用户有权限的项目，因为 admin 需要看到可添加的所有项目
- PUT 接受完整列表做批量 upsert（`{ items: [{ projectId, role }] }`），一次请求完成所有变更
- 备选方案：单独的 POST/DELETE 对每个项目逐条操作 —— 请求次数多，交互慢。不采用。

### Decision 3: 角色选项

**选择**: owner / editor / viewer / 移除（null）

**理由**: admin 应能分配任意角色。移除 = 从 ProjectAccess 删除记录。admin 自身不需要被限制（admin 本身已有全局项目访问权，但可以在 ProjectAccess 中有记录）。

### Decision 4: 项目搜索/筛选

**选择**: MUI TextField 前端过滤

**理由**: 项目数量通常 < 100，前端 `filter()` 即可满足，无需后端分页/搜索。

## Risks / Trade-offs

- **[R]** Admin 误操作移除大量项目权限 → 手动逐条恢复成本高
  - Mitigation: 弹窗内使用 Snackbar 通知 + "撤销"暂不考虑（超出范围），确认变更前弹窗展示变更摘要
- **[R]** 项目数量很多（> 200）时 Dialog 内列表过长 → 滚动性能下降
  - Mitigation: 当前场景项目数有限；未来可加虚拟滚动或后端分页
