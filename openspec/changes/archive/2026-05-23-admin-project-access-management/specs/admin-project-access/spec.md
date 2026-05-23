## ADDED Requirements

### Requirement: Admin views user's project access

The system SHALL provide an endpoint for admin to retrieve all projects with a given user's access status.

#### Scenario: Admin fetches user project list

- **WHEN** an admin calls `GET /api/admin/users/[userId]/projects`
- **THEN** the system returns a list of all projects, each annotated with the target user's current role (`owner`, `editor`, `viewer`, or `null` if no access)

#### Scenario: Non-admin is forbidden

- **WHEN** a non-admin user calls `GET /api/admin/users/[userId]/projects`
- **THEN** the system returns 403 Forbidden

#### Scenario: User not found

- **WHEN** an admin calls `GET /api/admin/users/[nonexistentId]/projects`
- **THEN** the system returns 404 Not Found

---

### Requirement: Admin updates user's project access

The system SHALL provide an endpoint for admin to batch-update a user's project access assignments.

#### Scenario: Admin grants project access

- **WHEN** an admin calls `PUT /api/admin/users/[userId]/projects` with `{ items: [{ projectId: "p1", role: "editor" }] }`
- **THEN** the system upserts the ProjectAccess record for (userId, p1) with role "editor"
- **AND** returns the updated project access list

#### Scenario: Admin removes project access

- **WHEN** an admin calls `PUT /api/admin/users/[userId]/projects` with `{ items: [] }` (or omits a previously assigned project)
- **THEN** the system deletes the ProjectAccess record for that (userId, projectId)
- **AND** returns the updated project access list

#### Scenario: Admin changes project role

- **WHEN** an admin calls `PUT` with a projectId that already has access but a different role
- **THEN** the system updates the existing ProjectAccess record with the new role

#### Scenario: Non-admin is forbidden

- **WHEN** a non-admin user calls `PUT /api/admin/users/[userId]/projects`
- **THEN** the system returns 403 Forbidden

#### Scenario: Invalid role

- **WHEN** an admin calls `PUT` with a role other than `owner`, `editor`, or `viewer`
- **THEN** the system returns 400 Bad Request

---

### Requirement: Admin project access management UI

The admin user table SHALL provide access to a project management dialog for each user.

#### Scenario: Admin opens project management dialog

- **WHEN** an admin clicks the "管理项目" button on a user's row
- **THEN** the system opens a Dialog showing all projects with checkboxes/selects indicating the user's current role in each
- **AND** the project list supports text search/filter

#### Scenario: Admin grants access to a project

- **WHEN** an admin selects a role for a project the user previously had no access to
- **THEN** upon saving, the user gains access to that project with the selected role

#### Scenario: Admin removes access from a project

- **WHEN** an admin sets a project's role to "no access" (or deselects)
- **THEN** upon saving, the user's access to that project is revoked

#### Scenario: Admin saves changes

- **WHEN** an admin clicks "保存" in the dialog
- **THEN** the system calls `PUT /api/admin/users/[userId]/projects` with the complete project-role mapping
- **AND** displays a success Snackbar
- **AND** the dialog closes

#### Scenario: Admin cancels without saving

- **WHEN** an admin clicks "取消" or closes the dialog
- **THEN** no changes are persisted and the dialog closes
