# Technology Stack

## Backend

- **Framework:** Spring Boot 3.2.5
- **Language:** Java 21
- **Build Tool:** Maven
- **Database:** MySQL 8 (production), H2 (testing)
- **Migration:** Flyway
- **ORM:** Spring Data JPA with Hibernate
- **Security:** Spring Security 6 with JWT (JJWT 0.12.5)
- **MFA:** TOTP via Google Authenticator (googleauth 1.5.0)
- **API Documentation:** Springdoc OpenAPI 2.5.0 (Swagger UI)
- **Email:** Spring Boot Mail with SMTP
- **Utilities:** Lombok for boilerplate reduction

## Frontend

- **Framework:** React 18
- **Language:** TypeScript
- **Build Tool:** Vite 5
- **Routing:** React Router v6
- **State Management:** Redux Toolkit with React Redux
- **HTTP Client:** Axios
- **Forms:** React Hook Form with Zod validation
- **Styling:** Tailwind CSS 3
- **Icons:** Lucide React
- **Date Handling:** date-fns
- **Linting:** ESLint with TypeScript plugin

## Infrastructure

- **Containerization:** Docker, Docker Compose
- **Email Preview:** MailHog (development)
- **CI/CD:** GitHub Actions
- **Cloud:** AWS (ECS Fargate, RDS, ALB, ACM)
- **IaC:** Terraform

## Common Commands

### Backend (from `backend/` directory)

```bash
# Run with Maven (requires MySQL running)
mvn spring-boot:run

# Run tests
mvn test

# Build JAR
mvn clean package

# Run MySQL via Docker only
docker-compose up mysql -d
```

**API runs at:** http://localhost:8080/api/v1  
**Swagger UI:** http://localhost:8080/api/v1/swagger-ui.html

### Frontend (from `frontend/` directory)

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

**Dev server runs at:** http://localhost:5173

### Full Stack (from project root)

```bash
# Start everything with Docker Compose
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

**Services:**
- Frontend: http://localhost
- Backend API: http://localhost:8080/api/v1
- MailHog: http://localhost:8025

### Database

**Default credentials (Docker):**
- Database: `skyfreight_portal`
- User: `root`
- Password: `rootpassword`

Flyway migrations are in `backend/src/main/resources/db/migration/`

## Key Dependencies

### Backend (Maven)
- `spring-boot-starter-web` — REST API
- `spring-boot-starter-security` — Authentication/Authorization
- `spring-boot-starter-data-jpa` — Database access
- `spring-boot-starter-validation` — Request validation
- `spring-boot-starter-mail` — Email notifications
- `io.jsonwebtoken:jjwt-*` — JWT handling
- `springdoc-openapi-starter-webmvc-ui` — API docs
- `lombok` — Code generation

### Frontend (npm)
- `react`, `react-dom` — UI framework
- `react-router-dom` — Routing
- `@reduxjs/toolkit`, `react-redux` — State
- `axios` — HTTP client
- `react-hook-form`, `zod` — Forms & validation
- `tailwindcss` — Styling
- `lucide-react` — Icons
