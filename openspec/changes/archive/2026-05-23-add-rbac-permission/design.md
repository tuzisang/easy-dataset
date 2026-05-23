## Context

Easy-Dataset 是 LLM 数据集生成工具，当前为 Electron 桌面应用，SQLite 本地存储，零认证。现需部署为 Web 多用户服务，需从零构建认证授权体系。

**现状约束:**

- Next.js 14 App Router，Prisma 6 + SQLite，MUI + Jotai + react-i18next 前端
- 18 个数据模型均通过 `projectId` 级联到 `Projects` 表
- `lib/db/` 层使用 `'use server'` 指令的 Prisma 直调
- 零现有认证基础设施（无 User 表、无 middleware、无 session）

## Goals / Non-Goals

**Goals:**

- 用户可注册账号、登录、登出
- 项目创建者自动成为 owner，可管理成员角色
- API 路由根据 ProjectAccess 做细粒度授权
- admin 可查看/管理所有用户
- 登录/注册/设置页面遵循项目现有 MUI 设计风格
- Electron 桌面版 (`AUTH_ENABLED=false`) 行为完全不变

**Non-Goals:**

- OAuth 第三方登录（如 GitHub/Google）
- 邮件验证、密码重置（后续迭代）
- 多租户/组织隔离
- API 速率限制（后续迭代）
- 审计日志

## Decisions

### D1: JWT 库选 `jose@^5` 而非 `jsonwebtoken`

**选择**: `jose@^5`

**理由**: Next.js middleware 运行在 Edge Runtime，`jsonwebtoken` 依赖 Node.js `crypto` 模块无法在 Edge 中运行。`jose` 使用 Web Crypto API，Edge/Node 均可运行。且 `jose` 包体积更小（~30KB vs ~60KB）。

### D2: HttpOnly Cookie 存 token 而非 Bearer header

**选择**: 登录时服务端 Set-Cookie `token=<jwt>; HttpOnly; Secure; SameSite=Lax; Path=/`

**理由**:

- BFF 架构下，前端 `fetch()` 自动携带 Cookie，无需手动管理 header
- HttpOnly 防 XSS 窃取 token
- SameSite=Lax 防 CSRF（跨站请求不携带）
- 不选 Bearer header 是因为需要前端手动存储（localStorage 易受 XSS，内存存储刷新丢失）

### D3: API Route 层查库鉴权，而非 JWT 内嵌 projectIds

**选择**: 每个需鉴权的 API route 调用 `checkProjectAccess(userId, projectId, minRole)` 查 `ProjectAccess` 表

**理由**:

- 权限变更实时生效（不依赖 token 过期重签）
- JWT payload 保持轻量（仅 userId + role），不随用户项目数膨胀
- Middleware 仅做 JWT 签名验证（不查库），保持 Edge 兼容和低延迟

**替代方案**: 把 projectIds 和角色嵌入 JWT payload。优点是无查库，缺点是角色变更要等到 token 过期或手动重签，且 token 体积随用户参与项目数增长。

### D4: 密码哈希用 `bcryptjs` 而非 `bcrypt`

**选择**: `bcryptjs@^2`

**理由**: `bcrypt` 是 C++ 原生模块，每次 `npm install` 需要编译环境（node-gyp、python、C++ toolchain），在不同平台/Node 版本间易出问题。`bcryptjs` 纯 JS 实现，零原生依赖，安装即可用。性能差异在单用户认证场景可忽略（hash 操作 ~100ms vs ~60ms）。

### D5: middleware 不鉴权，只做认证 + header 注入

**选择**: middleware 仅 `jose.jwtVerify()` 验证签名，将 `{ userId, role }` 写入 `x-user-id` / `x-user-role` header 传给 API route。API route 自行调用 `checkProjectAccess()` 鉴权。

**理由**:

- middleware 在 Edge Runtime 运行，Prisma 客户端无法在 Edge 中初始化
- 保持 middleware 轻量、快速
- 鉴权逻辑集中在 `lib/auth.js`，API route 调用统一 wrapper

### D6: 前端认证状态管理用 React Context + fetch 包装

**选择**: 自定义 `AuthContext`（React Context），提供 `user`, `login()`, `logout()`, `signup()`, `isLoading`。不引入状态库。

**理由**: 认证状态简单（单用户对象），不需要 Jotai/Zustand 的复杂能力。React Context 足以覆盖全局认证状态传播。

### D7: 新增三个页面的 UI 风格对齐策略

**选择**: 全部使用项目现有技术栈——MUI `Container`/`Box`/`Card`/`TextField`/`Button`/`Typography`/`CircularProgress`，`framer-motion` 入场动画，`react-i18next` 国际化，`'use client'` 指令。

**理由**: 保持 UI 一致性，零新增前端依赖。

### D8: 不引入 next-auth (Auth.js v5)

**选择**: 自定义 JWT 认证方案，不引入 `next-auth@^5`

**理由**:

- next-auth v5 主要面向 OAuth 第三方登录，credentials provider + JWT strategy 虽可工作，但引入大量不必要的抽象（30KB+ 含 ORM adapter）
- next-auth 的约定驱动模式隐藏 cookie 设置、JWT 签发、session 获取细节，与 `AUTH_ENABLED=false` Electron 绕行路径的集成调试困难
- 项目已有 Prisma 客户端单例，不需要 next-auth 再包一层 Prisma adapter
- 用户量 <50，自定义 JWT 方案更简单透明，代码量可控（`lib/auth.js` ~150 行）

### D9: 用现有 `zod@^3.25` 做 API 输入验证

**选择**: 利用 `package.json` 中已有的 `zod` 依赖，为所有新增/修改的 API 路由编写请求体验证 schema。

**理由**:

- `zod` 已安装（`^3.25.76`），零新增依赖
- 注册/登录/成员管理/用户管理端点均需结构化输入验证（用户名长度/字符集、密码最小长度、角色枚举）
- 类型推导：`z.infer<typeof schema>` 自动生成 TypeScript 类型

**验证 schema 设计**（在 `lib/auth.js` 中定义）:

- `signupSchema`: username (2-32 chars, alphanumeric + `_-`), password (6-128 chars)
- `loginSchema`: username (non-empty), password (non-empty)
- `createMemberSchema / updateMemberSchema / deleteMemberSchema`: userId + role enum
- `updateUserRoleSchema / deleteUserSchema`: userId + role enum

### D10: JWT 过期策略

**选择**: 签发时 `.setExpirationTime('24h')`，不实现 refresh token。

**理由**:

- 对 B2B 协作工具（用户量 <50），每天登录一次体验可接受
- refresh token 需要安全存储（需复活 Session 表或等效机制），在当前阶段过度设计
- `jose.SignJWT().setExpirationTime('24h')` 直接设置 `exp` claim
- 后续可迭代增加接近过期的自动续签（middleware 中检测剩余 <1h 时重签）

## Risks / Trade-offs

| 风险                                                                         | 缓解措施                                                                                                                                                   |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SQLite 并发写入瓶颈** — 多用户同时操作同一数据库可能出现锁冲突             | Prisma SQLite 默认 WAL 模式已启用，读并发不受影响；写操作串行化在应用层可接受（用户量 <50）                                                                |
| **JWT 密钥泄漏** — 若 `JWT_SECRET` 泄露，攻击者可伪造任意用户 token          | 部署文档要求强随机密钥（`openssl rand -hex 32`），环境变量注入，不写入代码仓库                                                                             |
| **首次初始化安全** — `/setup` 页面若在已初始化后仍可访问，可被利用创建 admin | `/setup` 页面自身通过 `GET /api/auth/setup-check`（查 `User.count()`）判断，已初始化则重定向 `/login`。middleware 不做此检查（Edge Runtime 无法查 Prisma） |
| **Electron 用户感知变化** — Web 版新增了登录页，但桌面版不需要               | `AUTH_ENABLED=false` 时 middleware 直接放行所有请求，前端通过 `getMe()` 返回本地用户或跳过认证 UI                                                          |
| **会话过期体验** — JWT 24h 过期后用户可能正在工作中                          | `contexts/AuthContext.js` 中的 `apiFetch()` 包装器全局拦截 401 响应，自动跳转 `/login?expired=true`                                                        |
| **CSRF** — 若任何 API 在 GET 方法下暴露写操作                                | 强制所有状态变更 API 使用 POST/PUT/PATCH/DELETE；GET 只读。配合 SameSite=Lax Cookie，覆盖已知 CSRF 向量                                                    |
