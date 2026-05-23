## Why

Admin 面板当前只能看到每个用户关联的项目数量（`projectCount`），但无法查看或管理用户具体能访问哪些项目。要调整某个用户的项目权限，admin 必须逐个进入每个项目的成员管理页面操作，这在用户和项目数量增长后极其低效。需要在 admin 面板中提供以用户为中心的项目访问管理能力。

## What Changes

- **Admin 面板新增"管理项目"按钮**：每行用户增加入口，点击打开该用户的项目分配弹窗/页面
- **新增 Admin 项目分配 API**：`GET /api/admin/users/[userId]/projects` 查看用户当前的项目权限列表，`PUT` 批量更新用户的项目访问（增删改角色）
- **Admin 面板项目分配交互**：弹窗内展示所有项目列表，每个项目可设置角色（owner/editor/viewer）或移除访问权限，支持搜索/筛选项目
- **i18n 扩展**：新增 admin 项目管理相关的中英文翻译键

## Capabilities

### New Capabilities

- `admin-project-access`: Admin 以用户维度管理项目访问权限——查看某用户关联的所有项目、批量增删改项目角色

### Modified Capabilities

- `admin-dashboard`: Admin 用户列表增加"管理项目"操作入口，API 返回增加用户项目详情

## Impact

- **新增文件**: `app/api/admin/users/[userId]/projects/route.js`
- **修改文件**: `app/admin/page.js`（增加管理项目按钮和弹窗/侧面板）
- **修改文件**: `locales/en/translation.json`, `locales/zh-CN/translation.json`（新增 i18n key）
- **依赖**: 复用现有 `lib/auth.js` 的 `requireAdmin`、`lib/db` 的 Prisma 查询
- **数据库**: 无 schema 变更，仅操作现有 `ProjectAccess` 表
- **不受影响**: 项目成员管理页面 (`/projects/[projectId]/members`) 保持不变，API 路由级鉴权不变
