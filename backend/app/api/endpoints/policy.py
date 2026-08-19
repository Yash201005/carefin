import logging
import os
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional
from app.core.database import get_db
from app.models.models import Document, InsurancePolicy
from app.schemas.policy import (
    ExtractedParam,
    OOPCalculationRequest,
    OOPCalculationResponse,
    PolicyMetadata,
)
from app.services.calculator import OOPCalculator
from app.services.llm import LLMExplanationService
from app.services.pdf_extractor import PDFExtractionError, PDFExtractor
from app.services.policy_extractor import PolicyParameterExtractor

router = APIRouter()
logger = logging.getLogger(__name__)

# Simple in-memory cache to retain extracted policy text pages for RAG validation
# Key: document_id (filename), Value: list of extracted page content dicts
policy_text_cache: dict[str, list[dict[str, Any]]] = {}

def _get_float_val(param: ExtractedParam) -> float:
    if param and param.value is not None:
        try:
            return float(param.value)
        except (ValueError, TypeError):
            pass
    return 0.0

@router.post("/analyze", response_model=PolicyMetadata, status_code=status.HTTP_200_OK)
async def analyze_policy(
    file: UploadFile = File(...),  # noqa: B008
    current_user: Any | None = Depends(get_current_user_optional),  # noqa: B008
    db: Session = Depends(get_db)  # noqa: B008
):
    """
    Accepts an insurance policy PDF document, validates size and type,
    extracts structured parameters, and caches pages for RAG explanation queries.
    If the user is authenticated, the document metadata and extracted parameters are saved.
    """
    # 1. Basic format check
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported."
        )

    try:
        # Read file stream
        file_bytes = await file.read()
        
        # Extract pages with text and validation
        pages_content = PDFExtractor.validate_and_extract(file_bytes, file.filename)
        
        # Cache extracted text pages locally for next RAG calculation queries
        policy_text_cache[file.filename] = pages_content
        
        # Run parameter extractor
        metadata = PolicyParameterExtractor.extract_from_pages(pages_content, file.filename)

        # Integration with security vault if user is logged in
        if current_user:
            # Prevent path traversal
            safe_filename = os.path.basename(file.filename)

            # Save file to disk
            os.makedirs("uploads", exist_ok=True)
            storage_name = f"{uuid.uuid4()}.pdf"
            storage_path = os.path.join("uploads", storage_name)
            with open(storage_path, "wb") as f:  # noqa: ASYNC230
                f.write(file_bytes)

            # Create document record
            doc = Document(
                filename=safe_filename,
                document_type="Insurance Policy",
                file_size=len(file_bytes),
                processing_status="PROCESSED",
                owner_id=current_user.id,
                source="POLICY ANALYSIS",
                verification_status="UNVERIFIED",
                storage_path=storage_path
            )
            db.add(doc)
            db.commit()
            db.refresh(doc)

            # Create policy record
            policy = InsurancePolicy(
                policy_name=safe_filename,
                sum_insured=_get_float_val(metadata.sum_insured),
                copay=_get_float_val(metadata.co_payment_percentage),
                deductible=_get_float_val(metadata.deductible),
                room_rent_limit=_get_float_val(metadata.room_rent_limit),
                icu_limit=_get_float_val(metadata.icu_rent_limit),
                owner_id=current_user.id,
                document_id=doc.id
            )
            db.add(policy)
            db.commit()

        return metadata

    except PDFExtractionError as e:
        logger.error(f"PDF extraction error: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error analyzing policy document: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while analyzing the document."
        )

@router.post("/calculate-oop", response_model=OOPCalculationResponse, status_code=status.HTTP_200_OK)
def calculate_out_of_pocket(request: OOPCalculationRequest):
    """
    Executes a deterministic out-of-pocket calculation, queries RAG context evidence,
    and returns a breakdown alongside a grounded AI explanation.
    """
    try:
        # 1. Run deterministic math engine calculations
        base_response = OOPCalculator.calculate(request)
        
        # 2. Match RAG contexts using cached page texts
        doc_id = request.policy_metadata.sum_insured.source or ""
        pages = policy_text_cache.get(doc_id, [])
        
        # 3. Generate grounded explanations
        final_response = LLMExplanationService.generate_explanation(base_response, pages)
        return final_response

    except ValueError as e:
        logger.error(f"Validation error in calculation requests: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:  # noqa: BLE001
        logger.error(f"Unexpected error in OOP calculation: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while calculating out-of-pocket costs."
        )
