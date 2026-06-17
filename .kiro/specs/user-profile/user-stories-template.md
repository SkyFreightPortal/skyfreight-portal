# Simple User Story Template

**User Story for:** User Profile Feature

---

## Story 1: View Own Profile

| Field | Content |
|-------|---------|
| **TITLE** | View Own Profile Information |
| **USER STORY** | As an authenticated user of the SkyFreight Portal, I want to view my own profile information on a dedicated Profile page, so that I can see my current details — including my name, email address, company, phone number, account type, role(s), and MFA status — without navigating to the administrative Users section. |
| **ACCEPTANCE CRITERIA** | 1. When the user navigates to `/profile`, the Profile Page shall send a `GET /users/{id}` request using the user's own ID and shall display the returned firstName, lastName, email, company, phone, accountType, roles, mfaEnabled, lastLoginAt, and createdAt fields; where the user holds multiple roles, the roles field shall be rendered as a list.<br>2. When the Profile Page is loading data from the User API, the Profile Page shall display a loading indicator; when the response is received, the loading indicator shall be dismissed and the profile fields shall become visible.<br>3. If the User API returns an error response when fetching profile data, then the Profile Page shall display an error message indicating that the profile could not be loaded, and shall provide a retry action that re-issues the GET /users/{id} request.<br>4. The Profile Page shall be accessible to all authenticated users regardless of their assigned role.<br>5. When an unauthenticated user navigates to `/profile`, the Portal shall redirect the user to `/login`. |
| **PRIORITY** | HIGH |
| **ESTIMATION** | 5 story points |
| **DESCRIPTION** | This user story enables authenticated users to view their complete profile information on a dedicated page at `/profile`. The feature leverages the existing `GET /users/{id}` backend endpoint and displays all non-sensitive user fields including account metadata, role assignments, and MFA status. The page includes proper loading states and error handling with retry capability. Dependencies: existing User API endpoint, Redux auth store for current user ID. |

---

## Story 2: Edit Own Profile Details

| Field | Content |
|-------|---------|
| **TITLE** | Edit Own Profile Details |
| **USER STORY** | As an authenticated user of the SkyFreight Portal, I want to update my first name, last name, company, and phone number from my Profile page, so that my contact details remain accurate without requiring an administrator to make changes on my behalf. |
| **ACCEPTANCE CRITERIA** | 1. When the user is viewing the Profile Page, the Profile Form shall display pre-populated editable input fields for firstName (max 100 characters), lastName (max 100 characters), company (max 150 characters, optional), and phone (max 20 characters, optional), each pre-filled with the user's existing values.<br>2. When the user submits the Profile Form with valid data, the Profile Page shall send a PUT /users/{id} request containing the updated firstName, lastName, company, and phone values.<br>3. When the User API returns a successful response to the update request, the Profile Page shall display a success confirmation message and reflect the updated values in the displayed fields.<br>4. When the User API returns a successful response to the update request, the Auth Store shall update the current user object so the Navbar immediately reflects the new firstName and lastName values without requiring a page reload.<br>5. If the user submits the Profile Form with a firstName or lastName field that is empty, then the Profile Form shall display a field-level validation error on the offending field(s) and shall not submit the request to the User API; the company and phone fields shall be treated as optional and shall not trigger a validation error when left blank.<br>6. If the user submits the Profile Form with a phone value that contains characters other than digits, spaces, hyphens, parentheses, or a leading +, then the Profile Form shall display a field-level validation error on the phone field and shall not submit the request to the User API.<br>7. If the User API returns an error response to the update request, then the Profile Page shall display an error message identifying that the update failed, and shall retain the submitted values in the Profile Form so the user can correct and resubmit.<br>8. The Profile Page shall display the email and accountType fields as read-only, non-editable values. |
| **PRIORITY** | HIGH |
| **ESTIMATION** | 8 story points |
| **DESCRIPTION** | This user story implements self-service profile editing, allowing users to update their personal contact details without admin intervention. The feature uses the existing `PUT /users/{id}` backend endpoint and the UserUpdateRequest DTO. Key aspects include pre-population of current values, client-side validation for required fields and phone format, immediate navbar synchronization via Redux auth store updates, and proper error handling that preserves user input. Dependencies: existing User API update endpoint, UserUpdateRequest DTO, Redux authSlice setUser action, Navbar component. |

---

## Story 3: Profile Navigation Link in Sidebar

| Field | Content |
|-------|---------|
| **TITLE** | Add Profile Link to Sidebar Navigation |
| **USER STORY** | As an authenticated user of the SkyFreight Portal, I want a Profile link to appear in the sidebar navigation above the Dashboard link, so that I can reach my profile with a single click from any page in the application. |
| **ACCEPTANCE CRITERIA** | 1. The Sidebar shall include a Profile navigation link that routes to `/profile`, accompanied by an icon consistent with the icon treatment applied to all other navigation links.<br>2. The Sidebar shall render the Profile link as the first item in the navigation list, positioned above the Dashboard link.<br>3. When the user is on the `/profile` route, the Sidebar shall highlight the Profile link as the active navigation item by applying a left accent border, a brand-colored background tint, and bold text — matching the active style treatment applied to other navigation links.<br>4. The Profile navigation link shall be visible to all authenticated users regardless of their assigned role. |
| **PRIORITY** | MEDIUM |
| **ESTIMATION** | 3 story points |
| **DESCRIPTION** | This user story enhances the navigation experience by adding a dedicated Profile link to the sidebar, making the profile page accessible from anywhere in the application. The link follows existing sidebar conventions for styling, iconography, and active state indication. Implementation involves updating the Sidebar.tsx component's navItems array to include a new Profile entry positioned at index 0. No role-based visibility restrictions are applied. Dependencies: Sidebar.tsx component, existing icon library. |

---

## Story 4: Register Profile Route

| Field | Content |
|-------|---------|
| **TITLE** | Register Profile Route in Application Router |
| **USER STORY** | As a developer maintaining the SkyFreight Portal, I want the `/profile` route to be registered in the application router and protected by the existing authentication guard, so that the Profile Page integrates consistently with all other protected routes in the application. |
| **ACCEPTANCE CRITERIA** | 1. The Portal shall register a `/profile` route within the protected route block in App.tsx that lazy-loads and renders the Profile Page component, following the same pattern as `/dashboard` (no roles prop on the wrapping ProtectedRoute).<br>2. When an authenticated user navigates directly to `/profile` via the browser address bar, the Portal shall render the Profile Page without redirecting.<br>3. When an unauthenticated user navigates directly to `/profile`, the Portal shall redirect the user to `/login` and shall preserve `/profile` as the intended destination so the user is returned there after successful login.<br>4. The `/profile` route shall not require a specific role — it shall be accessible to any user whose isAuthenticated state is true.<br>5. When no route matches the requested URL, the Portal shall continue to redirect to `/login` as the default fallback behavior. |
| **PRIORITY** | HIGH |
| **ESTIMATION** | 2 story points |
| **DESCRIPTION** | This user story ensures proper route registration and authentication protection for the Profile page. The `/profile` route is added to App.tsx following the established lazy-loading pattern used by other protected routes like `/dashboard`. The route is wrapped in ProtectedRoute without role restrictions, making it accessible to all authenticated users. Unauthenticated access triggers a redirect to `/login` with return-path preservation via location state. Dependencies: App.tsx routing configuration, ProtectedRoute component, ProfilePage component (to be created). |

---

**Total Estimation:** 18 story points

**Feature Priority:** HIGH

**Dependencies:**
- Existing backend API: `GET /users/{id}`, `PUT /users/{id}`
- Existing DTOs: `UserUpdateRequest`, `UserResponse`
- Redux auth store: `authSlice` with `setUser` action
- UI Components: `Sidebar.tsx`, `Navbar.tsx`, `ProtectedRoute`
- New component to create: `ProfilePage`
