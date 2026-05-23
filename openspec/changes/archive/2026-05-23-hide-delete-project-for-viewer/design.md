## Context

`ProjectCard` 组件的三点菜单中"删除项目"始终可见，但 API `DELETE /api/projects/[projectId]` 要求 `owner` 角色。viewer/editor 点击后只会看到 403。

当前 `getProjects(userId)` 返回的项目数据中不含用户角色信息。需要传递角色给前端以控制 UI。

## Goals / Non-Goals

**Goals:**

- 非 owner 且非 admin 的用户在项目卡片菜单中看不到"删除项目"选项
- admin 保持能看到所有项目的删除选项

**Non-Goals:**

- 不修改 API 鉴权逻辑（后端已有保护）
- 不修改其他菜单项或组件

## Decisions

### Decision 1: 在 getProjects 返回中注入 userRole

在 `getProjects()` 中，当 userId 存在时，除了过滤可见项目，同时构建 `projectRoles` 映射表，注入到每个项目的返回数据中。admin 用户标记为 `userRole: 'admin'`。

**理由**: 最小改动，不增加额外 API 请求。ProjectCard 直接用 `project.userRole` 判断。

### Decision 2: 前端条件判断

`ProjectCard` 中：`{(isAdmin || project.userRole === 'owner') && <DeleteMenuItem />}`

**理由**: 简单直接，admin 永远能看到删除，owner 在自己的项目中能看到删除。

## Risks / Trade-offs

- 无显著风险。后端 API 已有完整的角色校验，前端仅为 UX 优化。
