## Why

Easy-Dataset 当前是零认证的单用户桌面应用，所有 API 路由无权限保护。将其部署为 Web 服务供多人使用时，任何人都可以查看、修改、删除任意项目数据，存在严重的数据安全风险。需要引入基于角色的访问控制（RBAC）系统，使多用户能在同一实例上安全协作。

## What Changes

- **新增用户认证系统**：支持注册、登录、登出，JWT + HttpOnly Cookie 认证
- **新增项目级 RBAC**：owner / editor / viewer 三级项目角色 + admin 系统角色
- **新增登录页面** (`/login`)：用户名+密码登录，符合现有 MUI 设计风格
- **新增注册页面** (`/signup`)：新用户自助注册
- **新增首次初始化页面** (`/setup`)：系统首次启动时创建 admin 账号
- **新增权限管理页面** (`/admin/members`)：admin 用户管理所有用户及系统级角色
- **新增项目成员管理** (`/projects/[projectId]/members`)：owner 管理项目成员
- **API 路由加鉴权**：所有 `/api/projects/*` 路由（50+ 文件）通过统一 `requireProjectAccess()` 包装器做授权检查
- **数据访问层适配**：`getProjects()` 增加可选 `userId` 参数按权限过滤
- **全局 401 拦截**：`lib/api-client.js` fetch 包装器，token 过期时自动跳转登录
- **Electron 兼容**：`AUTH_ENABLED=false` 环境变量跳过所有认证，桌面版行为不变

## Capabilities

### New Capabilities

- `user-auth`: 用户注册、登录、登出，JWT 签发与验证，首次初始化流程
- `project-rbac`: 项目级角色（owner/editor/viewer）管理，ProjectAccess 数据模型，API 授权检查
- `admin-dashboard`: admin 系统级用户管理页面，管理所有用户的角色和状态
- `auth-ui`: 登录、注册、初始化设置三个页面，遵循项目现有 MUI 设计风格

### Modified Capabilities

<!-- 无现有 capability 需要修改，这是全新功能 -->

## Impact

- **新增依赖**: `jose@^5` (JWT, Edge 兼容), `bcryptjs@^3` (密码哈希, 纯 JS 无原生依赖), `zod@^3.25` (已安装，零新增依赖)
- **数据库**: `schema.prisma` 新增 User、ProjectAccess 两张表
- **新增文件**: `middleware.js`, `lib/auth.js`, `lib/api-client.js`, `contexts/AuthContext.js`, 4 个页面, 8 个 API 路由
- **修改文件**: `app/api/projects/route.js` (GET 过滤), `app/api/projects/[projectId]/route.js` (鉴权), `app/layout.js` (加 AuthProvider), 50+ 个子资源路由 (加 `requireProjectAccess()` 调用)
- **不受影响**: Electron 桌面版 (`AUTH_ENABLED=false` 时 middleware 直接放行, 注入虚拟 local admin), 所有现有功能逻辑不变
