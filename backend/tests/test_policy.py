import pytest

from app.schemas.policy import (
    ExtractedParam,
    OOPCalculationRequest,
    PolicyMetadata,
)
from app.services.calculator import OOPCalculator
from app.services.llm import LLMExplanationService
from app.services.pdf_extractor import PDFExtractionError, PDFExtractor
from app.services.policy_extractor import PolicyParameterExtractor

# ==========================================
# 1. PDF UPLOAD AND EXTRACTOR TEST CASES
# ==========================================

def test_pdf_magic_number_validation():
    """Verify non-PDF uploads are rejected via magic number checks."""
    fake_pdf = b"NOT_A_PDF_STREAM_BUT_TEXT_FILES"
    with pytest.raises(PDFExtractionError) as exc:
        PDFExtractor.validate_and_extract(fake_pdf, "test_file.txt")
    assert "Invalid file type" in str(exc.value)

def test_pdf_size_limitations():
    """Verify files larger than 10MB are rejected."""
    large_bytes = b"%PDF-1.4" + (b"0" * 11 * 1024 * 1024)  # 11MB
    with pytest.raises(PDFExtractionError) as exc:
        PDFExtractor.validate_and_extract(large_bytes, "large_file.pdf")
    assert "exceeds the maximum limit" in str(exc.value)

def test_malformed_pdf_rejection():
    """Verify malformed PDFs raise extraction errors."""
    malformed_pdf = b"%PDF-1.4\nthis is a broken pdf template"
    with pytest.raises(PDFExtractionError) as exc:
        PDFExtractor.validate_and_extract(malformed_pdf, "malformed.pdf")
    assert "Malformed or encrypted PDF" in str(exc.value)

# ==========================================
# 2. STRUCTURED EXTRACTION TEST CASES
# ==========================================

def test_policy_parameter_not_found_handling():
    """Verify missing values are represented as null/NOT_FOUND rather than faked."""
    pages = [{"page_number": 1, "text": "This policy details exclusions like cosmetics."}]
    metadata = PolicyParameterExtractor.extract_from_pages(pages, "sample.pdf")
    
    assert metadata.sum_insured.value is None
    assert metadata.sum_insured.status == "NOT_FOUND"
    assert metadata.co_payment_percentage.value is None
    assert metadata.co_payment_percentage.status == "NOT_FOUND"

def test_policy_parameter_extraction_success():
    """Verify correct parameter values are parsed from text."""
    pages = [
        {"page_number": 1, "text": "Sum Insured: Rs. 5,00,000. Deductible is Rs. 10,000."},
        {"page_number": 2, "text": "Co-payment share is 20%. Room Rent Limit: 5,000."}
    ]
    metadata = PolicyParameterExtractor.extract_from_pages(pages, "sample.pdf")
    
    assert metadata.sum_insured.value == 500000.0
    assert metadata.sum_insured.status == "FOUND"
    assert metadata.sum_insured.page == 1
    
    deductible_val = metadata.deductible.value
    assert deductible_val == 10000.0
    assert metadata.deductible.status == "FOUND"
    
    assert metadata.co_payment_percentage.value == 20.0
    assert metadata.co_payment_percentage.status == "FOUND"
    assert metadata.co_payment_percentage.page == 2

# ==========================================
# 3. DETERMINISTIC ENGINE TEST CASES
# ==========================================

@pytest.fixture
def base_metadata():
    return PolicyMetadata(
        sum_insured=ExtractedParam(name="Sum Insured", value=500000.0, status="FOUND", page=1, source="test.pdf"),
        deductible=ExtractedParam(name="Deductible", value=10000.0, status="FOUND", page=1, source="test.pdf"),
        co_payment_percentage=ExtractedParam(name="Co-payment", value=20.0, status="FOUND", page=2, source="test.pdf"),
        room_rent_limit=ExtractedParam(name="Room Rent", value=5000.0, status="FOUND", page=2, source="test.pdf"),
        icu_rent_limit=ExtractedParam(name="ICU Rent", status="NOT_FOUND"),
        waiting_period_months=ExtractedParam(name="Waiting Period", status="NOT_FOUND")
    )

def test_oop_calculator_standard_case(base_metadata):
    """Verify typical out-of-pocket calculations."""
    request = OOPCalculationRequest(
        treatment_cost=150000.0,
        room_category="Private Single",
        daily_rent=7000.0,  # ₹2,000 excess per day
        hospitalization_days=3,  # ₹6,000 total room excess
        procedure_category="Angioplasty",
        policy_metadata=base_metadata
    )
    # Deductions:
    # 1. Room excess = 3 * (7000 - 5000) = 6000
    # 2. Non-covered consumables = 150000 * 10% = 15000
    # 3. Eligible base = 150000 - 6000 - 15000 = 129000
    # 4. Deductible = 10000
    # 5. After deductible = 119000
    # 6. Co-pay = 119000 * 20% = 23800
    # 7. Insurance share = 119000 - 23800 = 95200
    # 8. Patient share = 150000 - 95200 = 54800
    
    response = OOPCalculator.calculate(request)
    assert response.breakdown.room_rent_excess == 6000.0
    assert response.breakdown.non_covered_amount == 15000.0
    assert response.breakdown.eligible_hospital_cost == 129000.0
    assert response.breakdown.deductible_applied == 10000.0
    assert response.breakdown.co_payment_deducted == 23800.0
    assert response.breakdown.estimated_insurance_contribution == 95200.0
    assert response.breakdown.estimated_patient_responsibility == 54800.0

def test_oop_calculator_zero_deductible_copay(base_metadata):
    """Verify math works with 0 deductible and 0 co-pay."""
    base_metadata.deductible.value = 0.0
    base_metadata.co_payment_percentage.value = 0.0
    
    request = OOPCalculationRequest(
        treatment_cost=100000.0,
        room_category="Sharing",
        daily_rent=3000.0,  # below ₹5,000 limit
        hospitalization_days=4,
        procedure_category="Cataract",
        policy_metadata=base_metadata
    )
    # Deductions:
    # Non-payables = 10000
    # Eligible = 90000
    # Deductible = 0, Co-pay = 0
    # Insurance = 90000
    # Patient share = 10000 (just non-payables)
    
    response = OOPCalculator.calculate(request)
    assert response.breakdown.estimated_insurance_contribution == 90000.0
    assert response.breakdown.estimated_patient_responsibility == 10000.0

def test_oop_calculator_hundred_percent_copay(base_metadata):
    """Verify co-pay scale boundary of 100%."""
    base_metadata.co_payment_percentage.value = 100.0
    base_metadata.deductible.value = 0.0
    
    request = OOPCalculationRequest(
        treatment_cost=100000.0,
        room_category="Sharing",
        daily_rent=3000.0,
        hospitalization_days=1,
        procedure_category="Custom",
        policy_metadata=base_metadata
    )
    
    response = OOPCalculator.calculate(request)
    assert response.breakdown.co_payment_deducted == 90000.0
    assert response.breakdown.estimated_insurance_contribution == 0.0
    assert response.breakdown.estimated_patient_responsibility == 100000.0

def test_oop_calculator_excess_deductible(base_metadata):
    """Verify deductible larger than eligible cost is handled."""
    base_metadata.deductible.value = 200000.0  # huge deductible
    
    request = OOPCalculationRequest(
        treatment_cost=100000.0,
        room_category="Sharing",
        daily_rent=3000.0,
        hospitalization_days=1,
        procedure_category="Custom",
        policy_metadata=base_metadata
    )
    
    response = OOPCalculator.calculate(request)
    assert response.breakdown.deductible_applied == 90000.0
    assert response.breakdown.estimated_insurance_contribution == 0.0
    assert response.breakdown.estimated_patient_responsibility == 100000.0

def test_oop_calculator_invalid_inputs(base_metadata):
    """Verify negative monetary inputs and out-of-bound co-pays throw value errors."""
    # Negative cost
    request = OOPCalculationRequest(
        treatment_cost=-10000.0,
        room_category="Sharing",
        daily_rent=3000.0,
        hospitalization_days=1,
        procedure_category="Custom",
        policy_metadata=base_metadata
    )
    with pytest.raises(ValueError) as exc:
        OOPCalculator.calculate(request)
    assert "cannot be negative" in str(exc.value)

    # Co-pay > 100%
    base_metadata.co_payment_percentage.value = 150.0
    request.treatment_cost = 100000.0
    with pytest.raises(ValueError) as exc:
        OOPCalculator.calculate(request)
    assert "between 0 and 100" in str(exc.value)

def test_deterministic_consistency(base_metadata):
    """Verify repeated executions yield identical numerical results."""
    request = OOPCalculationRequest(
        treatment_cost=150000.0,
        room_category="Private Single",
        daily_rent=7000.0,
        hospitalization_days=3,
        procedure_category="Angioplasty",
        policy_metadata=base_metadata
    )
    res1 = OOPCalculator.calculate(request)
    res2 = OOPCalculator.calculate(request)
    assert res1.breakdown.estimated_patient_responsibility == res2.breakdown.estimated_patient_responsibility

# ==========================================
# 4. RAG GROUNDING AND EXPLANATION TESTS
# ==========================================

def test_rag_fallback_when_evidence_missing(base_metadata):
    """Verify RAG fallback string is generated if evidence keyword does not exist in pages."""
    request = OOPCalculationRequest(
        treatment_cost=150000.0,
        room_category="Private Single",
        daily_rent=7000.0,
        hospitalization_days=3,
        procedure_category="Angioplasty",
        policy_metadata=base_metadata
    )
    base_resp = OOPCalculator.calculate(request)
    
    # Empty pages (no text matches "room rent", "deductible", or "co-pay")
    pages = [{"page_number": 1, "text": "Generic welcome pages with index guidelines."}]
    
    final_resp = LLMExplanationService.generate_explanation(base_resp, pages)
    assert "Information not found in the policy document — verify with insurer" in final_resp.ai_explanation
    assert len(final_resp.citations) == 0

def test_rag_explanation_grounding(base_metadata):
    """Verify AI explanation links citations with exact page excerpts from text."""
    request = OOPCalculationRequest(
        treatment_cost=150000.0,
        room_category="Private Single",
        daily_rent=7000.0,
        hospitalization_days=3,
        procedure_category="Angioplasty",
        policy_metadata=base_metadata
    )
    base_resp = OOPCalculator.calculate(request)
    
    pages = [
        {"page_number": 4, "text": "Clause 3: Co-payment of 20% shall apply to all claims."},
        {"page_number": 6, "text": "Clause 5: Room Rent charges capped at Rs. 5000 per day."}
    ]
    
    final_resp = LLMExplanationService.generate_explanation(base_resp, pages)
    assert "Information not found" not in final_resp.ai_explanation
    assert len(final_resp.citations) == 2
    assert final_resp.citations[0].page_number == 6
    assert "Room Rent" in final_resp.citations[0].source_text
    assert final_resp.citations[1].page_number == 4
    assert "Co-payment" in final_resp.citations[1].source_text
