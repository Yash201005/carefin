
from pydantic import BaseModel, Field

from app.schemas.policy import PolicyMetadata, RAGCitation


class ClaimsGuidanceRequest(BaseModel):
    procedure: str = Field(description="Name of the medical procedure (e.g. Angioplasty, Cataract Surgery)")
    claim_type: str = Field(description="Type of claim: 'cashless' or 'reimbursement'")
    policy_metadata: PolicyMetadata | None = None

class ClaimsGuidanceResponse(BaseModel):
    procedure: str
    claim_type: str
    document_checklist: list[str]
    preauth_guidance: list[str]
    policy_conditions_to_verify: list[str]
    citations: list[RAGCitation]
    disclaimers: list[str]
    estimate_status: str = Field(default="GUIDANCE")
