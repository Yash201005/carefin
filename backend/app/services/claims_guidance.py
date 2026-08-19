import re

# Import cache to link policy page evidence if available
from app.api.endpoints.policy import policy_text_cache
from app.schemas.claims import ClaimsGuidanceRequest, ClaimsGuidanceResponse
from app.schemas.policy import RAGCitation


class ClaimsGuidanceService:
    # Mapped reference procedures data
    PROCEDURE_METADATA = {  # noqa: RUF012
        "angioplasty": {
            "name": "Angioplasty",
            "considerations": [
                "Typically covered under active health insurance after standard pre-existing disease waiting periods.",
                "Ensure hospital coordinates directly with TPA for cashless approval to avoid reimbursement claim delays."
            ],
            "conditions": [
                "Verify if policy contains a specific sub-limit or cap on cardiac stents or angioplasty procedures.",
                "Check for active waiting periods for cardiac-related conditions (typically 24 to 48 months for pre-existing disease)."
            ],
            "documents": ["Cardiac angiogram film & reports", "ECG and cardiac enzyme enzyme reports", "Stent barcode stickers invoice"]
        },
        "cataract surgery": {
            "name": "Cataract Surgery",
            "considerations": [
                "Cataract claims are frequently capped under Indian policies with strict procedure-specific sub-limits.",
                "Confirm whether the limit is per eye or cumulative for both eyes."
            ],
            "conditions": [
                "Verify policy sub-limits for Cataract Surgery (often capped at ₹30,000 to ₹50,000 per eye).",
                "Standard waiting period of 24 months usually applies for cataract procedures."
            ],
            "documents": ["Ophthalmic diagnosis and vision tests", "Lens barcode invoice stickers", "Pre-operative biometry reports"]
        },
        "knee replacement": {
            "name": "Knee Replacement",
            "considerations": [
                "Joint replacement surgery is highly scrutinized for pre-existing osteoarthritis conditions.",
                "Verify if the procedure is medically necessary due to injury or chronic degenerative conditions."
            ],
            "conditions": [
                "Verify waiting period for joint replacements (standard 24 to 48 months waiting period applies).",
                "Check if joint implants have specific sub-limit caps under your policy schedule."
            ],
            "documents": ["Knee joint X-rays and MRI reports", "Orthopedic surgeon prescription details", "Implants barcode invoice verification sheets"]
        },
        "appendectomy": {
            "name": "Appendectomy",
            "considerations": [
                "Usually treated as an emergency hospitalization condition, bypasses standard waiting periods.",
                "Confirm with the TPA if cashless pre-authorization is approved within 24 hours of emergency admission."
            ],
            "conditions": [
                "Check if emergency ambulance charges are covered under your policy caps.",
                "Confirm that hospitalization exceeds 24 hours unless approved as day-care treatment."
            ],
            "documents": ["Abdominal ultrasound / CT scan reports", "Emergency admission note sheet", "Complete blood count diagnostic sheets"]
        },
        "cancer treatment": {
            "name": "Cancer Treatment",
            "considerations": [
                "Chemotherapy and radiotherapy are often classified as day-care procedures (not requiring 24-hour hospitalization).",
                "Check if policy includes modern treatment riders or organ transplant caps."
            ],
            "conditions": [
                "Check for critical illness riders or specific chemotherapy sub-limit clauses.",
                "Verify if targeted immunotherapies or oral chemotherapies are covered or excluded."
            ],
            "documents": ["Histopathology / Biopsy oncology reports", "Chemotherapy cycle prescriptions & billing", "Oncologist treatment summary notes"]
        }
    }

    @staticmethod
    def get_guidance(request: ClaimsGuidanceRequest) -> ClaimsGuidanceResponse:
        """
        Generates claims guidelines, cashless flows, and document checklists based on
        medical procedure type, and links evidence from the analyzed policy if attached.
        """
        # Validate inputs
        proc_key = request.procedure.strip().lower()
        if not proc_key:
            raise ValueError("Procedure name cannot be empty.")

        claim_type = request.claim_type.strip().lower()
        if claim_type not in ["cashless", "reimbursement"]:
            raise ValueError("Claim type must be 'cashless' or 'reimbursement'.")

        # 1. Base checklists and pre-authorization guidance
        document_checklist = []
        preauth_guidance = []
        disclaimers = [
            "This guidance is for general informational purposes only and is NOT a guarantee of claim approval or coverage.",
            "Actual claim payouts depend on your insurer's final audit, medical necessity parameters, and active policy schedules."
        ]

        if claim_type == "cashless":
            document_checklist = [
                "Pre-authorization / Cashless Request Form (signed by doctor & patient)",
                "Health Insurance Card / Policy Schedule printout",
                "Government Identity Proof (Aadhaar, PAN, or Passport)",
                "First Doctor Consultation Prescription",
                "Diagnostic Reports confirming the medical condition"
            ]
            preauth_guidance = [
                "Locate the Insurance / Cashless Desk at your hospital immediately upon admission.",
                "Submit the pre-auth form at least 72 hours before planned admissions, or within 24 hours for emergency admissions.",
                "The hospital TPA desk will coordinate directly with your insurer; monitor SMS updates for approval statuses.",
                "Network status must be verified with the insurer/TPA or hospital before admission."
            ]
        else:
            document_checklist = [
                "Completed Reimbursement Claim Form (Part A signed by patient, Part B by hospital)",
                "Original Discharge Summary sheet detailing diagnosis and treatment",
                "Original Final Detailed Bill with detailed breakdown of room rent, doctor fees, etc.",
                "Original Payment Receipts signed by hospital cashier",
                "All diagnostic films and laboratory reports (ECG, X-Ray, Lab test results)",
                "Itemized Pharmacy and Medical Consumable invoices"
            ]
            preauth_guidance = [
                "Pay all hospital charges directly upon discharge and collect all original files and bills.",
                "Ensure every doctor visit fee and pharmacy bill has a corresponding receipt or voucher.",
                "Submit the complete reimbursement file to your insurer/TPA office within 15 to 30 days of discharge."
            ]

        # 2. Procedure specific details (Demo reference lookup)
        proc_meta = ClaimsGuidanceService.PROCEDURE_METADATA.get(proc_key)
        policy_conditions = []

        if proc_meta:
            policy_conditions = list(proc_meta["conditions"])
            # Append procedure-specific documents
            document_checklist.extend(proc_meta["documents"])
        else:
            # Generalized guidance fallback for unknown procedures
            policy_conditions = [
                "Check the policy's waiting-period, exclusion, and procedure/sub-limit clauses. No coverage conclusion is made without supporting policy evidence.",
                "Verify if this procedure is categorized under daycare treatments or requires 24-hour hospitalization."
            ]
            document_checklist.append("Relevant medical diagnostic scans and specialist prescriptions")

        # 3. Policy Evidence Integration (RAG retrieval)
        citations = []
        if request.policy_metadata:
            meta = request.policy_metadata
            doc_id = meta.sum_insured.source or ""
            pages = policy_text_cache.get(doc_id, [])

            # Helper to retrieve text chunks
            def find_policy_evidence(keywords: list[str]) -> tuple[int | None, str | None]:
                for page in pages:
                    text = page["text"]
                    for kw in keywords:
                        match = re.search(re.escape(kw), text, re.IGNORECASE)
                        if match:
                            start = max(0, match.start() - 60)
                            end = min(len(text), match.start() + 100)
                            excerpt = text[start:end].replace("\n", " ").strip()
                            return page["page_number"], f"... {excerpt} ..."
                return None, None

            # Scan policy text for waiting periods matching procedure or general guidelines
            wp_keywords = ["waiting period", "exclusion", "not covered"]
            if proc_key in ["cataract surgery", "cataract"]:
                wp_keywords.append("cataract")
            elif proc_key in ["knee replacement", "joint replacement"]:
                wp_keywords.append("joint replacement")

            p_num, excerpt = find_policy_evidence(wp_keywords)
            if p_num and excerpt:
                citations.append(RAGCitation(page_number=p_num, source_text=excerpt))
                policy_conditions.append(
                    f"Verified Policy Evidence (Page {p_num}): A clause matching coverage limits or waiting periods was located in your policy schedule."
                )
            else:
                # Fallback warning when evidence cannot be located in the text
                policy_conditions.append(
                    "Information not found in the policy document — verify with insurer. (No procedure-specific waiting period or exclusion clause was located in the uploaded PDF text)."
                )

        return ClaimsGuidanceResponse(
            procedure=proc_meta["name"] if proc_meta else request.procedure,
            claim_type=claim_type.capitalize(),
            document_checklist=document_checklist,
            preauth_guidance=preauth_guidance,
            policy_conditions_to_verify=policy_conditions,
            citations=citations,
            disclaimers=disclaimers
        )
