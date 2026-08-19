# SPEC-001: Project Setup and Codebase Initialization

## Feature
CareFin Engineering Foundation and Package Setup

## Objective
Establish the minimum production-style engineering foundation required for CareFin. The foundation must support future frontend development, backend development, PostgreSQL, pgvector, API development, testing, and CI/CD for local, staging, and production environments, without prematurely implementing any CareFin business features.

---

## Architectural Decisions

### Frontend Stack
* **Framework**: Next.js (App Router, current stable version)
* **Language**: TypeScript (strict mode enabled)
* **Styling**: Tailwind CSS (coupled with CSS variables mapping to CareFin design tokens)
* **UI Components**: shadcn/ui or equivalent restrained, Radix UI-based component foundation
* **Icons**: Lucide Icons

### Backend Stack
* **Framework**: FastAPI (Python 3.10+)
* **Validation**: Pydantic v2
* **Server**: Uvicorn

### Database Stack
* **Database**: PostgreSQL 15+ (Local container run with `pgvector/pgvector:pg15` or similar official image)
* **Migrations**: Alembic / SQLAlchemy ORM configuration

### Authentication Infrastructure
* Register simple model endpoints placeholders to decode stateless JWT headers in line with the security model, but do not construct user validation databases or complex registration logic yet.

---

## Scope

### 1. Repository Structure
Define the project directory layout:
```text
/frontend      # Next.js Application
/backend       # FastAPI Application
/tests         # Directory for multi-package testing setups
/.github       # GitHub CI workflow folder
```

### 2. Frontend Foundation
* Initialize a Next.js TypeScript application inside `/frontend`.
* Integrate Tailwind CSS, postcss, and tailwind configurations.
* Configure shadcn/ui boilerplate components directory structure (e.g. Radix primitives).
* Set up Lucide Icons packages.
* Configure frontend code linting (ESLint) and TypeScript build checking configurations.
* Create a basic, visually clean, unstyled application entry page (App Router `/app/page.tsx`) verifying Tailwind classes.

### 3. Backend Foundation
* Configure the FastAPI python structure inside `/backend`.
* Create the configuration manager using Pydantic Settings (to securely read configurations from environment variables).
* Implement the `/api/health` status check endpoint.
* Construct the global exception-to-JSON error mappings boilerplate.
* Setup pytest testing directories and configurations.
* Configure python linting / formatting checks (e.g., flake8 or Ruff).

### 4. Database Foundation
* Configure local PostgreSQL with `pgvector` enabled.
* Provide the database connection session logic (SQLAlchemy engine configuration).
* Initialize the Alembic migration directory layout (`/backend/alembic`).

### 5. Docker / Local Development
* Configure a development-focused `docker-compose.yml` to run:
  * PostgreSQL with pgvector enabled.
* Expose ports mapping cleanly to the host environment (typically `5432` for DB).

### 6. Environment Configuration
* Create a secure configuration template: `/.env.example` containing placeholder connection parameters.
* Ensure `.env` is listed under the root `.gitignore` file.

### 7. Testing Foundation
* **Frontend**: Basic build and lint checks.
* **Backend**: Pytest setup with `test_health.py` validating the `/api/health` endpoint.

### 8. CI Foundation
* Configure `/.github/workflows/ci.yml` verifying:
  * Frontend: Type checking (`tsc`), linting (`eslint`), and production build compilation (`next build`).
  * Backend: Linting checks and pytest execution.

---

## Out of Scope

SPEC-001 MUST NOT implement the following CareFin modules and functions:
* Dashboard UI pages or sidebar controls.
* Insurance policies catalog, file upload inputs, or metadata tables.
* OCR parsers, PDF document extractors, or text chunks preprocessing.
* Retrieval-Augmented Generation (RAG) vector embeddings indexing or retrieval.
* Claims trackers, pre-authorization wizards, or letter explainers.
* Out-of-pocket calculator algorithms or crowdfunding platform disbursement formulas.
* Hospital network searches, cashless relationships lookups, or geographic listings.
* Insurance advisor recommendation views, NGOs charts, or scam detection models.
* Production authentication databases (no user tables initialized yet).

---

## Architectural Principles

* **Clean Foundation**: Keep configuration folders simple and clean. Avoid third-party abstractions until their necessity is proven.
* **Clear Boundaries**: The frontend communicates with the backend exclusively via standard REST JSON APIs. The backend interacts with the database using parameterized queries or ORM models.
* **Testability**: Ensure servers and database connections can be programmatically mocked for automated verification.
* **Extensibility**: Layout configurations (like Tailwind variables or database configuration schemas) to allow smooth additions in future stages.

---

## Acceptance Criteria

### Frontend
* Next.js application runs and responds locally.
* TypeScript compiler (`tsc --noEmit`) passes with zero warnings/errors.
* ESLint validation checks pass.
* Production build (`npm run build` or `next build`) compiles successfully.
* Tailwind is loaded and active.
* Lucide icons render successfully in basic component placeholders.

### Backend
* FastAPI application launches without errors.
* The `/api/health` endpoint returns a `200 OK` status.
* Pydantic settings load configurations from `.env` correctly.
* Pytest reports `100%` pass rate on healthcheck checks.
* Python linting verifies clean codebase formats.

### Database
* PostgreSQL container boots and runs locally via `docker compose`.
* The database engine compiles and enables the `pgvector` extension successfully.
* Backend successfully establishes a database connection pools baseline.
* Alembic is initialized and able to run connection health checks.

### Environment
* `/.env.example` is complete and excludes active secrets.
* Configurations are separated from application code logic.

### CI
* A GitHub Actions workflow configuration verifies the pull requests by running the frontend and backend lint/test steps.

---

## Test Cases

### TEST-001: Frontend Development Boot
* **Command**: Run development server script (e.g. `npm run dev` in `/frontend`).
* **Expected Output**: Next.js server starts on local port 3000 without errors.

### TEST-002: Frontend Type Verification
* **Command**: Run typescript compiler check (e.g. `npm run type-check` or `npx tsc --noEmit`).
* **Expected Output**: Exits with code `0` (no errors).

### TEST-003: Frontend Linting
* **Command**: Run frontend code linter checking (e.g. `npm run lint`).
* **Expected Output**: Exits with code `0`.

### TEST-004: Frontend Production Build Compilation
* **Command**: Run production compiler build (e.g. `npm run build`).
* **Expected Output**: Production code builds, optimization compiles, and exits with code `0`.

### TEST-005: Backend FastAPI Development Boot
* **Command**: Run ASGI server launcher (e.g. `uvicorn app.main:app` in `/backend`).
* **Expected Output**: Server listens on port 8000.

### TEST-006: Backend API Health Route check
* **Command**: Trigger HTTP GET query to `http://localhost:8000/api/health`.
* **Expected Output**: Status `200 OK` with JSON: `{"status": "healthy", "database": "connected"}` (or similar).

### TEST-007: Backend Pytest Suite Run
* **Command**: Execute Pytest (e.g. `pytest` in `/backend`).
* **Expected Output**: 100% of defined basic API tests pass.

### TEST-008: Database Setup Boot
* **Command**: Spin up Docker (e.g. `docker compose up -d`).
* **Expected Output**: PostgreSQL service container shifts to "running" status.

### TEST-009: Database Session Validation
* **Command**: Launch FastAPI with database check triggered on startup.
* **Expected Output**: Console prints validation confirming connection pool initialized.

### TEST-010: Database pgvector Verification
* **Command**: Query database using client: `SELECT extname FROM pg_extension WHERE extname = 'vector';`
* **Expected Output**: Return table row indicating `vector` is active.

### TEST-011: Local CI Simulation
* **Command**: Execute frontend build and backend tests sequentially.
* **Expected Output**: All validation checks succeed.

---

## Definition of Done

SPEC-001 is complete when:
1. The Next.js app starts.
2. The FastAPI app starts.
3. PostgreSQL is running in a local Docker container.
4. The `pgvector` extension is active in the database.
5. The frontend build, lint, and type checking workflows succeed.
6. The backend tests and lint checks pass.
7. The health endpoint validates the database connection status.
8. The `/.env.example` file outlines all configuration properties.
9. A basic GitHub Actions CI config file exists.
10. No CareFin business logic or database schemas have been written yet.

---

## Files Expected To Be Created

### Root Configuration
* `/.env.example`
* `/docker-compose.yml`
* `/.github/workflows/ci.yml`

### Frontend Package
* `/frontend/package.json`
* `/frontend/tsconfig.json`
* `/frontend/tailwind.config.js`
* `/frontend/postcss.config.js`
* `/frontend/next.config.js`
* `/frontend/app/layout.tsx`
* `/frontend/app/page.tsx`
* `/frontend/app/globals.css`

### Backend Package
* `/backend/requirements.txt`
* `/backend/app/main.py`
* `/backend/app/core/config.py`
* `/backend/app/core/database.py`
* `/backend/app/api/endpoints/health.py`
* `/backend/app/api/router.py`
* `/backend/tests/conftest.py`
* `/backend/tests/test_health.py`
* `/backend/alembic.ini`

---

## Files Expected To Be Modified
* None. (New scaffolding setup only).

---

## Dependencies
* Node.js v18 or v20.
* Python v3.10 or v3.11.
* Docker Desktop installed locally.

---

## Open Questions

1. **Docker Compose database image**:
   Are we allowed to use the community standard `pgvector/pgvector:pg15` database image in the `docker-compose.yml`, or must we use a standard `postgres:15` image and build custom pgvector compilation steps inside a Dockerfile? (We suggest using `pgvector/pgvector:pg15` directly to keep configurations simple).
