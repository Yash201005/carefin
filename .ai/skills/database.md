# AI Skill: Database Design (PostgreSQL + pgvector)

This guide defines rules for schema design, migrations, and query execution.

---

## 1. Centralized Data Rule

* Under no circumstances duplicate records across different files.
* Every query regarding cashless availability or regional procedure costs must reference the same underlying relation (`hospital_insurer_network` or `healthcare_costs`).

---

## 2. Relationships & Constraints

* **Foreign Keys**: Always declare strict foreign key relationships (`REFERENCES`). Ensure cascaded deletes are restricted if deleting an entity leaves dangling history (e.g. restrict delete on Cities if Hospitals exist).
* **Checks & Validations**: Implement database-level check constraints (e.g. `rating CHECK (rating >= 1.0 AND rating <= 5.0)`).
* **Unique Constraints**: Prevent duplicate records for composite entities (e.g., uniqueness constraints on `(hospital_id, insurer_id)` combinations).

---

## 3. Indexing & Optimization

* **B-Tree Indexes**: Build indexes for foreign keys frequently checked during joins (e.g., `insurer_id` and `hospital_id`).
* **Vector Indexing**: Use HNSW (Hierarchical Navigable Small World) index for embedding searches:
  ```sql
  CREATE INDEX idx_doc_embeddings_cosine ON document_embeddings USING hnsw (embedding vector_cosine_ops);
  ```
* Avoid IVFFlat indexes on production data unless embedding updates are highly static and memory bounds require it.

---

## 4. Migrations

* All database changes must be managed using Alembic migrations in Python.
* Never run raw ALTER TABLE statements on the database outside migration scripts.
