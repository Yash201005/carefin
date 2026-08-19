# CareFin Project Roadmap & Specifications Checklist

This checklist tracks the implementation status of CareFin features based on the approved project roadmap.

---

## Phase 0 — Engineering Foundation
- [~] SPEC-001: Project Setup — implementation complete; live PostgreSQL/pgvector verification blocked by missing Docker
- [~] SPEC-002: Insurance Policy Analyzer & OOP Calculator — implementation complete; live database verification blocked by missing Docker
- [x] SPEC-003: Application Shell — Navigation sidebar, layout structure, responsive container.
- [x] **SPEC-004: Claims & Procedure Guidance** — Procedure guidelines, document checklists, cashless flows, and policy citations.
- [ ] **SPEC-005: Database Foundation** — PostgreSQL setup, pgvector connection.
- [ ] **SPEC-006: API Foundation** — FastAPI routing, middleware, global error handlers.
- [ ] **SPEC-007: Authentication** — JWT validation, sign-in/sign-up API and views.
- [ ] **SPEC-008: CI/CD** — Testing workflow actions, lint checks.

---

## Phase 1 — Insurance Policy Analyzer
- [ ] **SPEC-008: Insurance Data Model** — Insurance database tables, schemas.
- [ ] **SPEC-009: Insurance Management** — Active policies catalog, metadata displays.
- [ ] **SPEC-010: Document Storage** — Secured file upload and bucket configuration.
- [ ] **SPEC-011: Policy Upload** — UI upload file drag-and-drop.
- [ ] **SPEC-012: OCR & Document Extraction** — Extraction services for policy sheets.
- [ ] **SPEC-013: Policy RAG** — Embeddings processing, cosine similarity lookup.
- [ ] **SPEC-014: Policy Analyzer** — Summarized terms layout, exclusions panel.

---

## Phase 2 — Healthcare Costs
- [ ] **SPEC-015: Procedure Data** — Central procedure indexes, search indexes.
- [ ] **SPEC-016: Hospital Data** — Shared hospital metrics repository.
- [ ] **SPEC-017: Healthcare Cost Search** — Procedure query search bars.
- [ ] **SPEC-018: OOP Calculation Engine** — Deterministic policy matching calculations.
- [ ] **SPEC-019: Cost Comparison** — Comparison layouts across hospital systems.

---

## Phase 3 — Hospitals network Finder
- [ ] **SPEC-020: Centralized Relationships** — Centralized hospital/insurance networks linking.
- [ ] **SPEC-021: Hospital Search** — Multi-category filter search views.
- [ ] **SPEC-022: Insurance Network Filtering** — Strict AND logic filter.
- [ ] **SPEC-023: Specialty Filtering** — Multi-select specialty chips.
- [ ] **SPEC-024: Hospital Detail Panel** — Amenities, contacts, network insurances.
- [ ] **SPEC-025: Hospital Comparison** — Parallel comparison views.
- [ ] **SPEC-026: Healthcare Costs Integration** — Navigating from hospital profiles directly to cost estimates.

---

## Phase 4 — Claims Guidance
- [ ] **SPEC-027: Claims Data** — Claims status data structures.
- [ ] **SPEC-028: Claim Management** — File claims workflows.
- [ ] **SPEC-029: Claim Timeline** — Progress step trackers.
- [ ] **SPEC-030: Claim Explanation** — Explaining settlement deductions via RAG.

---

## Phase 5 — Insurance Advisor
- [ ] **SPEC-031: Recommendation Engine** — Demographic/budget plan calculations.
- [ ] **SPEC-032: Policy Comparison** — Parallel coverage parameters checks.
- [ ] **SPEC-033: Recommendation Explanation** — Natural language suggestions.
- [ ] **SPEC-034: Risk & Exclusion Comparison** — Risk mapping.

---

## Phase 6 — Medical Funding
- [ ] **SPEC-035: Funding Gap Calculator** — Shortfall assessments.
- [ ] **SPEC-036: Funding Sources** — NGO/crowdfunding databases.
- [ ] **SPEC-037: Funding Verification** — Verification timelines.
- [ ] **SPEC-038: Crowdfunding Fee Calculator** — Fee disbursement calculations.
- [ ] **SPEC-039: Funding Comparison** — Interest rates and terms panels.
- [ ] **SPEC-040: Fundraiser Document Readiness** — Doc verification lists.
- [ ] **SPEC-041: Fundraising Assistant** — AI assistant for campaign text drafting.

---

## Phase 7 — Fraud & Safety
- [ ] **SPEC-042: Message Analysis** — Phishing link detection.
- [ ] **SPEC-043: Document Analysis** — Invoice double billing detection.
- [ ] **SPEC-044: Website/Contact Assessment** — Scam warning lists.
- [ ] **SPEC-045: Verification Workflow** — User escalations.

---

## Phase 8 — Government Assistance
- [ ] **SPEC-046: Government Scheme Database** — Government welfare entries.
- [ ] **SPEC-047: Eligibility Matching** — Income/caste eligibility rules.
- [ ] **SPEC-048: Scheme Explanation** — Simplified scheme explainers.
- [ ] **SPEC-049: Required-Document Guidance** — Application guidance.

---

## Phase 9 — Emergency Assistance
- [ ] **SPEC-050: Emergency Workflow** — Rapid response guides.
- [ ] **SPEC-051: Insurance Contact Directory** — Emergency helpline lookups.
- [ ] **SPEC-052: Cashless Pre-authorization Guidance** — Rapid pre-auth checklists.
- [ ] **SPEC-053: Financial Exposure** — Emergency deposit calculations.
- [ ] **SPEC-054: Funding Options** — Rapid loans directories.

---

## Phase 10 — Integration, Hardening, and Deployment
- [ ] **SPEC-055: Dashboard Integration** — Consolidating metrics feeds.
- [ ] **SPEC-056: Global Document Search** — Unified keyword indices.
- [ ] **SPEC-057: Source/Verification System** — Verification tracking badges.
- [ ] **SPEC-058: Accessibility** — WAI-ARIA and contrast validations.
- [ ] **SPEC-059: Security Hardening** — CORS policies, rate limiting.
- [ ] **SPEC-060: AI Evaluation** — RAG recall and hallucination benchmark checks.
- [ ] **SPEC-061: Performance** — Query caching, page load assets bundles.
- [ ] **SPEC-062: Production Deployment** — Docker builds, database migrations.
