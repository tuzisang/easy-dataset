## 1. API — Admin 用户项目管理接口

- [ ] 1.1 新增 `GET /api/admin/users/[userId]/projects/route.js` — 返回全部项目列表，每项含该用户的当前角色（null 表示无权限），调用 `requireAdmin` 鉴权
- [ ] 1.2 新增 `PUT /api/admin/users/[userId]/projects/route.js` — 接受 `{ items: [{ projectId, role }] }`，批量 upsert 该用户的 ProjectAccess 记录（不在 items 中的项目删除对应记录），调用 `requireAdmin` 鉴权，zod 校验 role 值

## 2. Admin 页面 — 项目管理弹窗

- [ ] 2.1 在用户表格 Actions 列增加"管理项目"按钮（`IconButton` + 项目图标），`isSelf` 不禁用此按钮
- [ ] 2.2 实现 `ManageProjectsDialog` 组件：MUI Dialog，内部加载项目列表，每个项目显示名称 + `Select`（owner/editor/viewer/无权限），顶部 `TextField` 做前端搜索过滤
- [ ] 2.3 实现保存逻辑：收集当前角色选择，调用 `PUT /api/admin/users/[userId]/projects`，成功后 `Snackbar` 提示并关闭弹窗，失败展示错误
- [ ] 2.4 实现取消逻辑：关闭弹窗不保存，弹窗关闭时重置内部状态

## 3. i18n

- [ ] 3.1 在 `locales/en/translation.json` `admin` 段新增翻译键：`manageProjects`、`projectAccess`、`searchProjects`、`noAccess`、`saveChanges`、`projectAccessSaved`
- [ ] 3.2 在 `locales/zh-CN/translation.json` `admin` 段新增对应中文翻译

## 4. 验证

- [ ] 4.1 启动开发服务器，以 admin 账号登录，进入 /admin，点击某用户的"管理项目"，分配/修改/移除项目权限，确认保存后项目成员页和项目列表正确反映变更
- [ ] 4.2 以普通用户登录，确认无法访问 `/api/admin/users/*/projects` 接口
