from fastapi import status


def test_scheme_reference_registry(client):
    """
    Verify GET /api/schemes returns all reference schemes with proper disclaimers.
    """
    response = client.get("/api/schemes")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "schemes" in data
    assert "disclaimer" in data
    assert len(data["schemes"]) >= 4
    
    # Check schema parameters exist
    first_scheme = data["schemes"][0]
    assert "name" in first_scheme
    assert "category" in first_scheme
    assert "official_source" in first_scheme
    assert "verification_date" in first_scheme
    assert "data_status" in first_scheme
    assert "required_documents" in first_scheme

def test_schemes_filtering_and_behavior(client):
    """
    Verify multiple query parameters in GET /api/schemes use AND logic.
    """
    # 1. Query for Maharashtra + Angioplasty (Should return MJPJAY, maybe PMJAY)
    response = client.get("/api/schemes?state=Maharashtra&procedure=Angioplasty")
    assert response.status_code == status.HTTP_200_OK
    schemes = response.json()["schemes"]
    assert len(schemes) > 0
    names = [s["name"] for s in schemes]
    assert any("Mahatma Jyotiba Phule" in n for n in names)
    # CareFin Demo State Health Scheme (Karnataka) must NOT be here
    assert not any("Demo State Health Scheme" in n for n in names)

    # 2. Mismatched combination (Maharashtra + Cataract Surgery where income limit is violated)
    # The Karnataka Demo State Health Scheme is not in Maharashtra, and MJPJAY doesn't support Cataract Surgery (only Ortho/Cardio/etc. in our mock)
    response = client.get("/api/schemes?state=Maharashtra&procedure=Cataract Surgery&max_income=200000")
    assert response.status_code == status.HTTP_200_OK
    schemes = response.json()["schemes"]
    names = [s["name"] for s in schemes]
    assert not any("Mahatma Jyotiba Phule" in n for n in names)

def test_valid_screening_match(client):
    """
    Verify POST /api/schemes/match returns correct response structure.
    """
    payload = {
        "age": 35,
        "state": "Maharashtra",
        "income": 75000.0,
        "family_size": 4,
        "occupation": "Farmer",
        "treatment_procedure": "Angioplasty",
        "hospitalization_required": True,
        "existing_insurance": False
    }
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "query_params" in data
    assert "results" in data
    assert "disclaimer" in data

def test_validation_invalid_age(client):
    """
    Verify age bounds validation.
    """
    # Age below 0
    response = client.post("/api/schemes/match", json={"age": -5})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Age above 120
    response = client.post("/api/schemes/match", json={"age": 125})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_validation_invalid_family_size(client):
    """
    Verify family size bounds validation.
    """
    # family size 0
    response = client.post("/api/schemes/match", json={"family_size": 0})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # family size above 30
    response = client.post("/api/schemes/match", json={"family_size": 35})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_validation_invalid_income(client):
    """
    Verify negative income validation.
    """
    response = client.post("/api/schemes/match", json={"income": -100.0})
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_state_matching_and_mismatch(client):
    """
    Verify state matching and mismatch behavior.
    """
    # Maharashtra resident -> MJPJAY matches state
    payload = {"state": "Maharashtra"}
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    mjpjay = next(r for r in results if r["scheme"]["id"] == "scheme_003")
    assert any("State matches" in cond for cond in mjpjay["matched_conditions"])
    assert not mjpjay["mismatched_conditions"]

    # Delhi resident -> MJPJAY state mismatch
    payload = {"state": "Delhi"}
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    mjpjay = next(r for r in results if r["scheme"]["id"] == "scheme_003")
    assert any("does not match" in cond for cond in mjpjay["mismatched_conditions"])

def test_procedure_matching_and_mismatch(client):
    """
    Verify procedure matching and mismatch behavior.
    """
    # Covered procedure: Angioplasty for PM-JAY
    payload = {"treatment_procedure": "Angioplasty"}
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    pmjay = next(r for r in results if r["scheme"]["id"] == "scheme_001")
    assert any("is covered" in cond for cond in pmjay["matched_conditions"])
    assert not pmjay["mismatched_conditions"]

    # Uncovered procedure: Cosmetic Surgery
    payload = {"treatment_procedure": "Cosmetic Surgery"}
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    pmjay = next(r for r in results if r["scheme"]["id"] == "scheme_001")
    assert any("is not covered" in cond for cond in pmjay["mismatched_conditions"])

def test_insufficient_information(client):
    """
    Verify that providing no inputs yields INSUFFICIENT INFORMATION screening status.
    """
    payload = {}
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    for r in results:
        assert r["screening_status"] == "INSUFFICIENT INFORMATION"

def test_potentially_eligible_result(client):
    """
    Verify conditions that produce POTENTIALLY ELIGIBLE.
    """
    # Scheme 004 CareFin Demo Scheme requires age 18-65, income <= 1,20,000, Karnataka state, Cataract, hospitalization=True
    payload = {
        "age": 30,
        "state": "Karnataka",
        "income": 90000.0,
        "treatment_procedure": "Cataract Surgery",
        "hospitalization_required": True
    }
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    demo_scheme = next(r for r in results if r["scheme"]["id"] == "scheme_004")
    assert demo_scheme["screening_status"] == "POTENTIALLY ELIGIBLE"
    assert not demo_scheme["mismatched_conditions"]
    assert not demo_scheme["unverified_conditions"]

def test_possible_match_result(client):
    """
    Verify conditions that produce POSSIBLY ELIGIBLE (some match, some unknown, zero mismatches).
    """
    # State is Karnataka, Cataract, hospitalization is True, but age and income are missing
    payload = {
        "state": "Karnataka",
        "treatment_procedure": "Cataract Surgery",
        "hospitalization_required": True
    }
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    demo_scheme = next(r for r in results if r["scheme"]["id"] == "scheme_004")
    assert demo_scheme["screening_status"] == "POSSIBLY ELIGIBLE"
    assert len(demo_scheme["matched_conditions"]) > 0
    assert len(demo_scheme["unverified_conditions"]) > 0
    assert not demo_scheme["mismatched_conditions"]

def test_does_not_match_result(client):
    """
    Verify conditions that produce DOES NOT APPEAR TO MATCH.
    """
    # Karnataka demo scheme is for Karnataka, user is in Maharashtra
    payload = {
        "state": "Maharashtra"
    }
    response = client.post("/api/schemes/match", json=payload)
    assert response.status_code == status.HTTP_200_OK
    results = response.json()["results"]
    demo_scheme = next(r for r in results if r["scheme"]["id"] == "scheme_004")
    assert demo_scheme["screening_status"] == "DOES NOT APPEAR TO MATCH"
    assert len(demo_scheme["mismatched_conditions"]) > 0

def test_deterministic_repeated_results(client):
    """
    Verify matching runs are deterministic and return identical results.
    """
    payload = {
        "age": 40,
        "state": "Karnataka",
        "income": 100000.0,
        "treatment_procedure": "Cataract Surgery",
        "hospitalization_required": True
    }
    response1 = client.post("/api/schemes/match", json=payload).json()
    response2 = client.post("/api/schemes/match", json=payload).json()
    assert response1 == response2

def test_source_and_status_metadata(client):
    """
    Verify source and data status properties are present on results.
    """
    payload = {"state": "Maharashtra"}
    response = client.post("/api/schemes/match", json=payload)
    results = response.json()["results"]
    
    for r in results:
        scheme = r["scheme"]
        assert "official_source" in scheme
        assert "verification_date" in scheme
        assert "data_status" in scheme
        assert scheme["data_status"] in ["VERIFIED SOURCE", "REFERENCE INFORMATION", "DEMO DATA", "NOT AVAILABLE"]
