from decimal import ROUND_HALF_UP, Decimal
from typing import ClassVar

from app.schemas.funding import (
    CrowdfundingPlatformRecord,
    CrowdfundingRequest,
    CrowdfundingResponse,
    FeeBreakdown,
    FundingGapRequest,
    FundingGapResponse,
    FundingSourceRecord,
)


class FundingDataService:
    # Centralized dataset of medical funding sources
    SOURCES_DB: ClassVar[list[dict]] = [
        {
            "name": "Prime Minister's National Relief Fund (PMNRF)",
            "category": "Government assistance",
            "description": "Provides immediate financial assistance to patients suffering from major life-threatening diseases for treatment at select government and private empanelled hospitals.",
            "eligibility_notes": "Open to all citizens of India based on application merit and financial necessity.",
            "geographic_scope": "PAN India",
            "treatment_scope": "Cancer, Cardiac surgeries, Kidney transplants, and other critical care.",
            "source": "PMNRF Official Guidelines",
            "verification_date": "2026-06-20",
            "data_status": "REFERENCE INFORMATION",
            "limitations": "Financial assistance is discretionary and subject to budget approval; does not cover OPD costs.",
            "application_notes": "Application must be submitted by the patient or relative along with hospital cost estimates, income proof, and MP recommendation."
        },
        {
            "name": "Rotary Club India Healthcare Grant",
            "category": "NGO / charity",
            "description": "Local Rotary Clubs provide financial aids and conduct free surgery camps for needy children and underprivileged patients.",
            "eligibility_notes": "Economically backward classes with annual family income below ₹1.5 Lakhs.",
            "geographic_scope": "Region-specific (varies by local Rotary chapters)",
            "treatment_scope": "Pediatric cardiac surgery, cleft lip surgery, polio corrective surgeries.",
            "source": "Rotary Club Local Chapters Handbook",
            "verification_date": "2026-05-15",
            "data_status": "REFERENCE INFORMATION",
            "limitations": "Grant amounts are limited and fluctuate depending on chapter donations.",
            "application_notes": "Reach out to the nearest local Rotary club chapter office with hospital estimates and income certificates."
        },
        {
            "name": "Tata Memorial Hospital Financial Aid (TMH Aid)",
            "category": "Hospital financial assistance",
            "description": "Offers highly subsidized treatment, free medications, and trust fund assistance to cancer patients admitted at Tata Memorial Hospital.",
            "eligibility_notes": "Patients registered and receiving active cancer treatment at Tata Memorial Hospital network facilities.",
            "geographic_scope": "Mumbai, and TMH network sites in India",
            "treatment_scope": "Cancer treatment (Chemotherapy, Radiation, Surgery)",
            "source": "Tata Memorial Medical Social Service Guide",
            "verification_date": "2026-07-05",
            "data_status": "REFERENCE INFORMATION",
            "limitations": "Applicable only for treatments conducted within the Tata Memorial network hospitals.",
            "application_notes": "Consult the Medical Social Work department inside the hospital campus for verification."
        },
        {
            "name": "CareFin Charity Fund (Demo Fund)",
            "category": "NGO / charity",
            "description": "A mock charity fund set up to demonstrate the integration of NGO-based medical grants with CareFin.",
            "eligibility_notes": "Anyone seeking medical assistance.",
            "geographic_scope": "PAN India",
            "treatment_scope": "All procedures",
            "source": "CareFin Demo Data Sheets",
            "verification_date": "2026-08-01",
            "data_status": "DEMO DATA",
            "limitations": "Mock limits apply. No actual payout or financial processing.",
            "application_notes": "Simply enter the desired grant in the calculator simulation."
        }
    ]

    # Centralized dataset of crowdfunding platforms
    PLATFORMS_DB: ClassVar[list[dict]] = [
        {
            "platform_name": "Ketto",
            "platform_fee_percentage": 0.0,
            "payment_processing_fee_percentage": 3.0,
            "tax_percentage": 0.0,
            "fixed_transaction_fee": 0.0,
            "payment_processing_assumptions": "Standard 3% inclusive of payment gateway charges and GST.",
            "tax_assumptions": "Tax on services is factored into the gateway fees.",
            "fixed_fee_assumptions": "No fixed transactional fees charged.",
            "source": "Ketto Official Fee Structure",
            "verification_date": "2026-07-15",
            "data_status": "REFERENCE INFORMATION"
        },
        {
            "platform_name": "Milaap",
            "platform_fee_percentage": 0.0,
            "payment_processing_fee_percentage": 3.0,
            "tax_percentage": 0.0,
            "fixed_transaction_fee": 0.0,
            "payment_processing_assumptions": "Standard gateway processing fees of 3%.",
            "tax_assumptions": "Included in standard processing fees.",
            "fixed_fee_assumptions": "No fixed transactional fees charged.",
            "source": "Milaap Pricing Page",
            "verification_date": "2026-07-20",
            "data_status": "REFERENCE INFORMATION"
        },
        {
            "platform_name": "ImpactGuru",
            "platform_fee_percentage": 5.0,
            "payment_processing_fee_percentage": 3.0,
            "tax_percentage": 0.0,
            "fixed_transaction_fee": 0.0,
            "payment_processing_assumptions": "Standard gateway fee of 3% applied in addition to platform fee.",
            "tax_assumptions": "GST on platform fee is included in the platform fee rate.",
            "fixed_fee_assumptions": "No fixed transactional setup fees.",
            "source": "ImpactGuru Pricing & Plans Booklet",
            "verification_date": "2026-07-10",
            "data_status": "REFERENCE INFORMATION"
        },
        {
            "platform_name": "CareFin Demo Platform",
            "platform_fee_percentage": 2.0,
            "payment_processing_fee_percentage": 2.5,
            "tax_percentage": 0.5,
            "fixed_transaction_fee": 15.0,
            "payment_processing_assumptions": "Simulated platform fees for reference calculations.",
            "tax_assumptions": "Flat 0.5% GST estimated on total donation value.",
            "fixed_fee_assumptions": "Fixed charge of ₹15 per donation.",
            "source": "CareFin Simulation Specs",
            "verification_date": "2026-08-01",
            "data_status": "DEMO DATA"
        }
    ]

    @staticmethod
    def calculate_gap(request: FundingGapRequest) -> FundingGapResponse:
        """
        Executes a deterministic funding gap calculation using money-safe Decimal arithmetic.
        """
        # Convert inputs to Decimals
        total = Decimal(str(request.total_treatment_cost))
        insurance = Decimal(str(request.insurance_covered_amount))
        patient = Decimal(str(request.patient_contribution))
        assistance = Decimal(str(request.confirmed_other_assistance))

        # Perform subtraction
        gap = total - insurance - patient - assistance

        # Enforce zero boundary
        if gap < 0:
            gap = Decimal(0)

        # Quantize to 2 decimal places
        gap_rounded = gap.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

        return FundingGapResponse(
            inputs=request,
            funding_gap=float(gap_rounded),
            status="CALCULATED"
        )

    @staticmethod
    def calculate_crowdfunding(request: CrowdfundingRequest) -> CrowdfundingResponse:
        """
        Executes a money-safe crowdfunding target fee calculation using Decimal arithmetic.
        """
        # Convert inputs to Decimals
        net = Decimal(str(request.required_funding_amount))
        plat_pct = Decimal(str(request.platform_fee_percentage)) / Decimal(100)
        gateway_pct = Decimal(str(request.payment_processing_fee_percentage)) / Decimal(100)
        tax_pct = Decimal(str(request.tax_percentage)) / Decimal(100)
        fixed_fee = Decimal(str(request.fixed_transaction_fee))

        # Check total percentage deductions
        p_total = plat_pct + gateway_pct + tax_pct
        if p_total >= 1:
            raise ValueError("Sum of platform fee, processing fee, and taxes must be less than 100%.")

        # If net required is zero, target is zero
        if net == 0:
            gross = Decimal(0)
            plat_val = Decimal(0)
            gate_val = Decimal(0)
            tax_val = Decimal(0)
            total_deductions = Decimal(0)
        else:
            # Gross = (Net + Fixed) / (1 - P)
            gross = (net + fixed_fee) / (1 - p_total)
            
            # Calculate components
            plat_val = gross * plat_pct
            gate_val = gross * gateway_pct
            tax_val = gross * tax_pct
            total_deductions = plat_val + gate_val + tax_val + fixed_fee

        # Round all values to 2 decimal places
        cents = Decimal("0.01")
        gross = gross.quantize(cents, rounding=ROUND_HALF_UP)
        plat_val = plat_val.quantize(cents, rounding=ROUND_HALF_UP)
        gate_val = gate_val.quantize(cents, rounding=ROUND_HALF_UP)
        tax_val = tax_val.quantize(cents, rounding=ROUND_HALF_UP)
        fixed_fee = fixed_fee.quantize(cents, rounding=ROUND_HALF_UP)
        total_deductions = total_deductions.quantize(cents, rounding=ROUND_HALF_UP)
        
        # Recalculate net to verify rounding consistency
        net_received = gross - total_deductions

        fee_breakdown = FeeBreakdown(
            platform_fee=float(plat_val),
            payment_processing_fee=float(gate_val),
            applicable_taxes=float(tax_val),
            fixed_fees=float(fixed_fee),
            total_deductions=float(total_deductions)
        )

        return CrowdfundingResponse(
            inputs=request,
            required_gross_target=float(gross),
            fee_breakdown=fee_breakdown,
            estimated_net_amount=float(net_received),
            status="ESTIMATE"
        )

    @staticmethod
    def get_sources() -> list[FundingSourceRecord]:
        return [FundingSourceRecord(**s) for s in FundingDataService.SOURCES_DB]

    @staticmethod
    def get_platforms() -> list[CrowdfundingPlatformRecord]:
        return [CrowdfundingPlatformRecord(**p) for p in FundingDataService.PLATFORMS_DB]
