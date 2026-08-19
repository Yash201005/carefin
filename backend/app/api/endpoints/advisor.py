import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.advisor import AdvisorRequest, AdvisorResponse
from app.services.insurance_advisor import InsuranceAdvisorService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/advisor", response_model=AdvisorResponse, status_code=status.HTTP_200_OK)
def run_insurance_advisor(request: AdvisorRequest):
    """
    Evaluates health insurance plan options based on user constraints deterministically.
    """
    try:
        results = InsuranceAdvisorService.recommend(request)
        
        underwriting_notice = (
            "Notice: This engine performs deterministic suitability matching. "
            "It does not perform medical underwriting, guarantee coverage issuance, "
            "or make final insurance contract commitments."
        )

        disclaimer = (
            "Disclaimer: Suitability matching is illustrative. Premiums and policy parameters "
            "must be verified directly with the insurer or a licensed insurance advisor."
        )

        return AdvisorResponse(
            query_params=request,
            results=results,
            underwriting_notice=underwriting_notice,
            disclaimer=disclaimer
        )
    except ValueError as e:
        logger.error(f"Validation error in insurance advisor endpoint: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error running advisor analysis: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating health insurance options."
        )
