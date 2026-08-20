# CareFin

### Healthcare Insurance & Financial Assistance Platform

> **Understand. Compare. Plan. Secure.**

CareFin is an integrated healthcare-financial platform designed to help users understand insurance policies, navigate claims and procedures, compare healthcare costs, evaluate insurance options, explore financial assistance, and securely manage healthcare documents and calculation history.

## Team

- **H G Yashaswini**
- **Impana S**

---

## Problem

Healthcare financial decisions are often fragmented across insurance documents, hospital information, claims guidance, assistance programs, and personal records.

Users may struggle to:

- Understand complex insurance policies
- Estimate their out-of-pocket expenses
- Compare treatment costs across hospitals
- Find relevant hospital network/cashless information
- Evaluate insurance options against their requirements
- Understand their medical funding gap
- Discover government or charitable assistance
- Keep healthcare documents and calculations organized

## Our Solution

CareFin brings these workflows together into one application:

```text
Insurance Policy
       ↓
Policy Analysis & OOP
       ↓
Claims / Procedure Guidance
       ↓
Hospital Cost Comparison
       ↓
Network / Cashless Finder
       ↓
Insurance Advisor
       ↓
Medical Funding
       ↓
Government Schemes
       ↓
Secure Document Vault
```

---

# Features

## 1. Policy Analyzer & OOP Calculator

- Insurance policy analysis
- Policy information extraction
- Coverage-related calculations
- Deterministic out-of-pocket estimation

## 2. Claims & Procedure Guidance

- Structured claims guidance
- Procedure-related information
- Helps users navigate healthcare-financial workflows

## 3. Hospital Cost Comparison

Users can compare estimated hospital treatment costs using factors such as:

- Procedure
- City
- Specialty
- Cost range
- Hospital

The application is designed to clearly distinguish estimates and reference information from verified information.

## 4. Hospital Network & Cashless Finder

Users can filter hospital information by:

- City
- Insurer
- Specialty
- Procedure
- Network/cashless status

Network and cashless information is presented with appropriate status/reference labels and should be independently verified with the relevant insurer, TPA, or hospital.

## 5. Insurance Advisor

A deterministic, rule-based insurance recommendation engine considers user requirements such as:

- Age
- City
- Family size
- Budget
- Desired sum insured
- Coverage type
- Co-pay preference
- Room-rent preference
- Deductible preference
- Pre-existing condition declaration

Recommendations are categorized based on how well the available criteria match the user's requirements.

> The advisor is not an insurance underwriter and does not guarantee policy eligibility or approval.

## 6. Medical Funding & Crowdfunding Transparency

CareFin calculates:

```text
Total Treatment Cost
        -
Insurance Contribution
        -
Personal Contribution
        -
Confirmed Other Assistance
        =
Funding Gap
```

It can also estimate a gross crowdfunding target from a required net amount by accounting for:

- Platform fees
- Payment-processing fees
- Taxes
- Fixed transaction charges

Financial calculations use Python `Decimal` arithmetic for money-safe deterministic calculations.

No payment processing or crowdfunding campaign submission is implemented.

## 7. Government Schemes

- Structured government assistance information
- Scheme discovery
- Eligibility/reference information
- Source and status metadata

Government scheme information should be independently verified with the relevant official authority.

## 8. Secure Document Vault

SPEC-010 introduces a security and document-management layer including:

- User registration and login
- PBKDF2-HMAC-SHA256 password hashing
- JWT-based sessions
- Authenticated API access
- Ownership-based authorization
- IDOR protection
- Document upload validation
- File-size limits
- Filename/path sanitization
- Magic-byte checks
- Saved calculation history
- Database-backed document and user records

---

# Technical Architecture

```text
┌─────────────────────────────────────────────┐
│              Next.js Frontend               │
│          React + TypeScript                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              FastAPI Backend                │
│                  Pydantic                   │
└──────────────────────┬──────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   Policy &       Hospital &       Security &
   Claims         Insurance        Documents
   Services       Services         Services
        │              │              │
        └──────────────┼──────────────┘
                       ▼
              Funding & Schemes
                  Services
                       │
                       ▼
        ┌────────────────────────────┐
        │ SQLAlchemy + SQLite        │
        │ Alembic Migrations         │
        └────────────────────────────┘
```

## Technology Stack

### Frontend

- Next.js
- React
- TypeScript

### Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy
- Alembic

### Engineering & Security

- Python `Decimal` for deterministic financial calculations
- PBKDF2-HMAC-SHA256 password hashing
- JWT authentication
- Ownership-based authorization
- File validation and upload controls
- Pytest
- Ruff
- ESLint
- TypeScript compiler
- Next.js production build

---

# Project Structure

```text
CareFin/
├── backend/
│   ├── alembic/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── app/
│       └── components/
│
├── PRD.md
├── SRS.md
├── architecture.md
├── api-spec.md
├── security.md
└── README.md
```

---

# Running the Project Locally

## Prerequisites

- Python 3.x
- Node.js
- npm

## Backend

From the repository root:

```powershell
cd backend
```

Create and activate a virtual environment if needed:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Run the API:

```powershell
uvicorn app.main:app --reload
```

The backend runs on the local FastAPI development server.

## Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs using the Next.js development server.

> Development configuration may require environment variables appropriate to the local setup. Never commit real secrets or credentials.

---

# API Areas

The backend exposes API functionality for the major CareFin workflows, including:

```text
/api/auth
/api/documents
/api/calculations
/api/funding
```

alongside the existing policy, claims, hospital, advisor, and government-scheme routes.

---

# Security

Security is a core part of the SPEC-010 implementation.

### Passwords

Passwords are never stored as plaintext. CareFin uses PBKDF2-HMAC-SHA256 with a unique random salt.

### Authentication

Authenticated API requests use JWT-based sessions.

### Authorization

User-owned resources are filtered by the authenticated user's identity to prevent unauthorized access to another user's documents or calculations.

### File Upload Security

Uploads are checked for:

- Size limits
- Allowed extensions
- Filename/path traversal
- Dangerous executable signatures
- File-type inconsistencies

CareFin does not collect Aadhaar numbers, identity-card data, or bank details as part of the document-vault workflow.

---

# Testing & Verification

The implemented project has been verified with:

- **92 pytest tests passed**
- **Ruff checks passed**
- **TypeScript type-check passed**
- **ESLint passed**
- **Next.js production build passed**
- **Git diff checks passed**

Testing covers the backend modules and SPEC-010 security/data-vault behavior, including authentication, authorization, document upload validation, ownership isolation, and saved calculations.

---

# Data & Transparency

CareFin intentionally distinguishes between:

- Calculated values
- Estimates
- Reference information
- Demo data
- Verified information

Hospital pricing, insurer/network information, funding platforms, and assistance information may depend on reference or demonstration datasets.

Users should independently verify important healthcare, insurance, eligibility, network, and financial information with the relevant organization before making real-world decisions.

---

# Current Scope

The current implementation covers **SPEC-001 through SPEC-010**, including:

- Project foundation
- Policy analyzer
- Application shell
- Claims guidance
- Hospital cost comparison
- Hospital network/cashless finder
- Insurance advisor
- Medical funding
- Government schemes
- Security, user data, and document vault

---

# Limitations

CareFin is a project/prototype implementation and should not be treated as a production healthcare, insurance, or financial service.

Current limitations include:

- Some healthcare and insurance information is reference/demo/estimate data.
- Network and cashless status requires independent verification.
- Funding and crowdfunding calculations are estimates.
- The platform does not process payments.
- The platform does not purchase insurance.
- The platform does not provide medical advice.
- The platform does not perform insurance underwriting.
- Production-scale distributed storage and caching would require additional infrastructure.

---

# Future Scope

The following are **future features, not part of the current implemented scope**:

- Real-time healthcare and insurance data integrations
- Expanded government and assistance-program coverage
- Production-grade cloud infrastructure
- Distributed document storage
- Advanced fraud and safety capabilities
- Additional healthcare-financial workflows
- Further CareFin specifications

---

# Project Status

**SPEC-001 → SPEC-010: Implemented and verified**

CareFin currently demonstrates an end-to-end healthcare-financial workflow from insurance understanding and healthcare-cost planning through funding assistance and secure document management.

> **Understand. Compare. Plan. Secure.**

---

## Team

**H G Yashaswini**  
**Impana S**
