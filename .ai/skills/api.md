# AI Skill: REST API Design

This guide defines standard behaviors for HTTP/JSON API endpoints.

---

## 1. REST Architecture Conventions

* **URL Patterns**: Use plural nouns for resource paths and kebab-case naming:
  * Good: `/api/insurance/policies`
  * Bad: `/api/insurance/get_policy_details`
* **HTTP Verbs**:
  * `GET`: Read lists or detail views. Must be safe and idempotent (no state mutations).
  * `POST`: Create new resources or execute action operations (e.g. `calculate-oop`).
  * `PUT`: Complete update of an existing resource.
  * `PATCH`: Partial updates (e.g. changing claim status).
  * `DELETE`: Deleting resources.

---

## 2. Response Wrapping & Paging

* **Consistency**: All successful responses return a direct JSON representation or a named wrapper.
* **Pagination**: Lists that scale (e.g. hospital search, claims records) must support pagination parameters:
  * Query parameters: `page` (default 1) and `limit` (default 20).
  * Envelope structure:
    ```json
    {
      "items": [],
      "total_count": 140,
      "page": 1,
      "limit": 20,
      "total_pages": 7
    }
    ```

---

## 3. OpenAPI Documentation

* Every FastAPI router path must include a clear docstring describing its function, required parameters, and response models. Pydantic fields must define `description` properties to ensure the auto-generated Swagger API documentation (`/docs`) remains clean and self-explanatory.
* Document common error responses (e.g., 400, 401, 404) explicitly using the `responses` parameter in route decorators.
