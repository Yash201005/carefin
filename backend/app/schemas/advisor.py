
from pydantic import BaseModel, Field, field_validator


class AdvisorRequest(BaseModel):
    age: int = Field(..., description="Age of the primary insured person")
    city: str = Field(..., description="City of residence")
    family_size: int = Field(..., description="Number of family members requiring coverage")
    premium_budget: float = Field(..., description="Approximate yearly budget for premium")
    sum_insured: float = Field(..., description="Desired sum insured amount")
    preferred_coverage: str = Field("Individual", description="Coverage type: Individual / Family Floater")
    has_pre_existing_diseases: bool = Field(False, description="Whether the user has pre-existing medical conditions")
    copay_preference: str | None = Field("any", description="no_copay / any")
    room_rent_preference: str | None = Field("any", description="no_limit / any")
    deductible_preference: str | None = Field("any", description="no_deductible / any")

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int) -> int:
        if v <= 0 or v > 120:
            raise ValueError("Age must be between 1 and 120.")
        return v

    @field_validator("family_size")
    @classmethod
    def validate_family_size(cls, v: int) -> int:
        if v <= 0 or v > 15:
            raise ValueError("Family size must be between 1 and 15.")
        return v

    @field_validator("premium_budget")
    @classmethod
    def validate_premium_budget(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Premium budget must be a positive number.")
        return v

    @field_validator("sum_insured")
    @classmethod
    def validate_sum_insured(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Sum insured must be a positive number.")
        return v

class RecommendedPlan(BaseModel):
    plan_name: str
    insurer: str
    city_scope: str
    illustrative_premium: float
    sum_insured: float
    co_payment: str
    deductible: str
    room_rent_limit: str
    waiting_periods: str
    exclusions: list[str]
    match_status: str = Field(description="MATCHED / PARTIALLY MATCHED / DOES NOT MATCH")
    match_reasons: list[str]
    strengths: list[str]
    limitations: list[str]
    questions_to_ask: list[str]
    source: str
    data_status: str = Field(description="DEMO_DATA / VERIFIED_SOURCE")
    verification_date: str

class AdvisorResponse(BaseModel):
    query_params: AdvisorRequest
    results: list[RecommendedPlan]
    underwriting_notice: str
    disclaimer: str
