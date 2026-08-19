from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class DocumentUploadResponse(BaseModel):
    id: int
    filename: str
    document_type: str
    file_size: int
    processing_status: str
    upload_date: datetime
    source: str
    verification_status: str

    class Config:
        from_attributes = True

class SavedCalculationCreate(BaseModel):
    calculation_type: str
    input_values: dict[str, Any]
    output_values: dict[str, Any]
    reference_metadata: str | None = None

class SavedCalculationResponse(BaseModel):
    id: int
    calculation_type: str
    input_values: dict[str, Any]
    output_values: dict[str, Any]
    reference_metadata: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True

class InsurancePolicyResponse(BaseModel):
    id: int
    policy_name: str
    sum_insured: float
    copay: float
    deductible: float
    room_rent_limit: float
    icu_limit: float
    created_at: datetime
    document_id: int | None = None

    class Config:
        from_attributes = True
