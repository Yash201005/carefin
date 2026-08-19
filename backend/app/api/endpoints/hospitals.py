import logging

from fastapi import APIRouter, HTTPException, Query, status

from app.schemas.hospitals import HospitalCostComparisonResponse
from app.services.hospital_data import HospitalDataService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/costs", response_model=HospitalCostComparisonResponse, status_code=status.HTTP_200_OK)
def get_hospital_costs(
    city: str | None = Query(None, description="Filter hospitals by city (e.g. Mumbai, Delhi, Bangalore)"),
    procedure: str | None = Query(None, description="Filter hospitals by procedure (e.g. Angioplasty, Cataract Surgery)"),
    specialty: str | None = Query(None, description="Filter hospitals by specialty (e.g. Cardiology, Orthopedics)"),
    min_cost: float | None = Query(None, description="Minimum estimated cost filter boundary"),
    max_cost: float | None = Query(None, description="Maximum estimated cost filter boundary"),
    sort_by: str | None = Query(None, description="Sorting parameter: cost_asc, cost_desc, name")
):
    """
    Retrieves and filters hospital treatment cost estimates from the centralized data registry.
    """
    try:
        results = HospitalDataService.get_costs(
            city=city,
            procedure=procedure,
            specialty=specialty,
            min_cost=min_cost,
            max_cost=max_cost,
            sort_by=sort_by
        )
        
        disclaimer = (
            "Disclaimer: Hospital treatment costs displayed here are estimates and reference package rates. "
            "Actual hospital pricing may vary based on comorbidities, hospital stays, and implants. "
            "Confirm current pricing directly with the hospital before admitting."
        )

        return HospitalCostComparisonResponse(
            query_params={
                "city": city,
                "procedure": procedure,
                "specialty": specialty,
                "min_cost": min_cost,
                "max_cost": max_cost,
                "sort_by": sort_by
            },
            results=results,
            disclaimer=disclaimer
        )
    except ValueError as e:
        logger.error(f"Validation error in hospital cost query: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error retrieving hospital cost data: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while matching hospital cost details."
        )
