# project-rbac Specification

## Purpose

TBD - created by archiving change add-rbac-permission. Update Purpose after archive.

## Requirements

### Requirement: Project ownership on creation

The system SHALL automatically grant the "owner" role to the user who creates a project.

#### Scenario: User creates a project

- **WHEN** an authenticated user calls `POST /api/projects` to create a new project
- **THEN** the system creates a `ProjectAccess` record with `role: "owner"` linking the user to the new project

---

### Requirement: Project list filtered by access

The system SHALL return only projects the current user has access to, unless the user is an admin.

#### Scenario: Regular user fetches projects

- **WHEN** a non-admin user calls `GET /api/projects`
- **THEN** the system returns only projects where the user has a `ProjectAccess` record (any role)

#### Scenario: Admin fetches projects

- **WHEN** an admin user calls `GET /api/projects`
- **THEN** the system returns all projects

#### Scenario: User with no projects

- **WHEN** a user with no ProjectAccess records calls `GET /api/projects`
- **THEN** the system returns an empty array

---

### Requirement: Project access authorization

The system SHALL check the requesting user's project role before allowing operations on a project or its sub-resources.

#### Scenario: Owner accesses project

- **WHEN** a project owner calls any API under `/api/projects/:projectId`
- **THEN** the system allows the request

#### Scenario: Editor accesses project

- **WHEN** a project editor calls read or write APIs under `/api/projects/:projectId`
- **THEN** the system allows the request

#### Scenario: Editor attempts destructive operation

- **WHEN** a project editor calls `DELETE /api/projects/:projectId` or `PUT /api/projects/:projectId/members`
- **THEN** the system returns 403 Forbidden

#### Scenario: Viewer accesses project for read

- **WHEN** a project viewer calls `GET /api/projects/:projectId` or reads sub-resources
- **THEN** the system allows the request

#### Scenario: Viewer attempts write operation

- **WHEN** a project viewer calls a mutating API (POST/PUT/DELETE) under `/api/projects/:projectId`
- **THEN** the system returns 403 Forbidden

#### Scenario: No access

- **WHEN** a user with no ProjectAccess record for the project calls any API under `/api/projects/:projectId`
- **THEN** the system returns 403 Forbidden

#### Scenario: Sub-resource inherits project authorization

- **WHEN** a user accesses any sub-resource API (e.g., `/api/projects/:projectId/datasets`, `/api/projects/:projectId/eval-datasets`, `/api/projects/:projectId/questions`)
- **THEN** the system checks ProjectAccess for the parent `projectId` using the same role rules

---

### Requirement: Project member role assignment

The system SHALL allow project owners and admins to manage project member roles.

#### Scenario: Owner adds a member

- **WHEN** a project owner calls `POST /api/projects/:projectId/members` with `{ userId, role: "editor" }`
- **THEN** the system creates a ProjectAccess record and returns success

#### Scenario: Owner changes a member role

- **WHEN** a project owner calls `PUT /api/projects/:projectId/members` with `{ userId, role: "viewer" }`
- **THEN** the system updates the existing ProjectAccess record

#### Scenario: Owner removes a member

- **WHEN** a project owner calls `DELETE /api/projects/:projectId/members` with `{ userId }`
- **THEN** the system deletes the ProjectAccess record

#### Scenario: Non-owner attempts member management

- **WHEN** a non-owner (editor or viewer) calls any member management endpoint
- **THEN** the system returns 403 Forbidden

#### Scenario: Cannot remove the last owner

- **WHEN** an owner attempts to remove themselves or change their own role to non-owner, and they are the last owner of the project
- **THEN** the system returns an error "Project must have at least one owner"

---

### Requirement: Data model for RBAC

The system SHALL extend the Prisma schema with User and ProjectAccess models.

#### Scenario: User model

- **WHEN** the migration is applied
- **THEN** the database contains a `User` table with fields: `id`, `username` (unique), `password` (bcryptjs hash), `role` ("admin"|"member"), `createAt`

#### Scenario: ProjectAccess model

- **WHEN** the migration is applied
- **THEN** the database contains a `ProjectAccess` table with fields: `id`, `userId` (FK→User, onDelete: Cascade), `projectId` (FK→Projects, onDelete: Cascade), `role` ("owner"|"editor"|"viewer"), `createAt`, and a unique constraint on `(userId, projectId)`

---

### Requirement: Non-project routes are accessible to all authenticated users

The system SHALL allow access to monitoring, LLM model, and update-check routes for any authenticated user, regardless of project membership.

#### Scenario: Authenticated user accesses monitoring

- **WHEN** any authenticated user calls `/api/monitoring/*` endpoints
- **THEN** the system allows the request (no project-level check required)

#### Scenario: Unauthenticated user accesses monitoring

- **WHEN** an unauthenticated user calls `/api/monitoring/*` endpoints
- **THEN** the system returns 401 Unauthorized

---

### Requirement: Reusable authorization wrapper

The system SHALL provide a `requireProjectAccess(request, projectId, minRole)` function in `lib/auth.js` that all project-scoped API routes use for consistent authorization.

#### Scenario: Authorized access

- **WHEN** `requireProjectAccess(request, projectId, 'viewer')` is called and the user has a matching ProjectAccess record with role >= viewer
- **THEN** the function returns `null` (no error, proceed with handler logic)

#### Scenario: Admin bypass

- **WHEN** `requireProjectAccess()` is called and the user has system role "admin"
- **THEN** the function returns `null` (admin has access to all projects regardless of ProjectAccess membership)

#### Scenario: No access

- **WHEN** `requireProjectAccess()` is called and the user has no ProjectAccess record for the project
- **THEN** the function returns `{ error: 'Forbidden', status: 403 }`

#### Scenario: Insufficient role

- **WHEN** `requireProjectAccess(request, projectId, 'owner')` is called and the user is an "editor" for the project
- **THEN** the function returns `{ error: 'Forbidden', status: 403 }`

---

### Requirement: Member management page access

The system SHALL control access to the `/projects/[projectId]/members` page based on project role.

#### Scenario: Owner accesses members page

- **WHEN** a project owner navigates to `/projects/[projectId]/members`
- **THEN** the page renders with full member management UI (add, change role, remove)

#### Scenario: Non-owner accesses members page

- **WHEN** a non-owner (editor or viewer) navigates to `/projects/[projectId]/members`
- **THEN** the page redirects to the project home with an "Access denied" message

#### Scenario: Non-owner cannot see members link

- **WHEN** a non-owner views the project navigation
- **THEN** the "Members" navigation item is not visible

### Requirement: Project list includes user role

The system SHALL include the current user's project-level role in the `GET /api/projects` response for non-admin users.

#### Scenario: Non-admin user fetches projects

- **WHEN** a non-admin user calls `GET /api/projects`
- **THEN** each returned project includes a `userRole` field set to the user's role in that project (`owner`, `editor`, or `viewer`)

#### Scenario: Admin user fetches projects

- **WHEN** an admin user calls `GET /api/projects`
- **THEN** each returned project includes `userRole: "admin"`

### Requirement: Delete project option hidden for non-owners

The system SHALL hide the "Delete project" menu item in the project card for users who are not project owners or admins.

#### Scenario: Owner sees delete option

- **WHEN** a user with "owner" role views a project card
- **THEN** the three-dot menu displays the "Delete project" option

#### Scenario: Viewer or editor does not see delete option

- **WHEN** a user with "viewer" or "editor" role views a project card
- **THEN** the three-dot menu does NOT display the "Delete project" option

#### Scenario: Admin sees delete option for all projects

- **WHEN** an admin user views any project card
- **THEN** the three-dot menu displays the "Delete project" option
