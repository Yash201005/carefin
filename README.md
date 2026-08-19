# CareFin

CareFin is an AI-powered healthcare insurance and medical financial guidance platform tailored primarily for the Indian healthcare context. Designed to act as a calm, well-organized healthcare financial advisor, CareFin assists users in understanding complicated policy terms, calculating out-of-pocket expenses, identifying network hospitals, checking cashless treatment eligibility, and planning medical funding options.

---

## 1. Project Philosophy

CareFin prioritizes trust, calmness, readability, and transparency:
* **Clarity & Calmness**: Healthcare decisions are stressful; the UI features a clean, professional aesthetic without neon elements, intense animations, or robot illustrations.
* **Deterministic Calculations**: Out-of-pocket costs, claim sub-limits, platform fees, and tax calculations are handled by a strict calculation engine. LLMs are never used for direct mathematical calculations, but rather to explain results.
* **Traceable and Grounded AI**: AI interpretations cite insurance policy clauses, hospital records, and government website sources.
* **Accurate Data Separation**: Features clearly distinguish between verified data (sourced from insurance companies or official platforms) and demo data (clearly marked as `dataType: "demo"`).

---

## 2. Technology Stack

* **Frontend**: React (built with Vite), TypeScript, and Vanilla CSS.
* **Backend**: Python (built with FastAPI) for domain logic, claim explanation APIs, document extraction (OCR), and Retrieval-Augmented Generation (RAG).
* **Database**: PostgreSQL with `pgvector` extension for structured relational and vector embedding data.
* **Authentication**: JWT-based authentication with role-based access controls.
* **AI/LLM**: Structured LLM responses, RAG retrieval using embedded policy files, and PDF extraction tools.

---

## 3. Directory Structure

```text
carefin/
├── .ai/                     # Reusable AI instructions and developer context
│   ├── context.md           # High-level developer guidelines
│   └── skills/              # Domain-specific skill guidelines (frontend, database, etc.)
├── specs/                   # Feature specifications (SPEC-001, SPEC-002, etc.)
├── frontend/                # React (Vite) application
│   ├── src/
│   │   ├── assets/          # Static assets (images, logos)
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context files for shared state
│   │   ├── pages/           # Pages (Dashboard, My Insurance, Claims, etc.)
│   │   ├── services/        # API integration client services
│   │   ├── styles/          # Design token CSS variables and core styling
│   │   ├── types/           # Shared TypeScript interfaces
│   │   └── utils/           # Utility helpers
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/             # API routes and router definitions
│   │   ├── core/            # Config, security, database sessions
│   │   ├── models/          # Relational database models (SQLAlchemy)
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   ├── services/        # Business logic services (RAG, calculation engine, OCR)
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Backend tests
│   ├── Dockerfile
│   └── requirements.txt
├── data/                    # Centralized datasets
│   ├── raw/                 # Unprocessed sources (e.g. policy PDFs)
│   └── demo/                # Shared demo JSON files (hospitals, insurance, procedures)
├── README.md
├── PRD.md
├── SRS.md
├── architecture.md
├── data-model.md
├── api-spec.md
├── security.md
├── design-tokens.md
└── todos.md
```

---

## 4. Getting Started

Detailed running instructions will be added as backend and frontend packages are initialized during Phase 1.
To set up local development, clone the repository and run:
* **Frontend**: `cd frontend && npm install && npm run dev`
* **Backend**: `cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && uvicorn app.main:app --reload`
