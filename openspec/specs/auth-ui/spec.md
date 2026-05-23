# auth-ui Specification

## Purpose

TBD - created by archiving change add-rbac-permission. Update Purpose after archive.

## Requirements

### Requirement: Login page UI

The system SHALL provide a login page at `/login` matching the project's design style.

#### Scenario: Login form display

- **WHEN** a visitor navigates to `/login`
- **THEN** the page displays a centered card with a title (app logo or name), a username text field, a password field, a "Log in" submit button, and a link to the signup page

#### Scenario: Login loading state

- **WHEN** a user submits the login form and the request is in flight
- **THEN** the submit button shows a loading spinner and is disabled

#### Scenario: Login error display

- **WHEN** the login API returns an error (401)
- **THEN** the page displays the error message below the form fields using MUI `Alert` component

#### Scenario: Successful login redirect

- **WHEN** login succeeds
- **THEN** the page redirects to the homepage `/`

#### Scenario: Logged-in user visits login page

- **WHEN** an already-authenticated user navigates to `/login`
- **THEN** the page redirects to `/`

#### Scenario: UI style consistency

- **WHEN** the login page renders
- **THEN** it uses MUI components (`Container`, `Box`, `Card`, `TextField`, `Button`, `Typography`, `Alert`, `CircularProgress`), framer-motion fade-in animation, and the project's existing theme and color palette

---

### Requirement: Signup page UI

The system SHALL provide a signup page at `/signup` matching the project's design style.

#### Scenario: Signup form display

- **WHEN** a visitor navigates to `/signup`
- **THEN** the page displays a centered card with a title, a username text field, a password field (with min-length hint), a "Sign up" submit button, and a link to the login page

#### Scenario: Signup loading state

- **WHEN** a user submits the signup form and the request is in flight
- **THEN** the submit button shows a loading spinner and is disabled

#### Scenario: Signup error display

- **WHEN** the signup API returns an error (e.g., duplicate username)
- **THEN** the page displays the error message below the form fields using MUI `Alert` component

#### Scenario: Successful signup redirect

- **WHEN** signup succeeds
- **THEN** the page redirects to `/login` with a success notification

#### Scenario: Logged-in user visits signup page

- **WHEN** an already-authenticated user navigates to `/signup`
- **THEN** the page redirects to `/`

#### Scenario: UI style consistency

- **WHEN** the signup page renders
- **THEN** it uses the same MUI component set, framer-motion animations, and theme as the login page

---

### Requirement: Setup page UI

The system SHALL provide a first-time setup page at `/setup` for creating the initial admin account.

#### Scenario: Setup form display

- **WHEN** a visitor navigates to `/setup` and no users exist in the system
- **THEN** the page displays a centered card with title "Welcome to Easy-Dataset", subtitle explaining this is first-time setup, a username field, a password field, and a "Create Admin Account" button

#### Scenario: Setup success

- **WHEN** the setup form is submitted successfully
- **THEN** the system creates the admin user, logs them in (sets auth cookie), and redirects to `/`

#### Scenario: Setup blocked when users exist

- **WHEN** a visitor navigates to `/setup` but users already exist
- **THEN** the page redirects to `/login`

#### Scenario: UI style consistency

- **WHEN** the setup page renders
- **THEN** it uses the same MUI component set, framer-motion animations, and theme as the login page

---

### Requirement: AuthContext frontend state

The system SHALL provide an `AuthContext` React context that manages authentication state across all pages.

#### Scenario: App initializes with existing session

- **WHEN** the app loads and the user already has a valid `token` cookie
- **THEN** `AuthContext` calls `GET /api/auth/me`, sets `user` state with the returned user object, and sets `isLoading` to false

#### Scenario: App initializes without session

- **WHEN** the app loads and no valid token cookie exists
- **THEN** `AuthContext` sets `user` to null, `isLoading` to false, and the middleware redirects the page request to `/login`

#### Scenario: AuthContext wraps the app

- **WHEN** the app renders
- **THEN** the root `layout.js` wraps children in `AuthProvider`, alongside existing `Provider` (Jotai), `ThemeRegistry`, and `I18nProvider`

---

### Requirement: Navbar user menu

The system SHALL display the current user's identity and an option to log out in the navigation bar.

#### Scenario: Logged-in user display

- **WHEN** a user is authenticated
- **THEN** the Navbar shows the current username (e.g., in an avatar chip or text button) and a logout option

#### Scenario: Logout from Navbar

- **WHEN** a user clicks the logout option in the Navbar
- **THEN** the system calls `POST /api/auth/logout`, clears the auth state, and redirects to `/login`

---

### Requirement: Global 401 interception

The system SHALL provide a fetch wrapper (`lib/api-client.js`) that globally intercepts 401 responses and handles session expiration.

#### Scenario: API returns 401 due to expired token

- **WHEN** any page or component calls `apiFetch(url, options)` and the server returns 401
- **THEN** the wrapper calls `POST /api/auth/logout` to clear the cookie, then redirects the browser to `/login?expired=true`

#### Scenario: API returns 401 due to no token

- **WHEN** `apiFetch()` receives a 401 response and no token was present
- **THEN** the wrapper redirects to `/login` without calling logout

#### Scenario: Successful API call

- **WHEN** `apiFetch()` receives a non-401 response
- **THEN** the wrapper returns the response unchanged to the caller

#### Scenario: Auth pages use raw fetch

- **WHEN** the login, signup, and setup pages make API calls
- **THEN** they use the raw `fetch()` function (not `apiFetch`), to avoid redirect loops during authentication
