# AI Skill: Security Implementation Standards

This guide specifies secure coding practices for developers working on CareFin.

---

## 1. Input Sanitization & Serialization

* **Parameter Checking**: Use Pydantic schemas in FastAPI to validate data structures and types. Reject payloads containing unexpected parameters.
* **SQL Parameters**: Always use SQLAlchemy ORM queries or parameterized placeholders to prevent SQL Injection:
  ```python
  # Good
  db.query(User).filter(User.email == email)
  # Bad
  db.execute(f"SELECT * FROM users WHERE email = '{email}'")
  ```

---

## 2. Token Security

* **Validation**: Verify JWT signatures on every request. Inspect expiration (`exp` claim) and scope permissions.
* **Storage**: Never write JWT secrets directly to files or source code. Always pull the signing key from environment variables (`os.environ.get("JWT_SECRET")`).

---

## 3. Sensitive Personal Data (DPDP Act, 2023)

In compliance with Indian data protection laws, handle user records with extreme confidentiality:
* **Identification Records**: Redact Aadhaar card, PAN card, or voter ID strings inside backend parser logs before processing files.
* **Financial Information**: Income details, policy specifications, and invoice details must be stored in encrypted database columns or access-protected tables.
* **Logging Limits**: Ensure no diagnostic logging scripts print user email addresses, session tokens, or medical condition profiles to text logs.
