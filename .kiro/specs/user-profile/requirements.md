# Requirements Document

## Introduction

The User Profile feature allows authenticated users of the SkyFreight Portal to view their own
profile information and update their editable personal details (first name, last name, company,
and phone number). The feature also surfaces a dedicated **Profile** navigation link in the sidebar,
positioned above the existing **Dashboard** link, so users can reach their profile from any page
in the application without navigating through the user-administration screens.

The backend API for updating a user record (`PUT /users/{id}`) and the `UserUpdateRequest` DTO
already exist. This feature adds the self-service view and edit experience for the currently
authenticated user, wires it to the Redux auth store so the navbar reflects updated names
immediately, and adjusts the sidebar navigation order.

---

## Glossary

- **Portal**: The SkyFreight airline cargo web application.
- **Profile_Page**: The frontend page at `/profile` that displays and allows editing of the
  authenticated user's personal details.
- **Profile_Form**: The editable form section of the Profile_Page containing firstName, lastName,
  company, and phone fields.
- **Current_User**: The authenticated user whose JWT identity matches the session stored in the
  Redux auth store.
- **User_API**: The backend REST endpoint set under `/users`, specifically `GET /users/{id}` and
  `PUT /users/{id}`.
- **Auth_Store**: The Redux `authSlice` that holds the Current_User object and persists it to
  `localStorage`.
- **Sidebar**: The left-hand navigation component (`Sidebar.tsx`) rendered inside `AppShell`.
- **Navbar**: The top navigation bar (`Navbar.tsx`) that displays the Current_User's name and
  initials.
- **UserUpdateRequest**: The backend DTO accepting `firstName`, `lastName`, `company`, and `phone`.
- **UserResponse**: The backend DTO returned after a successful user fetch or update, containing
  all non-sensitive user fields.

---

## Requirements

### Requirement 1: View Own Profile

**User Story:**
As an authenticated user of the SkyFreight Portal,
I want to view my own profile information on a dedicated Profile page,
so that I can see my current details — including my name, email address, company, phone number,
account type, role(s), and MFA status — without navigating to the administrative Users section.

#### Acceptance Criteria

1. WHEN the Current_User navigates to `/profile`, THE Profile_Page SHALL send a `GET /users/{id}` request using the Current_User's own ID and SHALL display the returned `firstName`, `lastName`, `email`, `company`, `phone`, `accountType`, `roles`, `mfaEnabled`, `lastLoginAt`, and `createdAt` fields; WHERE the user holds multiple roles, the `roles` field SHALL be rendered as a list.
2. WHEN the Profile_Page is loading data from the User_API, THE Profile_Page SHALL display a loading indicator; WHEN the response is received, THE loading indicator SHALL be dismissed and the profile fields SHALL become visible.
3. IF the User_API returns an error response when fetching profile data, THEN THE Profile_Page SHALL display an error message indicating that the profile could not be loaded, and SHALL provide a retry action that re-issues the `GET /users/{id}` request.
4. THE Profile_Page SHALL be accessible to all authenticated users regardless of their assigned role.
5. WHEN an unauthenticated user navigates to `/profile`, THE Portal SHALL redirect the user to `/login`.

---

### Requirement 2: Edit Own Profile Details

**User Story:**
As an authenticated user of the SkyFreight Portal,
I want to update my first name, last name, company, and phone number from my Profile page,
so that my contact details remain accurate without requiring an administrator to make changes
on my behalf.

#### Acceptance Criteria

1. WHEN the Current_User is viewing the Profile_Page, THE Profile_Form SHALL display pre-populated editable input fields for `firstName` (max 100 characters), `lastName` (max 100 characters), `company` (max 150 characters, optional), and `phone` (max 20 characters, optional), each pre-filled with the Current_User's existing values.
2. WHEN the Current_User submits the Profile_Form with valid data, THE Profile_Page SHALL send a `PUT /users/{id}` request containing the updated `firstName`, `lastName`, `company`, and `phone` values.
3. WHEN the User_API returns a successful response to the update request, THE Profile_Page SHALL display a success confirmation message and reflect the updated values in the displayed fields.
4. WHEN the User_API returns a successful response to the update request, THE Auth_Store SHALL update the Current_User object so the Navbar immediately reflects the new `firstName` and `lastName` values without requiring a page reload.
5. IF the Current_User submits the Profile_Form with a `firstName` or `lastName` field that is empty, THEN THE Profile_Form SHALL display a field-level validation error on the offending field(s) and SHALL NOT submit the request to the User_API; the `company` and `phone` fields SHALL be treated as optional and SHALL NOT trigger a validation error when left blank.
6. IF the Current_User submits the Profile_Form with a `phone` value that contains characters other than digits, spaces, hyphens, parentheses, or a leading `+`, THEN THE Profile_Form SHALL display a field-level validation error on the `phone` field and SHALL NOT submit the request to the User_API.
7. IF the User_API returns an error response to the update request, THEN THE Profile_Page SHALL display an error message identifying that the update failed, and SHALL retain the submitted values in the Profile_Form so the user can correct and resubmit.
8. THE Profile_Page SHALL display the `email` and `accountType` fields as read-only, non-editable values.

---

### Requirement 3: Profile Navigation Link in Sidebar

**User Story:**
As an authenticated user of the SkyFreight Portal,
I want a Profile link to appear in the sidebar navigation above the Dashboard link,
so that I can reach my profile with a single click from any page in the application.

#### Acceptance Criteria

1. THE Sidebar SHALL include a **Profile** navigation link that routes to `/profile`, accompanied by an icon consistent with the icon treatment applied to all other navigation links.
2. THE Sidebar SHALL render the Profile link as the first item in the navigation list, positioned above the Dashboard link.
3. WHEN the Current_User is on the `/profile` route, THE Sidebar SHALL highlight the Profile link as the active navigation item by applying a left accent border, a brand-colored background tint, and bold text — matching the active style treatment applied to other navigation links.
4. THE Profile navigation link SHALL be visible to all authenticated users regardless of their assigned role.

---

### Requirement 4: Route Registration

**User Story:**
As a developer maintaining the SkyFreight Portal,
I want the `/profile` route to be registered in the application router and protected by the
existing authentication guard,
so that the Profile_Page integrates consistently with all other protected routes in the application.

#### Acceptance Criteria

1. THE Portal SHALL register a `/profile` route within the protected route block in `App.tsx` that lazy-loads and renders the Profile_Page component, following the same pattern as `/dashboard` (no `roles` prop on the wrapping `ProtectedRoute`).
2. WHEN an authenticated user navigates directly to `/profile` via the browser address bar, THE Portal SHALL render the Profile_Page without redirecting.
3. WHEN an unauthenticated user navigates directly to `/profile`, THE Portal SHALL redirect the user to `/login` and SHALL preserve `/profile` as the intended destination so the user is returned there after successful login.
4. THE `/profile` route SHALL NOT require a specific role — it SHALL be accessible to any user whose `isAuthenticated` state is `true`.
5. WHEN no route matches the requested URL, THE Portal SHALL continue to redirect to `/login` as the default fallback behavior.
