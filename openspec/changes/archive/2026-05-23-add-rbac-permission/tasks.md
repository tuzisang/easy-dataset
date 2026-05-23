## 1. Dependencies & Database Schema

- [ ] 1.1 Install `jose@^5` and `bcryptjs@^3` via pnpm
- [ ] 1.2 Add User model to `prisma/schema.prisma` (id, username unique, password, role, createAt)
- [ ] 1.3 Add ProjectAccess model to `prisma/schema.prisma` (id, userId FK→User cascade, projectId FK→Projects cascade, role, createAt, @@unique)
- [ ] 1.4 Run `prisma migrate dev` to generate migration
- [ ] 1.5 Verify migration: run `prisma studio` and confirm User + ProjectAccess tables exist

## 2. Auth Library (`lib/auth.js`)

- [ ] 2.1 Implement `signToken(userId, role)` using `jose.SignJWT()` with 24h expiration and `JWT_SECRET` env var
- [ ] 2.2 Implement `verifyToken(token)` using `jose.jwtVerify()` — Edge-compatible (no Node crypto)
- [ ] 2.3 Implement `checkProjectAccess(userId, projectId, minRole)` — queries ProjectAccess table, admin bypass
- [ ] 2.4 Implement `requireProjectAccess(request, projectId, minRole)` — reusable wrapper returning `null` or `{ error, status }`
- [ ] 2.5 Implement `hashPassword(password)` using `bcryptjs.hash()` with cost factor 12
- [ ] 2.6 Implement `verifyPassword(password, hash)` using `bcryptjs.compare()`
- [ ] 2.7 Define zod validation schemas: `signupSchema`, `loginSchema`, `createMemberSchema`, `updateMemberSchema`, `deleteMemberSchema`, `updateUserRoleSchema`, `deleteUserSchema`
- [ ] 2.8 Add user helper functions: `createUser()`, `getUserByUsername()`, `getUserById()`, `getUserCount()`

## 3. Auth API Routes

- [ ] 3.1 Create `app/api/auth/signup/route.js` — POST, validate with signupSchema, check duplicate username, hash password, create user
- [ ] 3.2 Create `app/api/auth/login/route.js` — POST, validate with loginSchema, verify credentials, set HttpOnly cookie with JWT
- [ ] 3.3 Create `app/api/auth/logout/route.js` — POST, clear token cookie
- [ ] 3.4 Create `app/api/auth/me/route.js` — GET, read x-user-id header, return user object (no password)
- [ ] 3.5 Create `app/api/auth/setup/route.js` — POST, validate with signupSchema, only works when User.count()===0, create admin user + set cookie
- [ ] 3.6 Create `app/api/auth/setup-check/route.js` — GET, return `{ needsSetup: boolean }` based on User.count()

## 4. Middleware (`middleware.js` at project root)

- [ ] 4.1 Implement `config.matcher` to match all routes except static assets and `_next`
- [ ] 4.2 Implement public path bypass: `/login`, `/signup`, `/setup`, `/api/auth/*` → `NextResponse.next()`
- [ ] 4.3 Implement `AUTH_ENABLED=false` bypass: inject `x-user-id: local`, `x-user-role: admin`, pass through
- [ ] 4.4 Implement JWT verification: read `token` cookie, `jose.jwtVerify()`, inject `x-user-id` + `x-user-role` headers
- [ ] 4.5 Implement 401 response for `/api/*` routes with invalid/missing token
- [ ] 4.6 Implement 302 redirect to `/login` for page routes with invalid/missing token
- [ ] 4.7 Add `JWT_SECRET` to `.env` for development (and document production deployment requirement)

## 5. API Client (`lib/api-client.js`)

- [ ] 5.1 Implement `apiFetch(url, options)` — wrapper around `fetch()` that detects 401 responses
- [ ] 5.2 On 401: call `POST /api/auth/logout`, redirect to `/login?expired=true`
- [ ] 5.3 Document that auth pages (login/signup/setup) use raw `fetch()`, not `apiFetch`, to avoid redirect loops

## 6. Frontend AuthContext (`contexts/AuthContext.js`)

- [ ] 6.1 Create `AuthContext` with React.createContext: `{ user, isLoading, login, logout, signup }`
- [ ] 6.2 Implement `AuthProvider` component: on mount, call `GET /api/auth/setup-check` → if needsSetup redirect `/setup`, else call `GET /api/auth/me` → set user or redirect `/login`
- [ ] 6.3 Implement `login(username, password)`: call `POST /api/auth/login`, set user state, redirect `/`
- [ ] 6.4 Implement `signup(username, password)`: call `POST /api/auth/signup`, redirect `/login`
- [ ] 6.5 Implement `logout()`: call `POST /api/auth/logout`, clear user state, redirect `/login`
- [ ] 6.6 Integrate `AuthProvider` into `app/layout.js` alongside existing Jotai Provider, ThemeRegistry, I18nProvider

## 7. Auth UI Pages

- [ ] 7.1 Create `app/login/page.js` — centered card, username + password fields, submit button, signup link, error Alert, loading spinner, framer-motion fade-in
- [ ] 7.2 Create `app/signup/page.js` — centered card, username + password (+ hint) fields, submit button, login link, error Alert, loading spinner
- [ ] 7.3 Create `app/setup/page.js` — centered card, "Welcome" title, username + password fields, "Create Admin Account" button, self-checks needsSetup on mount
- [ ] 7.4 Add `useTranslation()` i18n keys for all auth page strings (login, signup, setup, errors)
- [ ] 7.5 Add redirect logic: already-authenticated users visiting `/login` or `/signup` → redirect `/`

## 8. API Route Protection (Project Routes)

- [ ] 8.1 Modify `GET /api/projects` in `app/api/projects/route.js`: extract `x-user-id` header, pass to `getProjects(userId)`
- [ ] 8.2 Modify `getProjects()` in `lib/db/projects.js`: add optional `userId` param, filter by ProjectAccess if provided (admin sees all)
- [ ] 8.3 Modify `POST /api/projects`: after creating project, call `db.projectAccess.create({ userId, projectId, role: 'owner' })`
- [ ] 8.4 Modify `PUT /api/projects/[projectId]`: add `requireProjectAccess(request, projectId, 'editor')` check at top
- [ ] 8.5 Modify `DELETE /api/projects/[projectId]`: add `requireProjectAccess(request, projectId, 'owner')` check at top
- [ ] 8.6 Add `requireProjectAccess(request, projectId, 'viewer')` to all read-only sub-resource routes (GET handlers in datasets, questions, images, eval-datasets, chunks, tags, etc.)
- [ ] 8.7 Add `requireProjectAccess(request, projectId, 'editor')` to all mutating sub-resource routes (POST/PUT/DELETE handlers in datasets, questions, images, eval-datasets, chunks, tasks, etc.)
- [ ] 8.8 Verify `GET /api/monitoring/*` routes: add JWT verification (already handled by middleware), no project-level check needed
- [ ] 8.9 Verify `GET /api/check-update` and `/api/update`: add JWT verification (already handled by middleware), no project-level check needed

## 9. Admin Dashboard

- [ ] 9.1 Create `app/api/admin/users/route.js` — GET list all users with project counts, PUT update user role, DELETE user (all require admin role check)
- [ ] 9.2 Create `app/admin/page.js` — user table (username, role dropdown, project count, delete button), admin-only access guard
- [ ] 9.3 Add admin role guard in page: check `x-user-role === 'admin'` from `/api/auth/me` response, redirect if not admin
- [ ] 9.4 Add "Admin" entry in Navbar (visible only when `user.role === 'admin'`)

## 10. Project Member Management

- [ ] 10.1 Create `app/api/projects/[projectId]/members/route.js` — GET list members, POST add member, PUT change role, DELETE remove member
- [ ] 10.2 All member endpoints: require `requireProjectAccess(request, projectId, 'owner')` plus zod validation
- [ ] 10.3 Add "cannot remove last owner" guard in DELETE handler
- [ ] 10.4 Create `app/projects/[projectId]/members/page.js` — member list, add member dialog (search user + select role), role dropdown, remove button
- [ ] 10.5 Add owner-only access guard on page: if user not owner, redirect with "Access denied" message
- [ ] 10.6 Add "Members" tab in project Navbar (visible only to owners)

## 11. Electron Compatibility

- [ ] 11.1 Verify `AUTH_ENABLED=false` in middleware bypass: injects virtual local admin, all requests pass through
- [ ] 11.2 Test Electron dev mode: `AUTH_ENABLED=false`, app starts without login page
- [ ] 11.3 Test Electron production mode: `AUTH_ENABLED=false`, app starts without login page
- [ ] 11.4 Document `AUTH_ENABLED` env var in project README or deployment docs

## 12. Integration & Polish

- [ ] 12.1 Update Navbar to show current username + logout option (from AuthContext)
- [ ] 12.2 Add `react-i18next` translation keys for all new UI strings (login, signup, setup, admin, members, errors)
- [ ] 12.3 Manual end-to-end test: fresh start → setup → create project → invite member → switch user → verify permissions
- [ ] 12.4 Manual test: verify all existing Electron functionality still works with `AUTH_ENABLED=false`
- [ ] 12.5 Manual test: verify all 50+ project sub-resource API routes return 403 for unauthorized users
- [ ] 12.6 Manual test: admin can view all projects, manage users, delete users
