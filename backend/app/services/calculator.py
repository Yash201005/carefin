import logging

from app.schemas.policy import (
    OOPBreakdown,
    OOPCalculationRequest,
    OOPCalculationResponse,
    RoomRentAdjustment,
)

logger = logging.getLogger(__name__)

class OOPCalculator:
    @staticmethod
    def calculate(request: OOPCalculationRequest) -> OOPCalculationResponse:
        """
        Executes a 100% deterministic mathematical out-of-pocket cost breakdown based on
        structured policy parameters and hospitalization details.
        """
        # 1. Validation Checks (Fail-safe checks on numerical bounds)
        if request.treatment_cost < 0:
            raise ValueError("Treatment cost cannot be negative.")
        if request.daily_rent < 0:
            raise ValueError("Daily room rent cannot be negative.")
        if request.hospitalization_days <= 0:
            raise ValueError("Hospitalization days must be a positive integer.")

        meta = request.policy_metadata
        sum_insured = meta.sum_insured.value or 0.0
        deductible = meta.deductible.value or 0.0
        co_pay_percentage = meta.co_payment_percentage.value or 0.0

        if co_pay_percentage < 0 or co_pay_percentage > 100:
            raise ValueError("Co-payment percentage must be between 0 and 100.")
        if deductible < 0:
            raise ValueError("Deductible cannot be negative.")
        if sum_insured < 0:
            raise ValueError("Sum insured cannot be negative.")

        # 2. Room Rent Adjustment Calculations
        # Check if room rent limit is defined
        limit_rent = daily_rent = request.daily_rent
        limit_token = meta.room_rent_limit

        if limit_token.status == "FOUND" and limit_token.value is not None:
            # Handle percentage-based limits (e.g. 1% of Sum Insured) or flat limits
            if limit_token.unit == "percentage":
                limit_rent = (limit_token.value / 100.0) * sum_insured
            elif limit_token.unit == "currency" or isinstance(limit_token.value, (int, float)):
                limit_rent = float(limit_token.value)

        excess_per_day = max(0.0, daily_rent - limit_rent)
        total_room_rent_excess = excess_per_day * request.hospitalization_days

        # 3. Non-payable consumable calculations (Typically 10% of total hospital bill in India)
        non_covered_amount = request.treatment_cost * 0.10

        # 4. Compute Eligible Hospital Costs (bounded by Sum Insured)
        eligible_hospital_cost = max(
            0.0,
            request.treatment_cost - total_room_rent_excess - non_covered_amount
        )
        eligible_hospital_cost = min(eligible_hospital_cost, sum_insured)

        # 5. Apply Deductibles
        deductible_applied = min(eligible_hospital_cost, deductible)
        after_deductible = max(0.0, eligible_hospital_cost - deductible_applied)

        # 6. Apply Co-payments
        co_payment_deducted = after_deductible * (co_pay_percentage / 100.0)

        # 7. Compute Payout shares
        estimated_insurance_contribution = max(0.0, after_deductible - co_payment_deducted)
        estimated_patient_responsibility = request.treatment_cost - estimated_insurance_contribution

        # Formulate responses
        breakdown = OOPBreakdown(
            total_treatment_cost=request.treatment_cost,
            non_covered_amount=non_covered_amount,
            room_rent_excess=total_room_rent_excess,
            eligible_hospital_cost=eligible_hospital_cost,
            deductible_applied=deductible_applied,
            co_payment_deducted=co_payment_deducted,
            estimated_insurance_contribution=estimated_insurance_contribution,
            estimated_patient_responsibility=estimated_patient_responsibility
        )

        room_rent_details = RoomRentAdjustment(
            room_rent_charged=daily_rent,
            room_rent_policy_limit=limit_rent,
            excess_per_day=excess_per_day,
            total_room_rent_excess=total_room_rent_excess
        )

        # Assumptions
        assumptions = [
            f"Non-payable items (surgical consumables, admin charges) are estimated at a flat 10% (₹{non_covered_amount:,.2f}) of the total treatment bill.",
            "Policy parameters are based on the extracted metadata and require manual verification.",
            "Proportionate deduction was not applied to other doctor/surgeon charges in this base estimate."
        ]

        # Limitations
        limitations = [
            "Co-payments and deductibles are calculated on standard eligible base rates.",
            "Specific hospital tier agreements (e.g. GIPSA network packages) may override standard room rent parameters.",
            "This calculation assumes standard medical procedures; specialized list limits or critical illness riders are excluded."
        ]

        disclaimer = (
            "Estimate only. Actual claim settlement and final hospital charges may differ based on "
            "policy terms, provider billing, and insurer/TPA decisions."
        )

        return OOPCalculationResponse(
            inputs=request,
            breakdown=breakdown,
            room_rent_details=room_rent_details,
            ai_explanation="",  # RAG / Explanation Layer will populate this
            citations=[],
            assumptions=assumptions,
            estimate_status="ESTIMATE",
            limitations=limitations,
            disclaimer=disclaimer
        )
