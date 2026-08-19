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
