import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.claims import ClaimsGuidanceRequest, ClaimsGuidanceResponse
from app.services.claims_guidance import ClaimsGuidanceService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/guidance", response_model=ClaimsGuidanceResponse, status_code=status.HTTP_200_OK)
def get_claims_guidance(request: ClaimsGuidanceRequest):
    """
    Accepts procedure type, claim mode, and policy details to compile
    custom pre-authorization advice and document checklists.
    """
    try:
        response = ClaimsGuidanceService.get_guidance(request)
        return response
    except ValueError as e:
        logger.error(f"Validation error in claims guidance requests: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error retrieving claims guidance: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while compiling claims guidance details."
        )
