# Security Specification and Design

This document details the security principles, data protection regulations, and technical safeguards implemented in CareFin.

---

## 1. Authentication & Authorization

### 1.1 Stateless JWT Authentication
* **Algorithm**: All user sessions are authenticated using JSON Web Tokens (JWT) signed via HMAC-SHA256.
* **Token Lifetime**: Access tokens have an expiration of 24 hours. Refresh tokens are not stored in local storage; they are managed using secure HTTP-only, SameSite=Strict cookies if implemented.
* **Header Format**:
  ```text
  Authorization: Bearer <JWT_TOKEN>
  ```

### 1.2 Access Control
* **User Isolation**: Users are strictly authorized to view only their own profile, active policies, uploaded documents, claims records, and invoice scans.
* **Database Level Constraints**: API queries must check for `user_id = active_user_id` when accessing user-specific tables.

---

## 2. Document & OCR File Security

### 2.1 File Validation Rules
* **Type Validation**: Backend endpoints must validate the magic numbers of files, rather than relying on file extensions alone. Supported types: `application/pdf`, `image/jpeg`, `image/png`.
* **File Size Caps**: The API Gateway/Router must reject payloads exceeding 10MB to mitigate Denial of Service (DoS) risks.
* **Malware Scanning**: In staging/production environments, files must be scanned (e.g. ClamAV or cloud-equivalent buckets) before processing or RAG indexing.

### 2.2 Secure Storage & Access
* **Storage Encryption**: Uploaded policy documents and claims files must be encrypted at rest using AES-256.
* **Temporary Expirations**: File access links must generate signed, short-lived URLs (expiring in less than 15 minutes) for frontend downloads.

---

## 3. Data Sanitization & Protection

### 3.1 Input Validation
* **Strict Schemas**: FastAPI routes must define rigorous Pydantic schemas. Unrecognized parameters must be dropped automatically.
* **SQL Injection Prevention**: All database queries must run through the SQLAlchemy ORM or parametrized queries. Dynamic string formatting within SQL strings is strictly prohibited.
* **XSS Defenses**: React automatically escapes variables in JSX. For any user-generated markdown rendering, the application must use `DOMPurify` to clean the HTML output before mounting.

### 3.2 Sensitive Personal Data (SPDI)
* **Indian Context**: Medical bills, policy numbers, and annual family incomes are treated as Sensitive Personal Data under the Digital Personal Data Protection (DPDP) Act, 2023.
* **Data Masking**:
  * Policy numbers shown in the UI are masked (e.g., `POL******890`).
  * Aadhaar or government IDs uploaded for crowdfunding readiness must be scanned, and matching OCR text must be redacted before printing to log files or standard database fields.

---

## 4. Secret & Dependency Management

### 4.1 Secret Isolation
* Secrets (such as database credentials, JWT keys, and OpenAI API tokens) must never be committed to git repositories.
* Use a local `.env` file (ignored by `.gitignore`) for local development, and environment variables on cloud hosts.

### 4.2 Automated Dependency Scans
* Use GitHub dependabot or npm audit/pip audit to check dependency trees for vulnerabilities weekly.
