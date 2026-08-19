import pytest
from fastapi.testclient import TestClient

from app.api.endpoints.policy import policy_text_cache
from app.main import app
from app.schemas.policy import ExtractedParam, PolicyMetadata

client = TestClient(app)

@pytest.fixture
def dummy_policy_metadata():
    return PolicyMetadata(
        sum_insured=ExtractedParam(name="Sum Insured", value=500000.0, status="FOUND", source="dummy.pdf", page=1),
        deductible=ExtractedParam(name="Deductible", value=15000.0, status="FOUND", source="dummy.pdf", page=1),
        co_payment_percentage=ExtractedParam(name="Co-pay", value=10.0, status="FOUND", source="dummy.pdf", page=1),
        room_rent_limit=ExtractedParam(name="Room Rent Limit", value=5000.0, status="FOUND", source="dummy.pdf", page=2),
        icu_rent_limit=ExtractedParam(name="ICU Limit", value=10000.0, status="FOUND", source="dummy.pdf", page=2),
        waiting_period_months=ExtractedParam(name="Waiting Period", value=24.0, status="FOUND", source="dummy.pdf", page=3),
        exclusions=["Cosmetics", "Self-inflicted injury"],
        sub_limits={"Cataract": 30000.0}
    )

def test_claims_guidance_supported_procedure_cashless():
    """Verify that a supported procedure returns correct cashless rules and documentation."""
    payload = {
        "procedure": "Cataract Surgery",
        "claim_type": "cashless"
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["procedure"] == "Cataract Surgery"
    assert data["claim_type"] == "Cashless"
    # Document checklist should contain pre-auth forms and cataract-specific documents
    assert any("Pre-authorization" in doc for doc in data["document_checklist"])
    assert any("Ophthalmic diagnosis" in doc for doc in data["document_checklist"])
    # Should have general cashless pre-auth guidance
    assert any("Insurance / Cashless Desk" in line for line in data["preauth_guidance"])
    assert any("Cataract Surgery" in line for line in data["policy_conditions_to_verify"])
    assert "This guidance is for general informational purposes only and is NOT a guarantee of claim approval or coverage." in data["disclaimers"][0]

def test_claims_guidance_reimbursement():
    """Verify that reimbursement claim type returns different documentation and pre-auth guidance."""
    payload = {
        "procedure": "Angioplasty",
        "claim_type": "reimbursement"
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["claim_type"] == "Reimbursement"
    assert any("Reimbursement Claim Form" in doc for doc in data["document_checklist"])
    assert any("Original Discharge Summary" in doc for doc in data["document_checklist"])
    assert any("Submit the complete reimbursement file" in line for line in data["preauth_guidance"])

def test_claims_guidance_unknown_procedure():
    """Verify that an unknown procedure fallback operates correctly without crashing."""
    payload = {
        "procedure": "Dental Filling",
        "claim_type": "cashless"
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["procedure"] == "Dental Filling"
    # General fallback checklist should contain standard checklist items
    assert len(data["document_checklist"]) > 0
    assert any("Check the policy's waiting-period" in cond for cond in data["policy_conditions_to_verify"])

def test_claims_guidance_empty_procedure():
    """Verify that empty/invalid procedure inputs throw validation HTTP 400 errors."""
    payload = {
        "procedure": "   ",
        "claim_type": "cashless"
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

def test_claims_guidance_invalid_claim_type():
    """Verify that unsupported claim types throw validation HTTP 422/400 errors."""
    payload = {
        "procedure": "Angioplasty",
        "claim_type": "invalid_type"
    }
    # Handled by service level ValueError raising checks
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 400
    assert "must be 'cashless' or 'reimbursement'" in response.json()["detail"]

def test_claims_guidance_policy_evidence_missing(dummy_policy_metadata):
    """Verify fallback text is returned if policy metadata is attached but no cached text evidence exists."""
    # Ensure cache is clean for this source
    if "dummy.pdf" in policy_text_cache:
        del policy_text_cache["dummy.pdf"]
        
    payload = {
        "procedure": "Knee Replacement",
        "claim_type": "cashless",
        "policy_metadata": dummy_policy_metadata.model_dump()
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    # Check that fallback message is appended
    assert any("Information not found in the policy document" in cond for cond in data["policy_conditions_to_verify"])
    assert len(data["citations"]) == 0

def test_claims_guidance_policy_evidence_found(dummy_policy_metadata):
    """Verify page citations are retrieved if policy metadata and cached page text are available."""
    # Populate dummy cache
    policy_text_cache["dummy.pdf"] = [
        {"page_number": 1, "text": "Some general introduction text."},
        {"page_number": 3, "text": "This policy imposes a standard pre-existing disease waiting period of 24 months for joint replacement."}
    ]
    
    payload = {
        "procedure": "Knee Replacement",
        "claim_type": "cashless",
        "policy_metadata": dummy_policy_metadata.model_dump()
    }
    response = client.post("/api/claims/guidance", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    # Assert evidence is cited correctly
    assert len(data["citations"]) > 0
    assert data["citations"][0]["page_number"] == 3
    assert "joint replacement" in data["citations"][0]["source_text"]
    assert any("Verified Policy Evidence (Page 3)" in cond for cond in data["policy_conditions_to_verify"])

def test_claims_guidance_no_unsupported_coverage_conclusion():
    """Verify that claims guidance NEVER guarantees coverage approval or draws unsupported decisions."""
    payload = {
        "procedure": "Knee Replacement",
        "claim_type": "cashless"
    }
    response = client.post("/api/claims/guidance", json=payload)
    data = response.json()
    for line in data["preauth_guidance"] + data["policy_conditions_to_verify"] + data["disclaimers"]:
        # Verify it doesn't state absolute approval
        assert "Knee replacement is covered" not in line
        assert "claim will be approved" not in line
        assert "guarantee" not in line.lower() or "NOT a guarantee" in line

def test_claims_guidance_deterministic_repeated():
    """Verify that submitting identical guidance requests yields identical results."""
    payload = {
        "procedure": "Cancer Treatment",
        "claim_type": "reimbursement"
    }
    resp1 = client.post("/api/claims/guidance", json=payload).json()
    resp2 = client.post("/api/claims/guidance", json=payload).json()
    assert resp1 == resp2
