## ADDED Requirements

### Requirement: User registration

The system SHALL allow a new user to register with a unique username and password. Input MUST be validated using zod schemas defined in `lib/auth.js`.

#### Scenario: Successful registration

- **WHEN** a visitor submits a registration form with a valid, unique username (2-32 chars, alphanumeric plus `_` `-`) and password (6-128 chars)
- **THEN** the system creates a User record with bcryptjs-hashed password and role "member", and redirects to the login page

#### Scenario: Duplicate username

- **WHEN** a visitor submits a registration form with an already-taken username
- **THEN** the system returns an error message "Username already exists" and does not create a user

#### Scenario: Weak password

- **WHEN** a visitor submits a registration form with a password shorter than 6 characters
- **THEN** the system returns an error message "Password must be at least 6 characters" and does not create a user

#### Scenario: Invalid username characters

- **WHEN** a visitor submits a registration form with a username containing characters other than `[a-zA-Z0-9_\-]`
- **THEN** the system returns an error message "Username must be alphanumeric with underscores and hyphens" and does not create a user

#### Scenario: Username too short or too long

- **WHEN** a visitor submits a registration form with a username shorter than 2 characters or longer than 32 characters
- **THEN** the system returns an error message about length constraints and does not create a user

---

### Requirement: User login

The system SHALL authenticate a user by username and password, and issue a JWT stored in an HttpOnly cookie.

#### Scenario: Successful login

- **WHEN** a user submits valid credentials (correct username + password)
- **THEN** the system sets an HttpOnly cookie `token` containing a signed JWT with `{ userId, role }` payload, and returns the user object

#### Scenario: Invalid credentials

- **WHEN** a user submits incorrect username or password
- **THEN** the system returns 401 with error message "Invalid username or password"

#### Scenario: Account does not exist

- **WHEN** a visitor submits credentials for a non-existent username
- **THEN** the system returns 401 with error message "Invalid username or password" (same generic message to prevent username enumeration)

---

### Requirement: JWT verification middleware

The system SHALL verify the JWT token on every protected request and inject user identity into request headers. JWT tokens SHALL have a 24-hour expiration (`exp` claim).

#### Scenario: Valid token

- **WHEN** a request carries a valid, non-expired JWT in the `token` cookie
- **THEN** the middleware verifies the signature using `jose.jwtVerify()`, extracts `{ userId, role }`, sets `x-user-id` and `x-user-role` headers, and allows the request to proceed

#### Scenario: Missing token

- **WHEN** a request to a protected route has no `token` cookie
- **THEN** the middleware returns 401 (for API routes) or redirects to `/login` (for page routes)

#### Scenario: Expired token

- **WHEN** a request carries an expired JWT token
- **THEN** the middleware returns 401 (for API routes) or redirects to `/login` (for page routes)

#### Scenario: Tampered token

- **WHEN** a request carries a JWT with invalid signature
- **THEN** the middleware returns 401 (for API routes) or redirects to `/login` (for page routes)

#### Scenario: Public routes bypass

- **WHEN** a request targets `/login`, `/signup`, `/setup`, or `/api/auth/*`
- **THEN** the middleware allows the request to proceed without token verification

---

### Requirement: User logout

The system SHALL allow a user to terminate their session by clearing the auth cookie.

#### Scenario: Successful logout

- **WHEN** a logged-in user calls the logout endpoint
- **THEN** the system clears the `token` cookie and returns success

---

### Requirement: Get current user

The system SHALL provide an endpoint for the frontend to fetch the currently authenticated user's information.

#### Scenario: Authenticated user

- **WHEN** a request with a valid token calls `GET /api/auth/me`
- **THEN** the system returns the user object `{ id, username, role }` (without password hash)

#### Scenario: Unauthenticated

- **WHEN** a request without a valid token calls `GET /api/auth/me`
- **THEN** the system returns `{ user: null }`

---

### Requirement: First-time setup

The system SHALL detect when no users exist and guide the first visitor through admin account creation via a `GET /api/auth/setup-check` endpoint and the `/setup` page.

#### Scenario: No users exist — setup check

- **WHEN** the frontend AuthContext initializes and the user has no auth cookie, it calls `GET /api/auth/setup-check`
- **THEN** the endpoint returns `{ needsSetup: true }` (by checking `User.count() === 0`)

#### Scenario: Users exist — setup check

- **WHEN** AuthContext calls `GET /api/auth/setup-check` and users already exist
- **THEN** the endpoint returns `{ needsSetup: false }`

#### Scenario: Redirect to setup

- **WHEN** AuthContext receives `{ needsSetup: true }`
- **THEN** it redirects the browser to `/setup`

#### Scenario: Redirect to login

- **WHEN** AuthContext receives `{ needsSetup: false }` and the user has no valid token cookie
- **THEN** it redirects the browser to `/login`

#### Scenario: Admin account created

- **WHEN** the first visitor submits the `/setup` form with username and password
- **THEN** the system creates a User with role "admin", sets the auth cookie, and redirects to the homepage

#### Scenario: Setup page blocked after initialization

- **WHEN** a visitor accesses `/setup` directly and `GET /api/auth/setup-check` returns `{ needsSetup: false }`
- **THEN** the setup page redirects to `/login`

---

### Requirement: Electron desktop bypass

The system SHALL skip all authentication when `AUTH_ENABLED=false` environment variable is set.

#### Scenario: Electron mode

- **WHEN** `AUTH_ENABLED=false` and a request arrives
- **THEN** the middleware injects a virtual local user `{ userId: "local", role: "admin" }` and allows all requests without token verification
