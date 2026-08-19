# AI Skill: RAG (Retrieval-Augmented Generation) Design

This guide defines the design parameters for policy indexing and retrieval systems.

---

## 1. Document Chunking Strategy

* **Format**: Policy booklets are typically long and structured. Keep chunks small enough to fit within context limits but large enough to preserve logical context.
* **Chunking Method**: Use recursive character splitting with a target chunk size of 1000 characters and a 200-character overlap.
* **Header Preservation**: Include parent headings or section contexts in each chunk's metadata to prevent isolated paragraphs from losing meaning (e.g. *Section III - Exclusions*).

---

## 2. Embeddings & Storage

* **Vector Engine**: Use PostgreSQL `pgvector` with standard cosine distance metrics.
* **Metadata Fields**: Embed chunks with matching database properties:
  ```json
  {
    "policy_id": 10,
    "section_title": "Exclusions",
    "page_number": 12,
    "last_updated": "2026-08-19"
  }
  ```
* **Filter Before Query**: Always filter vector queries by the specific `policy_id` or `user_id` context first, rather than querying the entire table.

---

## 3. Grounding & Hallucination Prevention

To ensure responses are factual, use strict context boundaries in LLM prompts.

### LLM Prompt System Template:
```text
You are an expert insurance policy analyzer. You must answer the user's question using ONLY the provided text chunks.
If the answer cannot be found in the provided text chunks, state: "Information not found in the policy document — verify with insurer."
Do not use any external knowledge or make assumptions.
For every claim or limit you output, cite the page number and exact quote from the source text.
```

---

## 4. Source Attribution

* Responses must contain citations. A citation object must include:
  * `page_number`: Sourced page.
  * `source_text`: The exact sentence/clause matching the query.
* The frontend must render these citations as clickable nodes beneath the AI summary block.
