# CareFin — Software Requirements Specification (SRS)

## 1. System Requirements Framework

This specification defines the functional requirements (FR) and acceptance criteria (AC) for the CareFin application modules. All implementations must adhere strictly to these IDs.

---

## 2. Core Functional Requirements

### FR-001 — Insurance Policy Upload and Processing
* **Description**: The system shall allow users to upload insurance policy documents (PDF, JPG, PNG) and securely extract details via OCR and RAG.
* **Inputs**:
  * File stream (Supported formats: `.pdf`, `.jpg`, `.png`; Max size: 10MB)
* **Outputs**:
  * Policy Extraction Record containing: Insurer, policy name, policy start/end date, basic sum insured, deductibles, co-payment rates, room rent limits, and list of critical exclusions.
* **System Behaviour**:
  1. The API validates the file type and file size.
  2. The document is uploaded to secure cloud storage (or local storage for development).
  3. Text is extracted via OCR (for images) or PDF extraction libraries.
  4. RAG engine parses extracted text to extract specific policy terms.
* **Acceptance Criteria**:
  * **AC-001**: Invalid formats (e.g., `.docx`, `.zip`) are rejected with clear error messages.
  * **AC-002**: AI-extracted results include citations referencing specific pages/sections of the uploaded document.
  * **AC-003**: Extracted fields must contain a confidence score; low confidence fields must require manual user review.
* **Security & AI Considerations**:
  * Documents must be encrypted at rest and in transit.
  * AI must refrain from guessing values; it must output `Requires confirmation` if details are missing.

---

### FR-002 — Out-of-Pocket (OOP) Calculator Engine
* **Description**: The system shall compute the estimated out-of-pocket costs for a procedure using deterministic logic.
* **Inputs**:
  * Base procedure package cost (numeric)
  * Selected insurance policy profile (sum insured, deductible, co-payment %, sub-limits, room rent cap, non-medical list limits)
  * Treatment details (hospital room category selected, procedure code, network status)
* **Outputs**:
  * Out-of-pocket cost breakdown table:
    * Total estimated bill
    * Room rent exceeding charges (if any)
    * Non-payable items (consumables)
    * Applicable deductible amount
    * Co-payment amount
    * Final insurance payout
    * Net patient share (estimated OOP)
* **System Behaviour**:
  * Calculate excess room rent charges: `excess_room = max(0, room_rent_rate - policy_room_limit) * days`.
  * Deduct non-payable items.
  * Apply policy sub-limits for the selected procedure: `capped_payable = min(payable_charges, policy_procedure_limit)`.
  * Apply deductible: `after_deductible = max(0, capped_payable - remaining_deductible)`.
  * Apply co-payment percentage: `co_payment = after_deductible * co_pay_percent`.
  * Calculate insurance share: `insurance_share = after_deductible - co_payment`.
  * Calculate patient share: `patient_share = total_cost - insurance_share`.
* **Acceptance Criteria**:
  * **AC-001**: Math is 100% deterministic (no LLM generation of numerical results).
  * **AC-002**: Handles boundaries (e.g., zero package cost, co-pay of 0%, deductible greater than cost).
  * **AC-003**: Correctly updates remaining deductible balance for active users.

---

### FR-003 — Hospital Network and Cashless Finder
* **Description**: Users shall search for hospitals and filter results by active network coverage, city, specialties, and cashless status.
* **Inputs**:
  * Search terms (hospital name, specialty)
  * City selection
  * Active insurer selection
  * Cashless facility (boolean)
  * 24x7 Emergency status (boolean)
* **Outputs**:
  * List of matching hospital cards indicating: Hospital Name, Address, Contact, Specialties, Network Status (Cashless / Reimbursement / Non-Network for the selected insurer), and Source/Verification date.
* **System Behaviour**:
  1. The system queries the centralized hospital database.
  2. Filters are combined using AND logic (e.g., City AND Insurer AND Cashless).
  3. Returns empty state if no hospital matches all filters.
* **Acceptance Criteria**:
  * **AC-001**: Insurer filtering must actually match the shared hospital-insurer relationships table (no visual-only dropdowns).
  * **AC-002**: Data labels must indicate `dataType: "verified"` or `dataType: "demo"`.

---

### FR-004 — Crowdfunding Fee & Net Payout Calculator
* **Description**: Provide transparency on medical fundraising platforms, estimating platform fees, processing fees, and final payouts.
* **Inputs**:
  * Target fundraising amount (numeric)
  * Crowdfunding platform choice (Ketto, Milaap, ImpactGuru, Custom)
* **Outputs**:
  * Fee Breakdown:
    * Platform commission fee (amount & %)
    * Payment gateway processing fee (amount & %)
    * Net amount disbursed to user
* **System Behaviour**:
  * Compute platform fees and gateway fees based on current platform rate matrices.
  * Return detailed breakdown table.
* **Acceptance Criteria**:
  * **AC-001**: Calculation is deterministic.
  * **AC-002**: Standardizes gateway fees (typically 2-3% in India) and clearly states taxes (GST) if applicable.

---

### FR-005 — Government Assistance Matcher
* **Description**: Matches users to government medical schemes based on demographic and eligibility criteria.
* **Inputs**:
  * State, annual family income, socio-demographic criteria (e.g., Ration card type, BPL status)
* **Outputs**:
  * List of matched schemes (e.g. PM-JAY, State Scheme) with details on eligibility, coverage benefits, required documents, and application link.
* **Acceptance Criteria**:
  * **AC-001**: Displays clear disclaimer that results do not guarantee government approval.

---

### FR-006 — Fraud & Scam Detection Engine
* **Description**: Evaluates text messages, invoice claims, and website links for potential medical fraud.
* **Inputs**:
  * Invoice image (PDF/JPG) or suspicious URL / SMS message
* **Outputs**:
  * Risk Score (High, Medium, Low)
  * Warning Flags list (e.g., "Inflated charges compared to standard rate", "Unverified TPA contact details", "Suspicious crowdfunding URL")
  * Verification advice checklist.
* **System Behaviour**:
  1. For invoices: Performs OCR and cross-references procedure line-item costs against average regional standard costs in the centralized dataset.
  2. For URLs/SMS: Scans against known phishing directories and pattern signatures (using NLP).
* **Acceptance Criteria**:
  * **AC-001**: Avoids definitive legal accusations ("This is a scam"). Uses responsible language ("Potential anomalies detected", "Independently verify details").
