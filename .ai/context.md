# CareFin AI Development Context

This file serves as the primary instructions file for AI engineering systems working on CareFin. Always read this file before implementing new features or components.

---

## 1. Core Platform Summary

CareFin is a healthcare insurance and financial guide designed for the Indian market. It provides clarity, trust, and calm insights during stressful medical emergencies. It consists of a React SPA (built with Vite) and a FastAPI backend with PostgreSQL + pgvector.

---

## 2. Core Rules for AI Code Generation

When writing or modifying files, you must strictly adhere to the following rules:

### A. Keep Math Deterministic
* **Never let the LLM calculate fees, out-of-pocket costs, platform deductions, co-payments, or deductibles.**
* Computations must be coded using standard Python/JavaScript math libraries.
* The LLM's role is exclusively to read mathematical output and write a conversational, user-friendly explanation citing relevant sources.

### B. Track Data Trust (`dataType`)
* Always verify where data comes from.
* If verified external data is missing, tag data elements with:
  ```json
  "data_type": "demo"
  ```
* Clear UI labels must indicate when demo data is used: *"Demo data — verify with hospital and insurer."*
* When data is authenticated:
  ```json
  "data_type": "verified",
  "source": "Name of Insurer Directory / Official Portal",
  "last_verified_at": "ISO-TIMESTAMP"
  ```

### C. Visual Quietness (No Neon / No Sparks)
* Use the global Design Tokens (`design-tokens.css`).
* Do not introduce bright colors, robot widgets, sparkling shapes, animations exceeding 150ms, or rounded styles exceeding `6px` radius.
* Avoid gamified icons or rating sparkles.

### D. Centralized Data Sources
* Never duplicate datasets for different views. Use the shared database schema or data modules for hospital networks, procedures, cities, and coverage parameters.

---

## 3. Directory Layout Guidelines
* Frontend code goes to `/frontend`.
* Backend service logic goes to `/backend/app`.
* Shared static mock/demo sets go to `/data/demo/`.
* Specifications are located in `/specs/`.
