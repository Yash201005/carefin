
from pydantic import BaseModel, Field, field_validator


class FundingGapRequest(BaseModel):
    total_treatment_cost: float = Field(..., description="Total estimated bill for medical treatment")
    insurance_covered_amount: float = Field(..., description="Portion covered or expected to be covered by insurance")
    patient_contribution: float = Field(..., description="Amount the patient can contribute personally")
    confirmed_other_assistance: float = Field(..., description="Other confirmed financial assistance")

    @field_validator("total_treatment_cost", "insurance_covered_amount", "patient_contribution", "confirmed_other_assistance")
    @classmethod
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Financial values must be non-negative.")
        return v

class FundingGapResponse(BaseModel):
    inputs: FundingGapRequest
    funding_gap: float
    status: str = Field(default="CALCULATED")

class CrowdfundingRequest(BaseModel):
    required_funding_amount: float = Field(..., description="The net funding amount required (funding gap)")
    platform_fee_percentage: float = Field(..., description="Platform service fee percentage")
    payment_processing_fee_percentage: float = Field(..., description="Payment gateway/processing fee percentage")
    tax_percentage: float = Field(..., description="Tax percentage applied to platform fee or transactions")
    fixed_transaction_fee: float = Field(..., description="Fixed setup or transaction fee per donation")

    @field_validator("required_funding_amount", "fixed_transaction_fee")
    @classmethod
    def validate_non_negative_values(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Fee and funding values must be non-negative.")
        return v

    @field_validator("platform_fee_percentage", "payment_processing_fee_percentage", "tax_percentage")
    @classmethod
    def validate_percentage(cls, v: float) -> float:
        if v < 0 or v >= 100:
            raise ValueError("Percentages must be between 0 and 100 (exclusive of 100).")
        return v

class FeeBreakdown(BaseModel):
    platform_fee: float
    payment_processing_fee: float
    applicable_taxes: float
    fixed_fees: float
    total_deductions: float

class CrowdfundingResponse(BaseModel):
    inputs: CrowdfundingRequest
    required_gross_target: float
    fee_breakdown: FeeBreakdown
    estimated_net_amount: float
    status: str = Field(default="ESTIMATE")

class FundingSourceRecord(BaseModel):
    name: str
    category: str
    description: str
    eligibility_notes: str
    geographic_scope: str
    treatment_scope: str
    source: str
    verification_date: str | None
    data_status: str
    limitations: str
    application_notes: str

class CrowdfundingPlatformRecord(BaseModel):
    platform_name: str
    platform_fee_percentage: float
    payment_processing_fee_percentage: float
    tax_percentage: float
    fixed_transaction_fee: float
    payment_processing_assumptions: str
    tax_assumptions: str
    fixed_fee_assumptions: str
    source: str
    verification_date: str | None
    data_status: str

class FundingSourcesResponse(BaseModel):
    sources: list[FundingSourceRecord]
    platforms: list[CrowdfundingPlatformRecord]
    disclaimer: str
