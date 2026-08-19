import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.models import SavedCalculation, User
from app.schemas.security import SavedCalculationCreate, SavedCalculationResponse

router = APIRouter()

@router.get("", response_model=list[SavedCalculationResponse])
def get_user_calculations(
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Retrieves all calculations saved by the authenticated user.
    """
    records = db.query(SavedCalculation).filter(SavedCalculation.owner_id == current_user.id).all()
    
    # Deserialize input/output JSON strings to dicts for client response
    response_list = []
    for r in records:
        response_list.append(
            SavedCalculationResponse(
                id=r.id,
                calculation_type=r.calculation_type,
                input_values=json.loads(r.input_values),
                output_values=json.loads(r.output_values),
                reference_metadata=r.reference_metadata,
                created_at=r.created_at
            )
        )
    return response_list

@router.post("", response_model=SavedCalculationResponse, status_code=status.HTTP_201_CREATED)
def save_calculation(
    payload: SavedCalculationCreate,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Saves a calculation parameters and output values for cross-feature persistence.
    """
    record = SavedCalculation(
        owner_id=current_user.id,
        calculation_type=payload.calculation_type,
        input_values=json.dumps(payload.input_values),
        output_values=json.dumps(payload.output_values),
        reference_metadata=payload.reference_metadata
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return SavedCalculationResponse(
        id=record.id,
        calculation_type=record.calculation_type,
        input_values=payload.input_values,
        output_values=payload.output_values,
        reference_metadata=record.reference_metadata,
        created_at=record.created_at
    )

@router.delete("/{calculation_id}", status_code=status.HTTP_200_OK)
def delete_calculation(
    calculation_id: int,
    current_user: User = Depends(get_current_user),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Deletes a saved calculation after checking ownership.
    """
    calc = db.query(SavedCalculation).filter(SavedCalculation.id == calculation_id).first()
    if not calc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Calculation not found."
        )
        
    # Security check: User must own the calculation record to delete it! (Prevents IDOR)
    if calc.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this calculation."
        )

    db.delete(calc)
    db.commit()
    return {"detail": "Calculation successfully deleted."}
