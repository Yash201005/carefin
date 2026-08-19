import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.schemes import (
    SchemeMatchRequest,
    SchemeMatchResponse,
    SchemeRegistryResponse,
)
from app.services.schemes_data import SchemesDataService

router = APIRouter()
logger = logging.getLogger(__name__)

DISCLAIMER_TEXT = (
    "Disclaimer: Government scheme information is provided for reference and educational purposes only. "
    "Eligibility rules, benefit structures, and hospital empanelment can change at any time. "
    "CareFin does not guarantee approval, eligibility, or financial assistance. "
    "Always verify scheme eligibility, benefits, and required documents directly with the official scheme authority."
)

@router.get("", response_model=SchemeRegistryResponse, status_code=status.HTTP_200_OK)
def get_schemes(
    state: str | None = Query(None, description="Filter schemes by state scope"),
    procedure: str | None = Query(None, description="Filter schemes by covered procedure name"),
    category: str | None = Query(None, description="Filter schemes by scheme category"),
    hospitalization_required: bool | None = Query(None, description="Filter schemes by hospitalization requirement"),
    max_income: float | None = Query(None, description="Filter schemes by maximum annual income limits")
):
    """
    Retrieves and filters government health schemes reference data from the centralized registry database.
    """
    try:
        # Validate inputs
        if max_income is not None and max_income < 0:
            raise ValueError("Maximum income filter cannot be negative.")
        if state:
            state = state.strip()
            if len(state) < 2 or len(state) > 50:
                raise ValueError("State search term must be between 2 and 50 characters.")

        results = SchemesDataService.get_schemes(
            state=state,
            procedure=procedure,
            category=category,
            hospitalization_required=hospitalization_required,
            max_income=max_income
        )

        return SchemeRegistryResponse(
            schemes=results,
            disclaimer=DISCLAIMER_TEXT
        )
    except ValueError as e:
        logger.error(f"Validation error in scheme query: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error retrieving government schemes: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while matching government schemes."
        )

@router.post("/match", response_model=SchemeMatchResponse, status_code=status.HTTP_200_OK)
def match_schemes(request: SchemeMatchRequest):
    """
    Performs a deterministic eligibility screening against all registered government schemes
    based on the user's demographic and medical parameters.
    """
    try:
        results = SchemesDataService.screen_schemes(request)
        return SchemeMatchResponse(
            query_params=request,
            results=results,
            disclaimer=DISCLAIMER_TEXT
        )
    except ValueError as e:
        logger.error(f"Validation error in scheme matching request: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error matching schemes: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while matching government schemes."
        )
