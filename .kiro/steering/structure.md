# Project Structure & Conventions

## Repository Layout

```
airline-cargo-portal/
├── backend/              Spring Boot API
├── frontend/             React SPA
├── infrastructure/       Terraform for AWS
├── .github/workflows/    CI/CD pipelines
└── docker-compose.yml    Local development orchestration
```

## Backend Structure (`backend/`)

### Package Organization (Layered Architecture)

```
src/main/java/com/skyfreight/portal/
├── CargoPortalApplication.java       # Spring Boot entry point
├── config/                           # Application configuration
│   ├── AppConfig.java
│   ├── AuditConfig.java
│   ├── OpenApiConfig.java
│   └── SecurityConfig.java
├── controller/                       # REST endpoints (@RestController)
├── dto/                              # Data Transfer Objects
│   ├── request/                      # Inbound request DTOs
│   └── response/                     # Outbound response DTOs
├── entity/                           # JPA entities (@Entity)
├── exception/                        # Custom exceptions + GlobalExceptionHandler
├── repository/                       # Spring Data JPA repositories
├── security/                         # JWT, filters, user details
└── service/                          # Business logic (@Service, @Transactional)
```

### Naming Conventions (Backend)

- **Controllers:** `{Resource}Controller` (e.g., `OfferController`, `UserController`)
- **Services:** `{Resource}Service` (e.g., `OfferService`, `AuthService`)
- **Repositories:** `{Entity}Repository` (e.g., `OfferRepository`)
- **Entities:** Singular noun (e.g., `Offer`, `User`, `Flight`)
- **DTOs:** `{Action}{Resource}Request/Response` (e.g., `OfferCreateRequest`, `OfferResponse`)
- **Exceptions:** `{Reason}Exception` (e.g., `OfferNotFoundException`)

### Code Style (Backend)

- Use **Lombok** annotations: `@RequiredArgsConstructor`, `@Slf4j`, `@Builder`, `@Data`
- Constructor injection via `@RequiredArgsConstructor` (not field injection)
- Declare role-based access control constants at top of controllers
- Use `@PreAuthorize` for method-level security
- Use `@Transactional` on service methods that modify data
- Use `@Valid` on request DTOs with Jakarta validation annotations
- Log significant actions with SLF4J: `log.info("Offer {} created", offerNumber)`
- Standard REST mappings: `POST` (create), `GET` (read), `PUT` (full update), `PATCH` (partial update), `DELETE`
- Wrap responses in `ApiResponse<T>` envelope with `success(data)` factory method
- Use pagination with `PageRequest` and `Sort` for list endpoints

### Exception Handling

- Custom exceptions extend `RuntimeException`
- `GlobalExceptionHandler` catches and maps to HTTP status codes
- Return structured error responses via `ApiResponse.error(message)`

## Frontend Structure (`frontend/`)

### Directory Organization

```
src/
├── api/                  # Axios API clients (one per domain)
│   ├── axiosConfig.ts    # Base Axios instance + interceptors
│   ├── authApi.ts
│   ├── offerApi.ts
│   └── userApi.ts
├── components/           # Reusable React components
│   ├── auth/
│   ├── common/           # Shared UI components (buttons, modals, etc.)
│   ├── layout/           # Layout components (header, sidebar, etc.)
│   └── users/
├── constants/            # Enums, options, labels
├── hooks/                # Custom React hooks
├── pages/                # Route-level page components
│   ├── auth/
│   ├── dashboard/
│   ├── offers/
│   └── users/
├── store/                # Redux Toolkit slices
├── types/                # TypeScript type definitions
├── utils/                # Utility functions
├── App.tsx               # Root component with routing
└── main.tsx              # React entry point
```

### Naming Conventions (Frontend)

- **Components:** PascalCase (e.g., `OfferListPage`, `StatusBadge`)
- **Files:** Match component name (e.g., `OfferListPage.tsx`)
- **API modules:** camelCase + `Api` suffix (e.g., `offerApi.ts`)
- **Types:** PascalCase interfaces/types (e.g., `Offer`, `OfferStatus`)
- **Hooks:** camelCase with `use` prefix (e.g., `useAuth`, `usePermissions`)
- **Redux slices:** camelCase + `Slice` suffix (e.g., `authSlice.ts`)

### Code Style (Frontend)

- Use **functional components** with hooks (no class components)
- Use **TypeScript** for all code — explicit types for props and state
- Import paths use `@/` alias for `src/` directory
- Use `type` imports: `import type { Offer } from '@/types/offer.types'`
- State management: Redux Toolkit for global state, `useState`/`useReducer` for local
- Forms: React Hook Form + Zod schema validation
- API calls in `useEffect` or event handlers via async/await
- Use `useCallback` for memoized callbacks passed to child components
- Tailwind CSS utility classes for styling (no CSS modules or styled-components)
- Lucide React for icons (e.g., `<Search size={16} />`)
- Date formatting via `date-fns` (e.g., `format(date, 'dd MMM yyyy')`)

### Component Patterns

**Page Components:** Located in `src/pages/`, handle routing, data fetching, and layout
**Feature Components:** Domain-specific, located in `src/components/{domain}/`
**Common Components:** Reusable UI primitives in `src/components/common/`

### API Client Pattern

Each domain has a dedicated API module:
```typescript
export const offerApi = {
  list: (params) => axiosInstance.get('/offers', { params }),
  create: (data) => axiosInstance.post('/offers', data),
  getById: (id) => axiosInstance.get(`/offers/${id}`),
  // ...
}
```

Base URL and interceptors (JWT injection, error handling) configured in `axiosConfig.ts`

## Database Migrations

- Located in `backend/src/main/resources/db/migration/`
- Naming: `V{version}__{description}.sql` (e.g., `V1__create_users_table.sql`)
- Flyway runs migrations automatically on application startup
- Never modify existing migrations — create new ones for changes

## Testing

- **Backend:** JUnit 5 + Spring Boot Test, H2 in-memory database for integration tests
- **Frontend:** (Not yet implemented — consider Vitest + React Testing Library)

## API Documentation

- Swagger UI auto-generated from Springdoc OpenAPI annotations
- Use `@Tag`, `@Operation`, `@Schema` for documentation
- Available at `/api/v1/swagger-ui.html` when backend is running

## Security Patterns

- JWT Bearer token authentication via `Authorization` header
- Tokens issued by `/api/v1/auth/login` and `/api/v1/auth/mfa/verify`
- Refresh tokens stored securely, rotated on use
- Frontend stores tokens in Redux state (consider HttpOnly cookies for production)
- Role-based access enforced at controller level via `@PreAuthorize`

## Environment Configuration

- Backend: `application.properties` or `application.yml` in `src/main/resources/`
- Frontend: `.env` files (Vite uses `VITE_` prefix for exposed variables)
- Docker: Environment variables in `docker-compose.yml`
