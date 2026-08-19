from fastapi.testclient import TestClient

from app.main import app
from app.services.insurance_advisor import InsuranceAdvisorService

client = TestClient(app)

def test_advisor_dataset_loading():
    """Verify that centralized health plans database is populated."""
    assert len(InsuranceAdvisorService.PLANS_DB) > 0

def test_advisor_valid_request():
    """Verify that valid advisor request evaluates successfully with match status details."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 15000.0,
        "sum_insured": 500000.0,
        "preferred_coverage": "Individual",
        "has_pre_existing_diseases": False,
        "copay_preference": "any",
        "room_rent_preference": "any",
        "deductible_preference": "any"
    }
    response = client.post("/api/insurance/advisor", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
    assert "disclaimer" in data
    assert len(data["results"]) > 0

def test_advisor_invalid_inputs():
    """Verify that boundary check failures for age, budget, family size, etc. raise HTTP 422."""
    # Invalid age
    p_age = {"age": -5, "city": "Mumbai", "family_size": 1, "premium_budget": 1000, "sum_insured": 500000}
    assert client.post("/api/insurance/advisor", json=p_age).status_code == 422

    # Invalid family size
    p_fam = {"age": 30, "city": "Mumbai", "family_size": 25, "premium_budget": 1000, "sum_insured": 500000}
    assert client.post("/api/insurance/advisor", json=p_fam).status_code == 422

    # Invalid budget
    p_bud = {"age": 30, "city": "Mumbai", "family_size": 1, "premium_budget": -100, "sum_insured": 500000}
    assert client.post("/api/insurance/advisor", json=p_bud).status_code == 422

    # Invalid sum insured
    p_si = {"age": 30, "city": "Mumbai", "family_size": 1, "premium_budget": 1000, "sum_insured": -50}
    assert client.post("/api/insurance/advisor", json=p_si).status_code == 422

def test_advisor_location_filtering():
    """Verify city scopes restrict plan availability."""
    # Bharat Suraksha Floater Plan is only Mumbai/Delhi (not Bangalore)
    payload = {
        "age": 30,
        "city": "Bangalore",
        "family_size": 1,
        "premium_budget": 50000.0,
        "sum_insured": 100000.0
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        assert plan["plan_name"] != "Bharat Suraksha Floater Plan"

def test_advisor_budget_and_si_matching():
    """Verify deterministic matching logic based on sum insured and premium budgets."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 15000.0,
        "sum_insured": 1000000.0
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        # Broad plan meets SI
        if plan["plan_name"] == "Optima Premium Care Plan":
            assert "Meets or exceeds requested sum insured coverage." in plan["match_reasons"]
        # Essential plan is below SI
        if plan["plan_name"] == "CareGuard Essential Health Plan":
            assert "Below requested sum insured coverage." in plan["match_reasons"]

def test_advisor_preference_copay_room_rent():
    """Verify co-pay and room rent preferences flag mismatch limitations."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 50000.0,
        "sum_insured": 300000.0,
        "copay_preference": "no_copay",
        "room_rent_preference": "no_limit"
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        if plan["plan_name"] == "CareGuard Essential Health Plan":
            assert plan["match_status"] == "PARTIALLY MATCHED"
            assert "Has co-payment requirement contrary to user preference." in plan["match_reasons"]
            assert "Has room rent sub-limits contrary to user preference." in plan["match_reasons"]

def test_advisor_no_matches_budget():
    """Verify extremely low budget queries classify all plans as DOES NOT MATCH."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 1000.0, # Very low budget
        "sum_insured": 500000.0
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        assert plan["match_status"] == "DOES NOT MATCH"

def test_advisor_deterministic_repeated():
    """Verify recommendations are deterministic and repeated calls return identical values."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 15000.0,
        "sum_insured": 500000.0
    }
    r1 = client.post("/api/insurance/advisor", json=payload).json()
    r2 = client.post("/api/insurance/advisor", json=payload).json()
    assert r1 == r2

def test_advisor_demo_data_labeling():
    """Verify that all recommended plans are labeled with honest demo-data status tags."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 15000.0,
        "sum_insured": 500000.0
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        assert plan["data_status"] == "DEMO_DATA"

def test_advisor_comparison_fields():
    """Verify response payloads contain all relevant comparison attributes."""
    payload = {
        "age": 30,
        "city": "Mumbai",
        "family_size": 1,
        "premium_budget": 15000.0,
        "sum_insured": 500000.0
    }
    resp = client.post("/api/insurance/advisor", json=payload).json()
    for plan in resp["results"]:
        assert "plan_name" in plan
        assert "insurer" in plan
        assert "illustrative_premium" in plan
        assert "sum_insured" in plan
        assert "co_payment" in plan
        assert "deductible" in plan
        assert "room_rent_limit" in plan
        assert "waiting_periods" in plan
        assert "exclusions" in plan
        assert "data_status" in plan
        assert "verification_date" in plan
