from typing import Any

from pydantic import BaseModel, Field


class ExtractedParam(BaseModel):
    name: str
    value: Any | None = None
    unit: str | None = None
    page: int | None = None
    source: str | None = None
    status: str = Field(description="FOUND / NOT_FOUND / UNCERTAIN")

class PolicyMetadata(BaseModel):
    sum_insured: ExtractedParam
    deductible: ExtractedParam
    co_payment_percentage: ExtractedParam
    room_rent_limit: ExtractedParam
    icu_rent_limit: ExtractedParam
    waiting_period_months: ExtractedParam
    exclusions: list[str] = []
    sub_limits: dict[str, Any] = {}

class OOPCalculationRequest(BaseModel):
    treatment_cost: float = Field(description="Total estimated bill from hospital")
    room_category: str = Field(description="e.g., Twin Sharing, Private Single Suite")
    daily_rent: float = Field(description="Charged daily room rent from hospital")
    hospitalization_days: int = Field(description="Number of days in hospital")
    procedure_category: str = Field(description="e.g. Angioplasty, Cataract, Custom")
    policy_metadata: PolicyMetadata

class RoomRentAdjustment(BaseModel):
    room_rent_charged: float
    room_rent_policy_limit: float
    excess_per_day: float
    total_room_rent_excess: float

class OOPBreakdown(BaseModel):
    total_treatment_cost: float
    non_covered_amount: float
    room_rent_excess: float
    eligible_hospital_cost: float
    deductible_applied: float
    co_payment_deducted: float
    estimated_insurance_contribution: float
    estimated_patient_responsibility: float

class RAGCitation(BaseModel):
    page_number: int
    source_text: str

class OOPCalculationResponse(BaseModel):
    inputs: OOPCalculationRequest
    breakdown: OOPBreakdown
    room_rent_details: RoomRentAdjustment
    ai_explanation: str
    citations: list[RAGCitation]
    assumptions: list[str]
    estimate_status: str = Field(description="ESTIMATE")
    limitations: list[str]
    disclaimer: str
