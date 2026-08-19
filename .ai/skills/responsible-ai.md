# AI Skill: Responsible AI and Safety Guardrails

This guide sets rules to prevent CareFin from generating unsafe, misleading, or illegal health/financial advice.

---

## 1. Absolute Rule: No Guarantees

AI outputs must never present the following as guaranteed or absolute:
* **Medical Diagnoses**: Do not diagnose health conditions.
* **Insurance Coverage**: Never guarantee a claim will be approved.
* **Fundraising Success**: Do not guarantee campaign completions.
* **Legal / Fraud Accusations**: Never make definitive claims of illegal activities.

### Language Guidelines:
* Bad: *"Your insurer will cover this procedure."*
* Good: *"The policy terms indicate this procedure is covered, subject to verification and standard deductibles."*
* Bad: *"This invoice is a scam."*
* Good: *"Several billing anomalies were found. We recommend independent verification before payment."*

---

## 2. Contextual Disclaimers

Every AI analysis tool (e.g. policy summary, claim letter explainer, scheme matcher) must display a clear, accessible disclaimer.

* **Policy Analyzer / Calculator**: *"Estimates provided are for guidance only. Active claims are subject to final settlement by your insurer."*
* **Government Assist**: *"Eligibility suggestions are based on state rules. Final approval lies with the respective government departments."*
* **Fraud Scanning**: *"Anomaly scanning does not constitute legal or financial verification. Verify directly with the billing hospital."*

---

## 3. Handling Ambiguity and Uncertainty

* If policy terms are contradictory or ambiguous, the AI must highlight the conflicting clauses and output: *"This clause is ambiguous. We recommend clarifying this with your insurance representative."*
* Never invent details or assume values for missing parameters. Output `Requires confirmation` for any unidentified terms.
