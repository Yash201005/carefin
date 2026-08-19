
from app.schemas.advisor import AdvisorRequest, RecommendedPlan


class InsuranceAdvisorService:
    # Centralized plan registry representing health insurance plans
    PLANS_DB = [  # noqa: RUF012
        {
            "plan_name": "CareGuard Essential Health Plan",
            "insurer": "CareGuard Insurance",
            "city_scope": "Mumbai, Delhi, Bangalore",
            "base_premium": 12000.0,
            "sum_insured": 500000.0,
            "room_rent_limit": "Private Single Room (Up to 1% of Sum Insured / day)",
            "co_payment": "10% Co-payment",
            "deductible": "None",
            "waiting_periods": "24 Months specific diseases; 36 Months pre-existing diseases",
            "exclusions": ["Cosmetic Surgery", "Dental Treatments", "Weight loss treatments"],
            "source": "CareGuard Core Plan Guide v2",
            "data_status": "DEMO_DATA",
            "verification_date": "15-Jul-2026",
            "has_copay": True,
            "has_rent_limit": True,
            "has_deductible": False
        },
        {
            "plan_name": "Optima Premium Care Plan",
            "insurer": "Optima Health",
            "city_scope": "Mumbai, Delhi, Bangalore",
            "base_premium": 18500.0,
            "sum_insured": 1000000.0,
            "room_rent_limit": "No Limit on Room Rent",
            "co_payment": "No Co-payment",
            "deductible": "None",
            "waiting_periods": "12 Months specific diseases; 24 Months pre-existing diseases",
            "exclusions": ["Self-inflicted injuries", "Adventure sports accidents", "Cosmetic procedures"],
            "source": "Optima Deluxe Rate Sheet 2026",
            "data_status": "DEMO_DATA",
            "verification_date": "18-Jul-2026",
            "has_copay": False,
            "has_rent_limit": False,
            "has_deductible": False
        },
        {
            "plan_name": "Bharat Suraksha Floater Plan",
            "insurer": "Bharat Medical",
            "city_scope": "Mumbai, Delhi",
            "base_premium": 9500.0,
            "sum_insured": 750000.0,
            "room_rent_limit": "Twin Sharing Room limit",
            "co_payment": "20% Co-payment",
            "deductible": "None",
            "waiting_periods": "24 Months specific diseases; 48 Months pre-existing diseases",
            "exclusions": ["Alcohol abuse treatments", "Congenital external diseases", "Infertility treatments"],
            "source": "Bharat Suraksha Rate Leaflet 2026",
            "data_status": "DEMO_DATA",
            "verification_date": "20-Jul-2026",
            "has_copay": True,
            "has_rent_limit": True,
            "has_deductible": False
        },
        {
            "plan_name": "CareGuard Senior Citizen Shield",
            "insurer": "CareGuard Insurance",
            "city_scope": "Mumbai, Delhi, Bangalore",
            "base_premium": 22000.0,
            "sum_insured": 300000.0,
            "room_rent_limit": "Single Private Room",
            "co_payment": "20% Co-payment",
            "deductible": "None",
            "waiting_periods": "12 Months specific diseases; 24 Months pre-existing diseases",
            "exclusions": ["Cosmetic surgeries", "Non-prescription consumables", "Mental health therapies"],
            "source": "CareGuard Senior Care Brochure",
            "data_status": "DEMO_DATA",
            "verification_date": "15-Jul-2026",
            "has_copay": True,
            "has_rent_limit": True,
            "has_deductible": False
        },
        {
            "plan_name": "Optima Super Deductible Top-up",
            "insurer": "Optima Health",
            "city_scope": "Mumbai, Bangalore",
            "base_premium": 6500.0,
            "sum_insured": 1500000.0,
            "room_rent_limit": "No Limit on Room Rent",
            "co_payment": "No Co-payment",
            "deductible": "₹1,00,000 Deductible",
            "waiting_periods": "36 Months pre-existing diseases",
            "exclusions": ["Dental surgeries", "Alternative medicine therapies", "Infertility"],
            "source": "Optima Topup Guide 2026",
            "data_status": "DEMO_DATA",
            "verification_date": "18-Jul-2026",
            "has_copay": False,
            "has_rent_limit": False,
            "has_deductible": True
        }
    ]

    @staticmethod
    def recommend(req: AdvisorRequest) -> list[RecommendedPlan]:
        """
        Executes deterministic matching logic against the health plan dataset.
        """
        recommendations = []

        # Iterate over plans in database
        for plan in InsuranceAdvisorService.PLANS_DB:
            # 1. Filter by location availability (city must be in plan city_scope)
            plan_cities = [c.strip().lower() for c in plan["city_scope"].split(",")]
            if req.city.strip().lower() not in plan_cities:
                # Location misfit -> Exclude plan entirely from recommendations
                continue

            # 2. Dynamic Premium Scaling (simulate adjustments based on age and family size)
            age_factor = 1.0 + max(0.0, (req.age - 30) * 0.02)
            family_factor = 1.0 + (req.family_size - 1) * 0.4
            calculated_premium = plan["base_premium"] * age_factor * family_factor

            # Match factors checklist
            reasons = []
            strengths = []
            limitations = []
            status_checks = []

            # 3. Budget checking logic
            if calculated_premium <= req.premium_budget:
                reasons.append("Within requested premium budget limit.")
                strengths.append("Fits yearly budget targets.")
            elif calculated_premium <= req.premium_budget * 1.25:
                reasons.append("Slightly exceeds requested premium budget (within 25%).")
                status_checks.append("BUDGET_WARNING")
                limitations.append("Premium is higher than user-preferred range.")
            else:
                # Mismatch on budget (too expensive)
                status_checks.append("BUDGET_MISMATCH")
                limitations.append("Significantly exceeds user-preferred budget limit.")

            # 4. Sum Insured checking logic
            if plan["sum_insured"] >= req.sum_insured:
                reasons.append("Meets or exceeds requested sum insured coverage.")
                strengths.append(f"Provides broad coverage threshold ({plan['sum_insured']:,} INR).")
            else:
                reasons.append("Below requested sum insured coverage.")
                status_checks.append("COVERAGE_UNDERSIZE")
                limitations.append("Sum insured coverage is lower than requested.")

            # 5. Preferences mapping logic
            # Copay
            if req.copay_preference == "no_copay" and plan["has_copay"]:
                reasons.append("Has co-payment requirement contrary to user preference.")
                status_checks.append("COPAY_MISFIT")
                limitations.append("Co-payment applies to claims.")
            elif not plan["has_copay"]:
                strengths.append("No co-payment requirements on claims.")

            # Room Rent Limit
            if req.room_rent_preference == "no_limit" and plan["has_rent_limit"]:
                reasons.append("Has room rent sub-limits contrary to user preference.")
                status_checks.append("RENT_LIMIT_MISFIT")
                limitations.append("Room rent capping limits apply.")
            elif not plan["has_rent_limit"]:
                strengths.append("No sub-limits on hospital room rent charges.")

            # Deductible
            if req.deductible_preference == "no_deductible" and plan["has_deductible"]:
                reasons.append("Has deductible threshold contrary to user preference.")
                status_checks.append("DEDUCTIBLE_MISFIT")
                limitations.append("High deductible boundary must be met before coverage applies.")
            elif not plan["has_deductible"]:
                strengths.append("No deductible threshold required.")

            # Pre-existing diseases reminder check
            if req.has_pre_existing_diseases:
                reasons.append("Waiting periods apply for pre-existing medical conditions.")
                limitations.append("Requires waiting periods clearance before covering past diseases.")

            # 6. Classify status (Matched vs Partially Matched vs Mismatch)
            # If budget mismatches or coverage is extremely undersized, classify as DOES NOT MATCH
            if "BUDGET_MISMATCH" in status_checks:
                match_status = "DOES NOT MATCH"
            elif any(s in status_checks for s in ["BUDGET_WARNING", "COVERAGE_UNDERSIZE", "COPAY_MISFIT", "RENT_LIMIT_MISFIT", "DEDUCTIBLE_MISFIT"]):
                match_status = "PARTIALLY MATCHED"
            else:
                match_status = "MATCHED"

            # Recommended consult questions
            questions = [
                "Are there any additional sub-limits on specific surgical procedures?",
                f"What is the network hospital count inside my location ({req.city})?",
                "Is cashless pre-authorization available for emergency day-care procedures?"
            ]

            # Construct plan object mapping values
            rec = RecommendedPlan(
                plan_name=plan["plan_name"],
                insurer=plan["insurer"],
                city_scope=plan["city_scope"],
                illustrative_premium=round(calculated_premium, 2),
                sum_insured=plan["sum_insured"],
                co_payment=plan["co_payment"],
                deductible=plan["deductible"],
                room_rent_limit=plan["room_rent_limit"],
                waiting_periods=plan["waiting_periods"],
                exclusions=plan["exclusions"],
                match_status=match_status,
                match_reasons=reasons,
                strengths=strengths,
                limitations=limitations,
                questions_to_ask=questions,
                source=plan["source"],
                data_status=plan["data_status"],
                verification_date=plan["verification_date"]
            )
            recommendations.append(rec)

        # Sort: matched first, partially matched second, does not match last
        status_priority = {"MATCHED": 0, "PARTIALLY MATCHED": 1, "DOES NOT MATCH": 2}
        recommendations.sort(key=lambda r: status_priority[r.match_status])

        return recommendations
