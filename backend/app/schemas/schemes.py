import re

from pydantic import BaseModel, Field, field_validator


class SchemeRecord(BaseModel):
    id: str = Field(..., description="Unique scheme identifier")
    name: str = Field(..., description="Scheme name")
    category: str = Field(..., description="Scheme category (e.g. Central/State Scheme)")
    target_beneficiaries: str = Field(..., description="Description of target beneficiaries")
    state_scope: str = Field(..., description="State or region scope (e.g. PAN India or a specific state)")
    min_age: int | None = Field(None, description="Minimum age requirements where applicable")
    max_age: int | None = Field(None, description="Maximum age requirements where applicable")
    max_income: float | None = Field(None, description="Income criteria where applicable")
    treatment_procedures: list[str] = Field(..., description="Covered treatment/procedure categories")
    hospitalization_required: bool = Field(..., description="Whether hospitalization is required")
    benefit_description: str = Field(..., description="Informational description of what the scheme provides")
    eligibility_conditions: str = Field(..., description="Summary of eligibility conditions")
    required_documents: list[str] = Field(..., description="List of potentially required documents")
    application_notes: str = Field(..., description="Verification/application steps or notes")
    official_source: str = Field(..., description="Official website/source URL or text reference")
    verification_date: str | None = Field(None, description="Verification date of the source information")
    data_status: str = Field(..., description="Data status: VERIFIED SOURCE, REFERENCE INFORMATION, DEMO DATA, NOT AVAILABLE")

class SchemeMatchRequest(BaseModel):
    age: int | None = Field(None, description="Age of the primary beneficiary")
    state: str | None = Field(None, description="State of residence (e.g., Maharashtra, Karnataka, Delhi)")
    income: float | None = Field(None, description="Annual family income in INR")
    family_size: int | None = Field(None, description="Family size count")
    occupation: str | None = Field(None, description="Occupation/category of the beneficiary family")
    treatment_procedure: str | None = Field(None, description="Estimated treatment/procedure name")
    hospitalization_required: bool | None = Field(None, description="Whether inpatient hospitalization is required")
    existing_insurance: bool | None = Field(None, description="Whether the user already has health insurance")

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: int | None) -> int | None:
        if v is not None and (v < 0 or v > 120):
            raise ValueError("Age must be between 0 and 120.")
        return v

    @field_validator("family_size")
    @classmethod
    def validate_family_size(cls, v: int | None) -> int | None:
        if v is not None and (v < 1 or v > 30):
            raise ValueError("Family size must be between 1 and 30.")
        return v

    @field_validator("income")
    @classmethod
    def validate_income(cls, v: float | None) -> float | None:
        if v is not None and v < 0:
            raise ValueError("Income must be a non-negative value.")
        return v

    @field_validator("state")
    @classmethod
    def validate_state(cls, v: str | None) -> str | None:
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) < 2 or len(v_clean) > 50:
                raise ValueError("State must be between 2 and 50 characters.")
            if not re.match(r"^[a-zA-Z\s\-]+$", v_clean):
                raise ValueError("State must contain only letters, spaces, or hyphens.")
            return v_clean
        return v

    @field_validator("occupation")
    @classmethod
    def validate_occupation(cls, v: str | None) -> str | None:
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) > 100:
                raise ValueError("Occupation string exceeds maximum length of 100.")
            return v_clean
        return v

    @field_validator("treatment_procedure")
    @classmethod
    def validate_treatment_procedure(cls, v: str | None) -> str | None:
        if v is not None:
            v_clean = v.strip()
            if len(v_clean) > 100:
                raise ValueError("Treatment/procedure string exceeds maximum length of 100.")
            return v_clean
        return v

class SchemeMatchResult(BaseModel):
    scheme: SchemeRecord = Field(..., description="The details of the government scheme")
    screening_status: str = Field(..., description="POTENTIALLY ELIGIBLE / POSSIBLY ELIGIBLE / DOES NOT APPEAR TO MATCH / INSUFFICIENT INFORMATION")
    matched_conditions: list[str] = Field(..., description="Conditions that were successfully matched")
    unverified_conditions: list[str] = Field(..., description="Conditions that were unknown/unverified")
    mismatched_conditions: list[str] = Field(..., description="Conditions that did not match")

class SchemeMatchResponse(BaseModel):
    query_params: SchemeMatchRequest = Field(..., description="The original screening inputs")
    results: list[SchemeMatchResult] = Field(..., description="Deterministic screening results for each scheme")
    disclaimer: str = Field(..., description="Overall program disclaimer")

class SchemeRegistryResponse(BaseModel):
    schemes: list[SchemeRecord] = Field(..., description="List of all registered government schemes")
    disclaimer: str = Field(..., description="Disclaimer regarding reference scheme data")
