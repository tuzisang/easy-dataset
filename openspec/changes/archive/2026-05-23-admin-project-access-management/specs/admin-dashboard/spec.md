## MODIFIED Requirements

### Requirement: Admin user management page

The system SHALL provide an admin-only page at `/admin` for viewing and managing all users.

#### Scenario: Admin accesses the page

- **WHEN** an admin user navigates to `/admin`
- **THEN** the system displays a table of all users with columns: username, role, creation date, project count, and actions

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

#### Scenario: Admin opens project management for a user

- **WHEN** an admin clicks "管理项目" on a user's row
- **THEN** the system opens a Dialog displaying all projects with the user's current access roles, search/filter, and save/cancel actions

## ADDED Requirements

### Requirement: Admin actions column includes project management

The system SHALL include a project management button in the actions column of the admin user table.

#### Scenario: Admin sees project management button

- **WHEN** an admin views the user table
- **THEN** each user row displays a "管理项目" button in the actions column alongside the delete button

#### Scenario: Admin opens project management for self

- **WHEN** an admin clicks "管理项目" on their own row
- **THEN** the dialog opens normally (self-management of project access is allowed)
