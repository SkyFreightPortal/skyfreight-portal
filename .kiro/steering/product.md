# SkyFreight Portal

**Product Type:** Enterprise airline cargo offer and order management platform

**Purpose:** Full-stack web application for managing airline cargo operations — enabling freight forwarders, shippers, and airline personnel to create cargo offers, search routes, check availability, compare pricing, and process bookings.

## Core Domains

- **User Management & Access Control** — Self-registration, corporate account onboarding, approval workflows, role-based access (6 roles), MFA authentication
- **Offer Management** — Dynamic rate calculation, 8 cargo service types, ancillary services, offer lifecycle (draft → active → accepted/rejected/withdrawn/expired)
- **Shopping & Search** — Route search (direct + connecting), availability checks, calendar pricing, alternative airport suggestions, recommendation engine

## Key Business Rules

- **Chargeable Weight:** Maximum of actual weight vs volumetric weight (length × width × height / 6000)
- **Pricing Components:** Base charge + fuel surcharge + security/screening/terminal/customs fees + ancillary services
- **Offer Versioning:** Revising an offer creates a new version and supersedes the original
- **Status Transitions:** ACTIVE → ACCEPTED/REJECTED/WITHDRAWN/EXPIRED only
- **Capacity Hold:** 48 hours default, 7-day default offer validity

## Roles & Permissions

| Role | Access |
|---|---|
| AIRLINE_ADMINISTRATOR | Full system access |
| CUSTOMER_ADMIN | Manage own company bookings |
| SALES_AGENT | Manage customers, process approvals |
| OPERATIONS_USER | Handle cargo processing |
| REVENUE_MANAGEMENT_USER | Manage pricing and yields |
| FINANCE_USER | Billing and settlement |

## Service Types

Express, General Cargo, Pharma, Perishable, Valuable, Live Animals, Dangerous Goods, Priority
