import logging
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.schemas.policy import (
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

@router.post("/analyze", response_model=PolicyMetadata, status_code=status.HTTP_200_OK)
async def analyze_policy(file: UploadFile = File(...)):  # noqa: B008
    """
    Accepts an insurance policy PDF document, validates size and type,
    extracts structured parameters, and caches pages for RAG explanation queries.
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
