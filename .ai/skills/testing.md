# AI Skill: Automated Testing Standards

This guide outlines rules for unit, integration, and specialized AI testing in CareFin.

---

## 1. Financial Calculation Engine Testing

All deterministic engines (out-of-pocket, crowdfunding fees, deductibles) must be unit tested with 100% test coverage using Pytest.

Test cases must cover:
* **Normal Cases**: Typical treatment values.
* **Zero Values**: No deductibles, 0% co-pay, zero total package cost.
* **Boundary Conditions**: Limits exactly equal to procedure costs, or limits exceeded by large margins.
* **Invalid Inputs**: Negative amounts, letters inside numeric fields (handled by schema checks first).
* **Accumulated State**: Checking remaining deductible values over consecutive operations.

---

## 2. API & Integration Testing

* Use FastAPI's `TestClient` to mock API responses and verify integration flows (e.g. creating a policy and immediately running a cost calculation against it).
* Mock database queries during unit tests to isolate service functionality.
* Run integration tests using a dedicated testing database, running migrations and dropping data after teardowns.

---

## 3. RAG & Grounding Validation

AI-driven policy search and analysis require functional regression checks:
* **Retrieval Evaluation**: Verify the RAG pipeline returns the correct chunk list for common search keywords (e.g., "waiting period", "maternity limit").
* **Citation Accuracy**: Test that the extracted text matches pages in the original document.
* **Hallucination Resistance**: Feed empty context files to the explanation endpoint and verify it outputs the fallback refusal string: *"Information not found in the policy document — verify with insurer."*

---

## 4. Frontend Component Testing

* Use **Vitest** + **React Testing Library** for React unit and integration tests.
* Ensure filters trigger the appropriate query state changes.
* Verify cashless indicators and demo indicators render visible indicators for users.
