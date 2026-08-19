from typing import Any

from pydantic import BaseModel, Field


class HospitalProcedureCost(BaseModel):
    procedure_name: str
    estimated_cost: float
    cost_range_min: float
    cost_range_max: float
    room_category_assumption: str
    assumptions: list[str]
    data_status: str = Field(description="DEMO_DATA / VERIFIED_SOURCE / ESTIMATE")
    verification_date: str | None = None
    source: str

class HospitalRecord(BaseModel):
    id: str
    name: str
    city: str
    location: str
    specialties: list[str]
    cost_details: HospitalProcedureCost

class HospitalCostComparisonResponse(BaseModel):
    query_params: dict[str, Any]
    results: list[HospitalRecord]
    disclaimer: str

class HospitalNetworkRecord(BaseModel):
    hospital_name: str
    city: str
    location: str
    specialties: list[str]
    procedure_name: str | None = None
    insurer_name: str
    network_status: str = Field(description="IN_NETWORK / NOT_AVAILABLE / UNKNOWN")
    cashless_status: str = Field(description="CASHLESS — VERIFIED / CASHLESS — DEMO DATA / NOT AVAILABLE / UNKNOWN")
    source: str
    data_status: str = Field(description="VERIFIED_SOURCE / DEMO_DATA / NOT_AVAILABLE")
    verification_date: str | None = None

class HospitalNetworkResponse(BaseModel):
    query_params: dict[str, Any]
    results: list[HospitalNetworkRecord]
    disclaimer: str
