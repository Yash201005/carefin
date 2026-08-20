import logging

from fastapi import APIRouter, HTTPException, status

from app.schemas.funding import (
    CrowdfundingRequest,
    CrowdfundingResponse,
    FundingGapRequest,
    FundingGapResponse,
    FundingSourcesResponse,
)
from app.services.funding_data import FundingDataService

router = APIRouter()
logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "Disclaimer: Crowdfunding estimations and assistance source details are compiled as general informational guides. "
    "Platform fees, processing gateways rates, and taxes are subject to change. CareFin does not guarantee "
    "fundraising success, grant approvals, or exact payout targets. Users must verify current fee schedules "
    "and eligibility requirements directly with the respective platform or organization before initiating campaigns."
)

@router.post("/calculate-gap", response_model=FundingGapResponse, status_code=status.HTTP_200_OK)
def calculate_funding_gap(request: FundingGapRequest):
    """
    Computes the deterministic gap between expected treatment cost and confirmed resources.
    """
    try:
        return FundingDataService.calculate_gap(request)
    except ValueError as e:
        logger.error(f"Validation error in funding gap query: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error calculating funding gap: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while calculating your funding gap."
        )

@router.post("/crowdfunding-calculation", response_model=CrowdfundingResponse, status_code=status.HTTP_200_OK)
def calculate_crowdfunding_fees(request: CrowdfundingRequest):
    """
    Computes platform, processing, and tax deductions from net funding needs,
    and returns the required gross fundraising target.
    """
    try:
        return FundingDataService.calculate_crowdfunding(request)
    except ValueError as e:
        logger.error(f"Validation error in crowdfunding calculation request: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error in crowdfunding fee calculation: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while calculating crowdfunding target fees."
        )

@router.get("/sources", response_model=FundingSourcesResponse, status_code=status.HTTP_200_OK)
def get_funding_sources():
    """
    Retrieves the platform fee schedules and healthcare financial assistance databases.
    """
    try:
        sources = FundingDataService.get_sources()
        platforms = FundingDataService.get_platforms()
        return FundingSourcesResponse(
            sources=sources,
            platforms=platforms,
            disclaimer=DISCLAIMER_TEXT
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error retrieving funding sources catalog: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the funding registry."
        )
