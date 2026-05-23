## ADDED Requirements

### Requirement: Admin API route protection

The system SHALL protect `/api/admin/*` routes with authentication (JWT verification) AND authorization (admin role check).

#### Scenario: Admin accesses admin API

- **WHEN** an admin user calls any `/api/admin/*` endpoint
- **THEN** the middleware verifies the JWT, injects `x-user-id` and `x-user-role` headers, and the API handler confirms `x-user-role === 'admin'`

#### Scenario: Non-admin accesses admin API

- **WHEN** a non-admin authenticated user calls any `/api/admin/*` endpoint
- **THEN** the API handler returns 403 Forbidden

#### Scenario: Unauthenticated user accesses admin API

- **WHEN** an unauthenticated user calls any `/api/admin/*` endpoint
- **THEN** the middleware returns 401 Unauthorized

---

### Requirement: Admin user management page

The system SHALL provide an admin-only page at `/admin` for viewing and managing all users.

#### Scenario: Admin accesses the page

- **WHEN** an admin user navigates to `/admin`
- **THEN** the system displays a table of all users with columns: username, role, creation date, and project count

#### Scenario: Non-admin is redirected

- **WHEN** a non-admin user navigates to `/admin`
- **THEN** the system redirects to the homepage with an "Access denied" toast notification

#### Scenario: Admin changes a user's system role

- **WHEN** an admin changes a user's role from "member" to "admin" (or vice versa) via the dropdown selector on the management page
- **THEN** the system updates the User record and the change takes effect immediately

#### Scenario: Admin deletes a user

- **WHEN** an admin clicks "Delete" on a user row and confirms the action
- **THEN** the system deletes the User record (cascading to ProjectAccess and Session records) and the user disappears from the list

#### Scenario: Admin cannot delete themselves

- **WHEN** an admin attempts to delete their own account
- **THEN** the system returns an error "Cannot delete your own account"

---

### Requirement: Admin API endpoints

The system SHALL provide API endpoints for admin user management operations.

#### Scenario: List all users

- **WHEN** an admin calls `GET /api/admin/users`
- **THEN** the system returns all users with their project counts

#### Scenario: Update user role

- **WHEN** an admin calls `PUT /api/admin/users` with `{ userId, role }`
- **THEN** the system updates the user's system role

#### Scenario: Delete user

- **WHEN** an admin calls `DELETE /api/admin/users` with `{ userId }`
- **THEN** the system deletes the user and all associated records

#### Scenario: Non-admin calls admin API

- **WHEN** a non-admin user calls any `/api/admin/*` endpoint
- **THEN** the system returns 403 Forbidden

---

### Requirement: Admin navigation visibility

The system SHALL show the admin management link in the navigation only to admin users.

#### Scenario: Admin sees the link

- **WHEN** an admin user is logged in
- **THEN** the Navbar displays an "Admin" or user-management entry (e.g., in the user menu or settings area)

#### Scenario: Non-admin does not see the link

- **WHEN** a non-admin user is logged in
- **THEN** the Navbar does NOT display the admin management link
