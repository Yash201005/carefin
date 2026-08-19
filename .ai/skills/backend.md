# AI Skill: Backend Development (FastAPI + Python)

This guide defines coding standards for backend services.

---

## 1. Directory & Layer Organization

Separate concerns logically:
1. **API Router Layer (`app/api/`)**: Defines HTTP path mappings, parameters, and parses authentication headers.
2. **Schema Validation (`app/schemas/`)**: Pydantic input models (e.g. `UserLoginRequest`) and response envelopes.
3. **Business Services Layer (`app/services/`)**: Independent logic functions (e.g. calculations, PDF reading, database retrieval). This layer does not interact directly with raw HTTP requests.
4. **Database Operations (`app/models/`)**: SQLAlchemy models, migrations, and repository queries.

---

## 2. Strong Input Validation

* Use Pydantic's field constraints (e.g., `Field(gt=0)` for financial amounts, strict regex for policy numbers and email entries).
* Always reject undefined keys to prevent mass-assignment vulnerabilities.

---

## 3. Standardized Error Handlers

Never return raw Python stack traces. Implement global FastAPI exception handlers returning a uniform structure:
```python
class CareFinException(Exception):
    def __init__(self, error_code: str, message: str, status_code: int = 400):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
```
Ensure all database failures (e.g. unique constraints violations) are caught and formatted as user-friendly API errors.

---

## 4. Structured Logging

* Log critical events (OCR completions, calculation inputs, DB updates) using standard Python `logging`.
* Do not log passwords, full credit card details, or unmasked Aadhaar numbers.
* Use structured logging format: `%(asctime)s - %(levelname)s - [%(module)s] - %(message)s`.
