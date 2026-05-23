## Why

Viewer 和 editor 角色的用户在项目卡片的三点菜单中能看到"删除项目"选项，但点击后 API 返回 403 Forbidden。这造成了差的用户体验——显示了一个不可用的操作入口。需要根据用户的项目角色来条件性显示删除选项。

## What Changes

- `lib/db/projects.js` 的 `getProjects()` 在非 admin 用户查询时，同时返回用户在每个项目中的角色信息
- `components/home/ProjectCard.js` 根据用户角色控制"删除项目"菜单项的显示：只有 admin 或项目 owner 才可见

## Capabilities

### New Capabilities

<!-- 无 -->

### Modified Capabilities

- `project-rbac`: UI 层根据项目角色隐藏无权限操作（删除项目仅 owner/admin 可见）

## Impact

- 修改 `lib/db/projects.js` — getProjects 返回 userRole
- 修改 `components/home/ProjectCard.js` — 条件渲染删除菜单项
- 不涉及 API 变更、数据库 schema 变更
