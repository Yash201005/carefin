from fastapi.testclient import TestClient

from app.main import app
from app.services.hospital_data import HospitalDataService

client = TestClient(app)

def test_hospital_dataset_loading():
    """Verify that centralized database loads correctly and is populated."""
    assert len(HospitalDataService.HOSPITALS_DB) > 0
    assert HospitalDataService.HOSPITALS_DB[0]["name"] == "Apex Multi-Specialty Hospital"

def test_hospitals_filter_procedure():
    """Verify that filtering by a valid procedure matches correct hospitals."""
    response = client.get("/api/hospitals/costs?procedure=Cataract Surgery")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    # Every matched record must offer the requested procedure
    for record in data["results"]:
        assert record["cost_details"]["procedure_name"].lower() == "cataract surgery"

def test_hospitals_filter_city():
    """Verify that filtering by a valid city returns matching locations."""
    response = client.get("/api/hospitals/costs?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    for record in data["results"]:
        assert record["city"] == "Mumbai"

def test_hospitals_combined_filters():
    """Verify combined filters restrict results correctly."""
    response = client.get("/api/hospitals/costs?city=Bangalore&procedure=Cancer Treatment")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) == 1
    assert data["results"][0]["name"] == "Silicon City Medical Center"
    assert data["results"][0]["city"] == "Bangalore"

def test_hospitals_filter_specialty():
    """Verify that filtering by specialty matches hospitals offering it."""
    response = client.get("/api/hospitals/costs?specialty=Ophthalmology")
    assert response.status_code == 200
    data = response.json()
    assert len(data["results"]) > 0
    for record in data["results"]:
        assert "Ophthalmology" in record["specialties"]

def test_hospitals_filter_cost_range():
    """Verify that cost range filters constrain outputs properly."""
    # Cataract surgery in Mumbai ranges from 45000 (Apex)
    response = client.get("/api/hospitals/costs?procedure=Cataract Surgery&min_cost=40000&max_cost=48000")
    assert response.status_code == 200
    data = response.json()
    for record in data["results"]:
        cost = record["cost_details"]["estimated_cost"]
        assert 40000 <= cost <= 48000

def test_hospitals_sorting():
    """Verify cost sorting algorithms order outputs correctly."""
    # Ascending sort
    resp_asc = client.get("/api/hospitals/costs?procedure=Angioplasty&sort_by=cost_asc").json()
    costs_asc = [r["cost_details"]["estimated_cost"] for r in resp_asc["results"]]
    assert costs_asc == sorted(costs_asc)

    # Descending sort
    resp_desc = client.get("/api/hospitals/costs?procedure=Angioplasty&sort_by=cost_desc").json()
    costs_desc = [r["cost_details"]["estimated_cost"] for r in resp_desc["results"]]
    assert costs_desc == sorted(costs_desc, reverse=True)

def test_hospitals_unknown_procedure():
    """Verify that filtering by an unknown procedure yields empty result array."""
    response = client.get("/api/hospitals/costs?procedure=Dental Cleaning")
    assert response.status_code == 200
    assert len(response.json()["results"]) == 0

def test_hospitals_unknown_city():
    """Verify that filtering by an unknown city yields empty result array."""
    response = client.get("/api/hospitals/costs?city=Chennai")
    assert response.status_code == 200
    assert len(response.json()["results"]) == 0

def test_hospitals_invalid_cost_range():
    """Verify that negative cost ranges or minimums exceeding maximums raise HTTP 400 errors."""
    # Min greater than Max
    assert client.get("/api/hospitals/costs?min_cost=100&max_cost=50").status_code == 400
    # Negative values
    assert client.get("/api/hospitals/costs?min_cost=-10").status_code == 400

def test_hospitals_deterministic_repeated():
    """Verify query results are deterministic and repeated calls return identical values."""
    url = "/api/hospitals/costs?city=Mumbai&procedure=Angioplasty&sort_by=cost_asc"
    r1 = client.get(url).json()
    r2 = client.get(url).json()
    assert r1 == r2

def test_hospitals_data_transparency_labeling():
    """Verify that all records are explicitly labeled with honest status badges (DEMO_DATA)."""
    response = client.get("/api/hospitals/costs")
    assert response.status_code == 200
    data = response.json()
    for record in data["results"]:
        # Verify it doesn't state absolute verified status unless verified data exists
        assert record["cost_details"]["data_status"] == "DEMO_DATA"

def test_hospitals_no_fake_network_claims():
    """Verify that hospital metadata does NOT contain fake network/cashless authorizations claims."""
    # Explicitly verify no keys claiming network statuses are bundled in response records
    response = client.get("/api/hospitals/costs")
    data = response.json()
    for record in data["results"]:
        assert "network_status" not in record
        assert "cashless_verified" not in record
