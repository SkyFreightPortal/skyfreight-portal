# Implementation Plan: User Profile Feature

## Overview

This implementation plan creates a frontend-only self-service user profile feature that allows authenticated users to view and edit their personal information. The feature leverages existing backend API endpoints (`GET /users/{id}` and `PUT /users/{id}`), adds a new `/profile` route, integrates with the Redux auth store for immediate Navbar updates, and adds a Profile navigation link to the sidebar.

The implementation follows the existing patterns in the SkyFreight Portal: React 18 with TypeScript, React Hook Form with Zod validation, Redux Toolkit for state management, and Tailwind CSS for styling.

---

## Tasks

- [x] 1. Set up Profile page structure and routing
  - [x] 1.1 Create ProfilePage component with basic layout
    - Create `frontend/src/pages/profile/ProfilePage.tsx` as the main page component
    - Set up component state for `loading`, `error`, and `submitting`
    - Implement data fetching on mount using `userApi.getById(user.id)` from Redux auth state
    - Add loading spinner display during initial data fetch
    - Add error message display with retry button when fetch fails
    - Structure the page with ProfileHeader, ProfileDetailsView, and ProfileEditForm sections
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 1.2 Register /profile route in App.tsx
    - Add lazy import for ProfilePage component
    - Register `/profile` route within the protected routes block (before `/dashboard`)
    - Ensure no role restriction is applied (accessible to all authenticated users)
    - _Requirements: 4.1, 4.2, 4.4_

- [x] 2. Implement profile data display (read-only section)
  - [x] 2.1 Create ProfileDetailsView component for read-only fields
    - Create component to display `email`, `accountType`, `roles`, `mfaEnabled`, `lastLoginAt`, and `createdAt`
    - Render roles as a list when user has multiple roles
    - Format dates using `date-fns` with format `'dd MMM yyyy, HH:mm'`
    - Style read-only fields with visual distinction (lighter background or disabled appearance)
    - Use Tailwind CSS card layout (`bg-white rounded-xl shadow-sm border border-gray-100 p-6`)
    - _Requirements: 1.1, 2.8_

- [ ] 3. Implement profile editing functionality
  - [x] 3.1 Create ProfileEditForm component with validation
    - Create form component using React Hook Form
    - Define Zod schema for validation:
      - `firstName`: required, min 1 char, max 100 chars
      - `lastName`: required, min 1 char, max 100 chars
      - `company`: optional, max 150 chars
      - `phone`: optional, max 20 chars, regex `/^[\d\s\-\(\)\+]*$/`
    - Create form fields for `firstName`, `lastName`, `company`, and `phone` with pre-populated values
    - Display inline field-level validation errors below each field
    - Add Submit button with loading state ("Updating..." when `submitting` is true)
    - Add Cancel button that resets form to initial values
    - _Requirements: 2.1, 2.5, 2.6_

  - [x] 3.2 Implement form submission and API integration
    - Handle form submit event in ProfilePage component
    - Call `userApi.update(user.id, formData)` with updated values
    - Handle successful response: dispatch Redux `updateUser` action, show success message, update displayed values
    - Handle error response: display error message, retain form values for correction
    - Prevent API call when client-side validation fails
    - _Requirements: 2.2, 2.3, 2.7_

  - [ ] 3.3 Write unit tests for ProfileEditForm validation
    - Test that validation errors display when firstName is empty
    - Test that validation errors display when lastName is empty
    - Test that validation errors display when phone contains invalid characters
    - Test that no errors are shown when company is empty (optional field)
    - Test that no errors are shown when phone is empty (optional field)
    - Test that form submission is blocked when validation fails
    - _Requirements: 2.5, 2.6_

  - [ ] 3.4 Write unit tests for ProfilePage component
    - Test that user data is fetched on mount
    - Test that loading spinner is displayed during fetch
    - Test that error message and retry button are shown when fetch fails
    - Test that retry button re-issues the GET request
    - Test that form submits correct data structure
    - Test that success message displays after successful update
    - Test that error message displays when update fails
    - _Requirements: 1.2, 1.3, 2.3, 2.7_

- [x] 4. Update Redux store for profile synchronization
  - [x] 4.1 Add updateUser action to authSlice
    - Open `frontend/src/store/authSlice.ts`
    - Add `updateUser` reducer that updates `state.user` with the full User object
    - Persist updated user object to `localStorage` with key `'user'`
    - Export `updateUser` action alongside existing actions
    - _Requirements: 2.4_

  - [x] 4.2 Write unit tests for updateUser Redux action
    - Test that `updateUser` action updates user in Redux state
    - Test that `updateUser` action persists user to localStorage
    - Test that updated user data includes new firstName and lastName
    - _Requirements: 2.4_

- [ ] 5. Add Profile navigation link to Sidebar
  - [x] 5.1 Update Sidebar component with Profile link
    - Open `frontend/src/components/layout/Sidebar.tsx`
    - Import `UserCircle` icon from `lucide-react`
    - Add Profile navigation item to `navItems` array at index 0 (first position):
      - `to: '/profile'`
      - `label: 'Profile'`
      - `icon: UserCircle`
      - `roles: null` (accessible to all authenticated users)
    - Verify active route highlighting applies correctly when on `/profile`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 6. Checkpoint - Verify core functionality
  - Run frontend development server (`npm run dev` from `frontend/` directory)
  - Test navigation to `/profile` via sidebar link
  - Verify all user fields display correctly
  - Test form validation with empty required fields
  - Test form validation with invalid phone number
  - Test successful profile update with valid data
  - Verify Navbar reflects updated firstName/lastName immediately
  - Verify unauthenticated redirect to `/login` works
  - Ensure all tests pass
  - Ask the user if questions arise

- [ ] 7. Write integration tests for complete user flows
  - [ ] 7.1 Write integration test for happy path (view and edit profile)
    - Mock successful `GET /users/:id` response
    - Verify all user fields are displayed
    - Simulate user editing firstName, lastName, company, phone
    - Simulate form submission
    - Mock successful `PUT /users/:id` response
    - Verify Redux store is updated
    - Verify success message is displayed
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4_

  - [ ] 7.2 Write integration test for fetch failure
    - Mock failed `GET /users/:id` response (500 error)
    - Verify error message is displayed
    - Verify retry button is displayed
    - Simulate retry action
    - Mock successful response on retry
    - Verify profile data is now displayed
    - _Requirements: 1.3_

  - [ ] 7.3 Write integration test for update failure
    - Mock successful fetch
    - Simulate user editing firstName
    - Simulate form submission
    - Mock failed `PUT /users/:id` response (400 error)
    - Verify error message is displayed
    - Verify form retains edited values
    - Simulate correction and resubmission
    - Mock successful response
    - Verify success message
    - _Requirements: 2.7_

  - [ ] 7.4 Write integration test for client-side validation
    - Mock successful fetch
    - Simulate clearing firstName field
    - Simulate form submission
    - Verify "First name is required" error is shown
    - Verify API call is NOT made
    - Simulate entering invalid phone (e.g., "123-abc")
    - Simulate form submission
    - Verify phone validation error is shown
    - Verify API call is NOT made
    - _Requirements: 2.5, 2.6_

- [ ] 8. Final checkpoint and manual testing
  - Run full test suite (`npm run test` from `frontend/` directory)
  - Verify Profile link appears in sidebar above Dashboard
  - Verify Profile link is highlighted when on `/profile` route
  - Test on multiple screen sizes (mobile, tablet, desktop)
  - Verify form fields are keyboard-accessible
  - Verify error messages are clear and helpful
  - Test with different user roles (CUSTOMER_ADMIN, SALES_AGENT, etc.)
  - Verify all acceptance criteria from requirements are met
  - Ensure all tests pass, ask the user if questions arise

---

## Notes

- Tasks marked with `*` are optional test-related tasks and can be skipped for faster MVP delivery
- The feature is **frontend-only** and uses existing backend endpoints (`GET /users/{id}` and `PUT /users/{id}`)
- No backend changes, database migrations, or API modifications are required
- The design document does not include a "Correctness Properties" section, so property-based tests are not applicable
- All code examples use **TypeScript** as specified in the design document
- Redux store synchronization ensures the Navbar updates immediately after profile changes without requiring a page reload
- The `/profile` route has no role restrictions — it is accessible to all authenticated users
- Client-side validation prevents unnecessary API calls and provides immediate feedback to users
- The ProfileEditForm follows existing patterns from LoginPage and RegisterPage for consistency

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "4.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "5.1"] },
    { "id": 2, "tasks": ["3.1", "4.2"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["3.3", "3.4", "7.1", "7.2", "7.3", "7.4"] }
  ]
}
```
