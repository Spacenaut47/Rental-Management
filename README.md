# Rental Management — Fullstack

A fullstack rental/property management system.  
Backend is built with ASP.NET Core (.NET 10), Entity Framework Core, and SQLite.
Frontend is built with React, TypeScript, Redux Toolkit, RTK Query, and TailwindCSS.

---

## Overview

The system allows managing properties, units, tenants, leases, payments, and maintenance requests.  
It supports authentication with JWT and role-based authorization for Admin, Manager, Staff, and Tenant.  
Audit logging is included for important actions, and data is validated both on the backend (FluentValidation) and frontend.

---

## Project structure

- **backend/**  
  Contains the ASP.NET Core Web API. It includes controllers, entities, data access with EF Core, repositories with a Unit of Work pattern, services for business logic, validators, middleware, and mapping profiles.

- **frontend/**  
  Contains the React + TypeScript frontend application. It includes Redux store configuration, RTK Query API slices, React components, pages for each feature, layout elements such as navbar and sidebar, and small utility libraries for authentication, role handling, and storage.

---

## Prerequisites

- [.NET SDK 10](https://dotnet.microsoft.com/download) (the exact SDK is pinned in `global.json`)
- [Node.js 26](https://nodejs.org/) (see `frontend/.nvmrc`; run `nvm use` in `frontend/`)

SQLite requires no external server; `app.db` is created and migrated on startup.

---

## Features

- **Authentication & Authorization**  
  Login, register, JWT tokens, password hashing, and role-based access policies.

- **Properties & Units**  
  Create and manage properties and units, with relationships between them.

- **Tenants**  
  Register and manage tenants, search by name or email.

- **Leases**  
  Create leases between tenants and units, track rent, deposit, and active status.

- **Payments**  
  Record and view payments linked to leases, with methods and notes, and calculate total paid.

- **Maintenance Requests**  
  Create and update maintenance requests, set priority and status, and link to properties, units, or tenants.

- **Audit Logs**  
  Admins can view audit trails of actions performed in the system.

- **Frontend UI**  
  Responsive design with TailwindCSS, navigation via navbar and sidebar, protected routes, role-based gating of components, and small reusable UI pieces.

---

## Authentication & Roles

The system defines four roles:

- **Admin** – full access to all features, including viewing audit logs.  
- **Manager** – can manage properties, units, tenants, leases, payments, and maintenance requests.  
- **Staff** – can assist with maintenance and general operations.  
- **Tenant** – limited access to tenant-specific information.

Policies enforce these roles at the API level, while the frontend also gates features with a `RoleGate` component.

---

## API

The backend exposes REST endpoints for authentication, properties, units, tenants, leases, payments, maintenance, and audit logs.  
In development, the OpenAPI document is served at `/openapi/v1.json` and the Scalar API reference at `/scalar/v1`.
Each controller corresponds to a domain (e.g. `PropertiesController`, `TenantsController`) and supports standard CRUD operations.

---

## Database

- Uses **SQLite** by default.  
- EF Core manages the schema and relationships.  
- On startup, the application seeds default data including an admin account and sample records.  
- Entities include `User`, `Property`, `Unit`, `Tenant`, `Lease`, `Payment`, and `MaintenanceRequest`.

---

## Frontend

- Built with **React** and **TypeScript**.  
- Uses **Redux Toolkit** for state management and **RTK Query** for API calls.  
- Features include login, register, protected routes, dashboards, and CRUD pages for all main entities.  
- Role-based UI components hide or show features based on the logged-in user’s role.  
- Styled with **TailwindCSS**, ensuring clean and accessible UI.

---

## Validation

- **Backend** uses FluentValidation for DTOs, enforcing rules such as required fields, length checks, and email format.  
- **Frontend** also performs client-side validation before sending data, helping reduce invalid requests.

---

## Error handling

- Backend uses a global error handling middleware that converts exceptions into proper JSON error responses.  
- Frontend interprets these responses and shows validation messages or error alerts.  

---

## Running locally

```bash
# Backend + frontend together (from the repository root)
cd frontend
npm install
npm run dev

# Backend only
dotnet run --project backend --urls http://127.0.0.1:5180
```

Vite runs on `http://127.0.0.1:5173` and proxies `/api` to the backend.
Development seeds an administrator account: `admin` / `Admin@12345`.

---

## Testing

```bash
# Backend unit and integration tests
dotnet test --project backend.Tests/backend.Tests.csproj

# Frontend unit tests (Vitest + Testing Library)
cd frontend
npm run test:unit

# Frontend end-to-end tests (Playwright)
npm run test:e2e
```

---

## Notes

- Backend and frontend are decoupled but live in the same repository.  
- The frontend communicates with the backend through the `/api` base URL.
- JWT secret keys and configuration are set in the backend configuration files.  
