# SPEC-001: Project Setup and Codebase Initialization

## Feature
CareFin Engineering Foundation and Package Setup

## Objective
Establish the directory structures, configuration templates, and basic container configuration needed for the local development of CareFin.

---

## Scope
1. Define and construct the directory structures (`/frontend`, `/backend`, `/data`).
2. Initialize React (Vite) with TypeScript in `/frontend`.
3. Initialize FastAPI with boilerplate configuration in `/backend`.
4. Configure local PostgreSQL and pgvector using Docker Compose.
5. Establish package execution commands and local verification tests.

---

## User Story
As an engineer working on CareFin, I want a clean, standardized, and immediately runnable development environment with decoupled frontend, backend, and database configurations.

---

## Functional Requirements
* **FR-001.1**: The project structure must isolate frontend build systems from python service packages.
* **FR-001.2**: Running `docker compose up` must initialize a PostgreSQL instance preloaded with the `pgvector` extension.
* **FR-001.3**: Package configuration files must support direct, containerized connection mapping.

---

## Technical Requirements
* **Frontend**: React 18, Vite, TypeScript, NPM package manager.
* **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy ORM, Alembic migrations.
* **Database**: PostgreSQL 15 (or higher) + pgvector.
* **Containerization**: Docker and Docker Compose.

---

## Data Requirements
* Centralized shared datasets must be located in `/data/demo/` or `/data/raw/` in the root workspace.

---

## UI Requirements
* The frontend scaffolding must contain a placeholder index page loaded with `design-tokens.css` values to verify color integration.

---

## API Requirements
* The FastAPI server must expose a healthcheck endpoint (`/api/health`) returning application statuses.

---

## AI Requirements
* None (Engineering framework setup only).

---

## Security Requirements
* Ensure local database credentials are read from `.env` template files.
* Secrets must not be committed to Git.

---

## Error Handling
* Database connection failure: If the database is unreachable, the backend API healthcheck must return `503 Service Unavailable`.

---

## Acceptance Criteria
* **AC-001**: Running `npm run dev` in `/frontend` launches the React development server.
* **AC-002**: Launching Uvicorn in `/backend` starts the API server and compiles health endpoints without error.
* **AC-003**: A Docker container runs PostgreSQL with `pgvector` extension active.

---

## Test Cases
1. **Frontend Boot**: Run package installations and execute build checks to ensure TypeScript compiles.
2. **Backend Boot**: Verify the `/api/health` endpoint returns `{"status": "ok"}` when the DB is connected.
3. **Database Check**: Run `CREATE EXTENSION vector;` query on PostgreSQL to confirm the pgvector library compiles.

---

## Out of Scope
* Implementing actual page routers, RAG indexing files, cost calculation engines, or user login views.
* CI/CD deployment workflows.

---

## Dependencies
* Local Docker installation.
* Node.js (v18+) and Python (v3.10+) installed locally.
