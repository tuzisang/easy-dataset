## ADDED Requirements

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
