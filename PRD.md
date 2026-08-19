# CareFin — Product Requirements Document (PRD)

## 1. Problem Statement & Context
Navigating the healthcare financial landscape in India is highly complex and stressful. Patients and their families face:
* **Opacity in Hospital Costs**: Lack of standardized, searchable pricing for medical procedures.
* **Complex Insurance Policies**: Convoluted policy terms, hidden sub-limits, deductibles, co-payments, and exclusions.
* **Complex Claim Approvals**: High rejection rates and delays due to incorrect documentation and lack of pre-authorization guidance.
* **Funding Gaps**: Cash flow shortfalls where insurance does not cover the complete treatment cost, forcing families into sudden debt.
* **Lack of Centralized, Trustworthy Information**: Fragmented listings of network hospitals, government health schemes (e.g., Ayushman Bharat), and NGO resources.
* **Fraud and Scams**: Crowdfunding scams, fake NGO requests, and suspicious hospital invoices.

---

## 2. Target Users
* **Primary Caregivers**: Family members responsible for finding hospitals, managing bills, filing claims, and securing funding.
* **Policyholders**: Individuals seeking to understand their coverage limits, deductibles, and pre-existing condition exclusions before treatment.
* **Patients facing High out-of-pocket Costs**: Individuals seeking supplementary financial support through crowdfunding or government schemes.

---

## 3. Product Purpose & Value Proposition
CareFin is a calm, trustworthy, and clear healthcare financial advisor. It empowers Indian families to:
1. **Analyze Policy Coverage**: Upload and dissect policy documents using AI.
2. **Search and Compare Costs**: Compare procedure costs and hospital networks in their city.
3. **Calculate Out-of-Pocket Expenses**: Receive deterministic calculations of financial exposure.
4. **Coordinate Claims & Emergency Care**: Access pre-authorization guidelines and emergency contact details.
5. **Secure Medical Funding**: Identify crowdfunding options, estimate platform fees, and verify government scheme eligibility.
6. **Detect Scams & Fraud**: Verify invoices, crowdfunding campaigns, and charity requests.

---

## 4. Product Principles & Visual Guidelines

To build trust during stressful medical scenarios, CareFin strictly adheres to these rules:
1. **No Artificial Hype**: Avoid neon accents, glowing outlines, robot avatars, AI sparkles, and animated backgrounds.
2. **Clear Aesthetics**: Clean, professional layout using designated muted tones (#F7F8F7 Background, #FFFFFF Surface, #356B7A Primary Accent, #6E9B84 Secondary Accent).
3. **Deterministic Math**: AI must never guess financial calculations (e.g., co-pays, sub-limits, deductibles). Calculation engines must run on deterministic rules, with AI only providing narrative explanations.
4. **Source Transparency**: Every claim or recommendation must cite its sources (e.g., policy document page, official hospital network list, government scheme website).
5. **Responsible Guardrails**: AI never guarantees coverage, fundraising success, or claim approval. Language is cautious, advisory, and grounded in verification.

---

## 5. Major Product Modules

### 5.1 Dashboard
* Consolidated overview of the user's active insurance policies, active claims, pending documents, and quick links to emergency assistance.
* Financial summary of recent out-of-pocket estimations.

### 5.2 My Insurance (Insurance Policy Analyzer)
* **Policy Upload**: Secure document upload for policy terms (PDF/Image).
* **AI Analyzer**: Grounded RAG system extracting deductibles, co-payments, waiting periods, room rent caps, sub-limits, and exclusions.
* **Policy Summary**: Clear, structured table of what is covered and what is not.

### 5.3 Claims (Claim & Procedure Guidance)
* **Claim Tracking**: Pipeline/timeline of current claim statuses.
* **Pre-authorization Checklist**: Step-by-step guidance on documents required before procedure.
* **Claim Explanation**: AI explanations of insurer letters, claim rejections, and settlement deductions.

### 5.4 Healthcare Costs (Out-of-Pocket Calculator & Comparison)
* **Procedure Search**: Cost distributions across various procedure categories (e.g., Angioplasty, Cataract).
* **Centralized Data Engine**: Aggregated cost information by procedure and city.
* **Out-of-Pocket Calculator**: Deterministic engine deducting policy-specific rules from total hospital package costs.

### 5.5 Hospitals (Hospital & Network Finder)
* **Network Filtering**: Search for hospitals based on active insurance network status, city, specialties, and cashless facility availability.
* **Centralized Core**: Shared database with `Healthcare Costs` module ensuring identical network lists.
* **Comparison Dashboard**: Sideline comparison of hospital amenities, specialties, network insurers, and average costs.

### 5.6 Insurance Advisor
* **Recommendation Engine**: Suggests suitable insurance plans based on user health profiles, family demographics, and budget.
* **Policy Comparison**: Direct comparison of sub-limits, exclusions, and waiting periods side-by-side.

### 5.7 Medical Funding & Crowdfunding
* **Funding Gap Calculator**: Evaluates funding deficit between estimated cost and insurance limit.
* **Platform Fee Calculator**: Transparent breakdown of platform fees, payment processing fees, and net payouts for major Indian crowdfunding platforms.
* **Fundraising Assistant**: AI checklist assessing readiness of document uploads (e.g. Aadhaar, estimate letters, medical certificates).

### 5.8 Emergency Assistance
* **Cashless Guideline**: Step-by-step emergency checklist.
* **Quick Access**: TPA (Third Party Administrator) contacts and emergency numbers.
* **Exposure Calculator**: Rapid calculation of expected upfront deposits.

### 5.9 Fraud & Safety
* **Invoice Verification**: AI and rules-based scanning of medical invoices to detect double billing or inflated charges.
* **Scam Verification**: Message/link analysis to evaluate crowdfunding campaign legitimacy.

### 5.10 Documents
* Secured storage for health records, policy documents, claim forms, and government ID cards.

### 5.11 Government Schemes
* Matching engine against schemes like Ayushman Bharat (PM-JAY), state-specific schemes (e.g., Aarogyasri, Mahatma Jyotiba Phule), and Employee State Insurance (ESIS).

### 5.12 Profile
* Personal demographic data, pre-existing conditions, family details, active insurance relations, and configurations.

---

## 6. Trust & Data-Source Model
CareFin classifies all data into two categories:
1. **Verified Data (`dataType: "verified"`)**:
   * Sourced from insurance companies, government portal databases, or authorized hospital listings.
   * Exposes `source`, `verifiedDate`, and `effective_date`.
2. **Demo Data (`dataType: "demo"`)**:
   * Used when verified datasets are unavailable.
   * Explicitly displays warning: *"Demo data — verify with hospital and insurer."*

---

## 7. Success Criteria
* **Accuracy**: 100% correctness of deterministic calculations (deductible, co-pay, crowdfunding fees).
* **Safety**: Zero critical AI hallucinations regarding medical coverage guarantees.
* **Accessibility**: Clean, readable typography and layouts accessible under stress.
* **User Engagement**: Cohesive UX flow connecting policy definitions to hospital networking search and out-of-pocket calculators.
