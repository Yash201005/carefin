
from app.schemas.schemes import SchemeMatchRequest, SchemeMatchResult, SchemeRecord


class SchemesDataService:
    # Centralized dataset representing government health schemes
    SCHEMES_DB = [  # noqa: RUF012
        {
            "id": "scheme_001",
            "name": "Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (AB-PMJAY)",
            "category": "Central Government Health Insurance Scheme",
            "target_beneficiaries": "Low-income, deprived rural families and identified urban occupational categories.",
            "state_scope": "PAN India",
            "min_age": None,
            "max_age": None,
            "max_income": None,  # Determined by deprivation criteria, not direct income limit
            "treatment_procedures": ["Angioplasty", "Cataract Surgery", "Knee Replacement", "Appendectomy", "Cancer Treatment", "Cardiology", "Oncology", "Orthopedics", "Ophthalmology", "General Surgery"],
            "hospitalization_required": True,
            "benefit_description": "Provides free health cover of up to ₹5,00,000 per family per year for secondary and tertiary care hospitalizations.",
            "eligibility_conditions": "Must belong to identified deprived families in rural or urban areas as per Socio-Economic Caste Census (SECC) 2011, or hold a valid PMJAY card.",
            "required_documents": ["PM-JAY Gold Card", "Aadhaar Card", "Ration Card or Family Card", "Hospital Admission Advice"],
            "application_notes": "Cashless admission is facilitated directly at empanelled public and private hospitals through an on-site PMJAY kiosk (Aarogya Mitra).",
            "official_source": "https://pmjay.gov.in/",
            "verification_date": "2026-08-15",
            "data_status": "VERIFIED SOURCE"
        },
        {
            "id": "scheme_002",
            "name": "Rashtriya Swasthya Bima Yojana (RSBY)",
            "category": "Central Government Health Insurance Scheme",
            "target_beneficiaries": "Below Poverty Line (BPL) families and unorganized sector workers.",
            "state_scope": "PAN India",
            "min_age": None,
            "max_age": None,
            "max_income": 30000.0,
            "treatment_procedures": ["Angioplasty", "Cataract Surgery", "Appendectomy", "General Surgery", "Cardiology", "Ophthalmology"],
            "hospitalization_required": True,
            "benefit_description": "Provides secondary care hospitalization coverage up to ₹30,000 per family per year on a family floater basis.",
            "eligibility_conditions": "Must be a BPL cardholder or registered worker in the unorganized sector in a participating state.",
            "required_documents": ["BPL Card", "RSBY Smart Card", "Identity document", "Hospitalization Advice Sheet"],
            "application_notes": "Present the RSBY smart card at the empanelled hospital's helpdesk. Beneficiary pays a small registration fee of ₹30.",
            "official_source": "http://www.rsby.gov.in/",
            "verification_date": "2026-08-10",
            "data_status": "REFERENCE INFORMATION"
        },
        {
            "id": "scheme_003",
            "name": "Mahatma Jyotiba Phule Jan Arogya Yojana (MJPJAY)",
            "category": "State Government Health Insurance Scheme",
            "target_beneficiaries": "Yellow, Orange, and Antyodaya Ration Card holder families of Maharashtra state.",
            "state_scope": "Maharashtra",
            "min_age": None,
            "max_age": None,
            "max_income": 100000.0,  # Max income limit for Orange cardholders, Yellow is BPL
            "treatment_procedures": ["Angioplasty", "Cancer Treatment", "Knee Replacement", "General Surgery", "Cardiology", "Oncology", "Orthopedics"],
            "hospitalization_required": True,
            "benefit_description": "Cashless hospitalization coverage up to ₹1,50,000 per family per year (with specific renal transplant limit up to ₹2,50,000).",
            "eligibility_conditions": "Must hold a valid Yellow, Orange, or Antyodaya Ration Card issued by the Government of Maharashtra.",
            "required_documents": ["Yellow or Orange Ration Card", "Aadhaar Card or Maharashtra Voter ID", "Income Certificate from Tehsildar", "Hospital Referral Slip"],
            "application_notes": "Empanelled hospital's Arogyamitra initiates the pre-authorization request online. Patient must be admitted in a network facility.",
            "official_source": "https://www.jeevandayee.gov.in/",
            "verification_date": "2026-08-12",
            "data_status": "VERIFIED SOURCE"
        },
        {
            "id": "scheme_004",
            "name": "CareFin Demo State Health Scheme",
            "category": "State Government Health Scheme",
            "target_beneficiaries": "Low-income resident families of Karnataka state.",
            "state_scope": "Karnataka",
            "min_age": 18,
            "max_age": 65,
            "max_income": 120000.0,
            "treatment_procedures": ["Cataract Surgery", "Appendectomy"],
            "hospitalization_required": True,
            "benefit_description": "Provides financial medical aid of up to ₹50,000 for covered daycare and inpatient surgical procedures.",
            "eligibility_conditions": "Must be a permanent resident of Karnataka, aged between 18 and 65, with annual household income below ₹1,20,000.",
            "required_documents": ["Karnataka Address Proof", "Income Certificate", "Ration Card", "Medical Prescription"],
            "application_notes": "Submit application at nearest district healthcare office. Note that this is demo data for testing purposes.",
            "official_source": "NOT AVAILABLE",
            "verification_date": "2026-08-01",
            "data_status": "DEMO DATA"
        }
    ]

    @staticmethod
    def get_schemes(
        state: str | None = None,
        procedure: str | None = None,
        category: str | None = None,
        hospitalization_required: bool | None = None,
        max_income: float | None = None
    ) -> list[SchemeRecord]:
        """
        Retrieves reference government schemes applying strict AND filtering.
        """
        filtered = []
        for s in SchemesDataService.SCHEMES_DB:
            # 1. State scope filter (AND)
            if state and s["state_scope"] != "PAN India" and s["state_scope"].strip().lower() != state.strip().lower():
                continue

            # 2. Procedure filter (AND)
            if procedure:
                proc_lower = procedure.strip().lower()
                procedures_lower = [p.lower() for p in s["treatment_procedures"]]
                if proc_lower not in procedures_lower:
                    continue

            # 3. Category filter (AND)
            if category:
                cat_lower = category.strip().lower()
                if cat_lower not in s["category"].lower():
                    continue

            # 4. Hospitalization required filter (AND)
            if hospitalization_required is not None and s["hospitalization_required"] != hospitalization_required:
                continue

            # 5. Income-related scope filter (AND)
            # Find schemes suitable for a user whose income is <= max_income.
            # So if a scheme has a max income limit and the filter's income exceeds it, skip it.
            if max_income is not None and s["max_income"] is not None and max_income > s["max_income"]:
                continue

            # Map to Pydantic record
            filtered.append(SchemeRecord(**s))

        return filtered

    @staticmethod
    def screen_schemes(request: SchemeMatchRequest) -> list[SchemeMatchResult]:
        """
        Screens the user's input against all registered schemes using deterministic rules.
        """
        results = []

        # If all input fields are completely null/unspecified, it's insufficient information overall
        is_empty_request = all(
            v is None for v in [
                request.age, request.state, request.income, request.family_size,
                request.occupation, request.treatment_procedure, request.hospitalization_required,
                request.existing_insurance
            ]
        )

        for s in SchemesDataService.SCHEMES_DB:
            matched_conditions = []
            unverified_conditions = []
            mismatched_conditions = []

            # 1. State check
            if request.state:
                if s["state_scope"] == "PAN India":
                    matched_conditions.append("State matches scheme scope (PAN India).")
                elif s["state_scope"].strip().lower() == request.state.strip().lower():
                    matched_conditions.append(f"State matches scheme scope ({s['state_scope']}).")
                else:
                    mismatched_conditions.append(f"State '{request.state}' does not match scheme scope ({s['state_scope']}).")
            else:
                if s["state_scope"] != "PAN India":
                    unverified_conditions.append(f"State of residence was not provided (Scheme is scoped to {s['state_scope']}).")
                else:
                    matched_conditions.append("Scheme is open PAN India.")

            # 2. Age check
            if s["min_age"] is not None or s["max_age"] is not None:
                if request.age is not None:
                    if s["min_age"] is not None and request.age < s["min_age"]:
                        mismatched_conditions.append(f"Age ({request.age}) is below the minimum required age ({s['min_age']}).")
                    elif s["max_age"] is not None and request.age > s["max_age"]:
                        mismatched_conditions.append(f"Age ({request.age}) exceeds the maximum allowed age ({s['max_age']}).")
                    else:
                        matched_conditions.append(f"Age ({request.age}) is within the required range ({s['min_age'] or 0}-{s['max_age'] or '120'}).")
                else:
                    age_req_desc = f"requires age between {s['min_age'] or 0} and {s['max_age'] or '120'}"
                    unverified_conditions.append(f"Age information was not provided (Scheme {age_req_desc}).")

            # 3. Income check
            if s["max_income"] is not None:
                if request.income is not None:
                    if request.income > s["max_income"]:
                        mismatched_conditions.append(f"Income (₹{request.income:,.0f}) exceeds the maximum income limit (₹{s['max_income']:,.0f}).")
                    else:
                        matched_conditions.append(f"Income (₹{request.income:,.0f}) is within the allowed limit (<= ₹{s['max_income']:,.0f}).")
                else:
                    unverified_conditions.append(f"Income information was not provided (Scheme has income criteria of <= ₹{s['max_income']:,.0f}).")

            # 4. Treatment/Procedure check
            if request.treatment_procedure:
                proc_lower = request.treatment_procedure.strip().lower()
                procedures_lower = [p.lower() for p in s["treatment_procedures"]]
                # Check for direct or partial match in procedures
                matched_proc = None
                for p in procedures_lower:
                    if proc_lower in p or p in proc_lower:
                        matched_proc = p
                        break
                
                if matched_proc:
                    matched_conditions.append(f"Treatment/Procedure '{request.treatment_procedure}' is covered under the scheme.")
                else:
                    mismatched_conditions.append(f"Treatment/Procedure '{request.treatment_procedure}' is not covered under this scheme.")
            else:
                unverified_conditions.append("Treatment/Procedure was not provided (Scheme covers specific procedure categories).")

            # 5. Hospitalization requirement check
            if s["hospitalization_required"]:
                if request.hospitalization_required is not None:
                    if request.hospitalization_required:
                        matched_conditions.append("Hospitalization requirement matches (Inpatient treatment).")
                    else:
                        mismatched_conditions.append("Scheme only covers inpatient hospitalization (user indicated no hospitalization).")
                else:
                    unverified_conditions.append("Hospitalization requirement is unknown (Scheme requires inpatient hospitalization).")

            # Deterministic status mapping
            if is_empty_request:
                screening_status = "INSUFFICIENT INFORMATION"
            elif len(mismatched_conditions) > 0:
                screening_status = "DOES NOT APPEAR TO MATCH"
            elif len(unverified_conditions) > 0:
                # If there are no mismatches and some matched, or if all are unverified
                if len(matched_conditions) == 0:
                    screening_status = "INSUFFICIENT INFORMATION"
                else:
                    screening_status = "POSSIBLY ELIGIBLE"
            else:
                screening_status = "POTENTIALLY ELIGIBLE"

            # Create SchemeRecord model
            scheme_model = SchemeRecord(**s)

            results.append(
                SchemeMatchResult(
                    scheme=scheme_model,
                    screening_status=screening_status,
                    matched_conditions=matched_conditions,
                    unverified_conditions=unverified_conditions,
                    mismatched_conditions=mismatched_conditions
                )
            )

        return results
