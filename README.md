# ✈ SkyFreight Portal

> **Airline Cargo Offer and Order Management Platform**

A full-stack, production-grade web portal for managing airline cargo operations — built with React, Spring Boot, and MySQL, deployed on AWS.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│             React 18 + TypeScript           │
│        Tailwind CSS · Redux Toolkit         │
│           Vite · React Router v6            │
└──────────────────┬──────────────────────────┘
                   │ REST / JSON (JWT Bearer)
┌──────────────────▼──────────────────────────┐
│           Spring Boot 3.2 · Java 21         │
│   Spring Security 6 · JWT · TOTP MFA        │
│     Flyway · Spring Data JPA · Swagger UI   │
└──────────────────┬──────────────────────────┘
                   │ JPA / JDBC
┌──────────────────▼──────────────────────────┐
│                MySQL 8                      │
└─────────────────────────────────────────────┘
```

---

## Step 1 — User Management & Access Control

### Features implemented
| Feature | Status |
|---|---|
| Self-registration (Freight Forwarder / Shipper / Corporate) | ✅ |
| Corporate account onboarding with approval workflow | ✅ |
| Email notifications (registration pending, approved, rejected) | ✅ |
| Username/password authentication with JWT | ✅ |
| Refresh token rotation | ✅ |
| Multi-factor authentication (TOTP / Google Authenticator) | ✅ |
| Role-based access control (6 roles) | ✅ |
| Approval queue with approve/reject and notes | ✅ |
| User management — search, filter, activate/suspend | ✅ |
| Full audit logging | ✅ |
| Swagger UI API documentation | ✅ |

### Roles
| Role | Description |
|---|---|
| `AIRLINE_ADMINISTRATOR` | Full system access |
| `CUSTOMER_ADMIN` | Manage own company bookings |
| `SALES_AGENT` | Manage customers, process approvals |
| `OPERATIONS_USER` | Handle cargo processing |
| `REVENUE_MANAGEMENT_USER` | Manage pricing and yields |
| `FINANCE_USER` | Billing and settlement |

---

## Step 2 — Offer Management

### Features implemented
| Feature | Status |
|---|---|
| Dynamic rate calculation (chargeable weight = max of actual vs volumetric) | ✅ |
| Base charge, fuel surcharge, security/screening/terminal/customs fees | ✅ |
| 8 cargo service types (Express, General Cargo, Pharma, Perishable, Valuable, Live Animals, Dangerous Goods, Priority) | ✅ |
| Ancillary services (door pickup, insurance, packaging, etc.) | ✅ |
| Offer creation with capacity availability check | ✅ |
| Offer revise — creates a new version and supersedes the original | ✅ |
| Offer status workflow (Draft → Active → Accepted/Rejected/Withdrawn/Expired) | ✅ |
| Scheduled offer expiry | ✅ |
| Multi-offer side-by-side comparison | ✅ |
| Offer list with filters (status, route, service type, search) and pagination | ✅ |

---

## Step 3 — Shopping & Search

### Features implemented
| Feature | Status |
|---|---|
| Route search by origin, destination, date, service type — direct and connecting itineraries | ✅ |
| Availability search — flight schedule, space (kg) and ULD position availability | ✅ |
| Connection finder via hub airports with minimum layover enforcement | ✅ |
| Calendar pricing — 7-day (configurable) view with cheapest-day highlight | ✅ |
| Alternative/nearby airport pricing (e.g. JFK ↔ EWR, LHR ↔ LGW) | ✅ |
| Recommendation engine — faster routes, lower-cost routes, alternative products, nearby airports | ✅ |
| Deterministic date-varying availability/pricing (no booking ledger required) | ✅ |

---

## Quick Start (Local with Docker)

### Prerequisites
- Docker Desktop installed and running

### Run everything

```bash
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost |
| Backend API | http://localhost:8080/api/v1 |
| Swagger UI | http://localhost:8080/api/v1/swagger-ui.html |
| MailHog (email preview) | http://localhost:8025 |

### Default admin credentials
| Field | Value |
|---|---|
| Email | `admin@skyfreight.com` |
| Password | `Admin@1234` |

---

## Local Development (without Docker)

### Backend

```bash
cd backend
# Start MySQL locally (or use docker-compose for DB only)
docker-compose up mysql -d

mvn spring-boot:run
# API available at http://localhost:8080/api/v1
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## API Reference

All endpoints are documented in Swagger UI at `/api/v1/swagger-ui.html`

### Key Endpoints

```
POST  /api/v1/auth/register        Register new account
POST  /api/v1/auth/login           Authenticate
POST  /api/v1/auth/mfa/verify      Verify MFA code
POST  /api/v1/auth/refresh         Refresh access token
POST  /api/v1/auth/logout          Sign out

GET   /api/v1/users                List users (paginated, filterable)
PUT   /api/v1/users/{id}           Update user
PATCH /api/v1/users/{id}/status    Activate / suspend
POST  /api/v1/users/{id}/roles/{roleId}   Assign role
DELETE /api/v1/users/{id}/roles/{roleId} Revoke role

GET   /api/v1/approvals            List approval requests
POST  /api/v1/approvals/{id}/decide   Approve or reject
GET   /api/v1/approvals/pending/count  Count pending approvals

POST  /api/v1/offers               Create a cargo offer with calculated pricing
GET   /api/v1/offers               List offers (filterable, paginated)
GET   /api/v1/offers/{id}          Get offer details
POST  /api/v1/offers/{id}/revise   Re-price an offer as a new version
PATCH /api/v1/offers/{id}/status   Accept, reject or withdraw an offer
POST  /api/v1/offers/compare       Compare multiple offers side-by-side

GET   /api/v1/search/routes          Search direct & connecting route options
GET   /api/v1/search/availability    Flight, space and ULD availability
GET   /api/v1/search/calendar        Calendar pricing & alternative airports
GET   /api/v1/search/recommendations Faster/cheaper routes, alternative products, nearby airports
```

---

## Project Structure

```
airline-cargo-portal/
├── backend/          Spring Boot API
├── frontend/         React SPA
├── infrastructure/   Terraform for AWS
├── .github/workflows CI/CD pipelines
└── docker-compose.yml
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| State | Redux Toolkit |
| Backend | Spring Boot 3.2, Java 21 |
| Security | Spring Security 6, JJWT, TOTP (Google Authenticator) |
| Database | MySQL 8, Flyway migrations |
| API Docs | Springdoc OpenAPI (Swagger UI) |
| Containers | Docker, Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | AWS ECS Fargate, RDS, ALB, ACM |

---

*SkyFreight Portal — Built for enterprise airline cargo operations*
