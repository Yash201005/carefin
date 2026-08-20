from fastapi import status


def test_funding_gap_normal(client):
    payload = {
        "total_treatment_cost": 500000.0,
        "insurance_covered_amount": 300000.0,
        "patient_contribution": 50000.0,
        "confirmed_other_assistance": 20000.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["funding_gap"] == 130000.0
    assert data["status"] == "CALCULATED"

def test_funding_gap_boundaries(client):
    # Zero gap
    payload = {
        "total_treatment_cost": 100000.0,
        "insurance_covered_amount": 50000.0,
        "patient_contribution": 50000.0,
        "confirmed_other_assistance": 0.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["funding_gap"] == 0.0

    # Negative calculated gap -> Should return 0
    payload = {
        "total_treatment_cost": 100000.0,
        "insurance_covered_amount": 80000.0,
        "patient_contribution": 30000.0,
        "confirmed_other_assistance": 10000.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["funding_gap"] == 0.0

    # Insurance covers full cost
    payload = {
        "total_treatment_cost": 100000.0,
        "insurance_covered_amount": 100000.0,
        "patient_contribution": 0.0,
        "confirmed_other_assistance": 0.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["funding_gap"] == 0.0

    # Patient covers full cost
    payload = {
        "total_treatment_cost": 100000.0,
        "insurance_covered_amount": 0.0,
        "patient_contribution": 100000.0,
        "confirmed_other_assistance": 0.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["funding_gap"] == 0.0

def test_funding_gap_validation(client):
    # Invalid negative total cost
    payload = {
        "total_treatment_cost": -100.0,
        "insurance_covered_amount": 0.0,
        "patient_contribution": 0.0,
        "confirmed_other_assistance": 0.0
    }
    response = client.post("/api/funding/calculate-gap", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_funding_gap_deterministic(client):
    payload = {
        "total_treatment_cost": 250000.0,
        "insurance_covered_amount": 150000.0,
        "patient_contribution": 20000.0,
        "confirmed_other_assistance": 10000.0
    }
    resp1 = client.post("/api/funding/calculate-gap", json=payload).json()
    resp2 = client.post("/api/funding/calculate-gap", json=payload).json()
    assert resp1 == resp2

def test_crowdfunding_zero_fees(client):
    payload = {
        "required_funding_amount": 100000.0,
        "platform_fee_percentage": 0.0,
        "payment_processing_fee_percentage": 0.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["required_gross_target"] == 100000.0
    assert data["fee_breakdown"]["total_deductions"] == 0.0
    assert data["estimated_net_amount"] == 100000.0

def test_crowdfunding_fees_combinations(client):
    # Single percentage fee (10% platform fee)
    payload = {
        "required_funding_amount": 90000.0,
        "platform_fee_percentage": 10.0,
        "payment_processing_fee_percentage": 0.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["required_gross_target"] == 100000.0
    assert data["fee_breakdown"]["platform_fee"] == 10000.0
    assert data["fee_breakdown"]["total_deductions"] == 10000.0

    # Multiple percentage fees + fixed fee
    payload = {
        "required_funding_amount": 475.0,
        "platform_fee_percentage": 2.0,
        "payment_processing_fee_percentage": 2.5,
        "tax_percentage": 0.5, # Sum of pct = 5%
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["required_gross_target"] == 500.0
    assert data["fee_breakdown"]["platform_fee"] == 10.0
    assert data["fee_breakdown"]["payment_processing_fee"] == 12.5
    assert data["fee_breakdown"]["applicable_taxes"] == 2.5
    assert data["fee_breakdown"]["total_deductions"] == 25.0

    # Combined percentage + fixed fee
    payload = {
        "required_funding_amount": 435.0,
        "platform_fee_percentage": 5.0,
        "payment_processing_fee_percentage": 5.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 15.0 # Net 435 + 15 = 450; Gross = 450 / 0.90 = 500
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["required_gross_target"] == 500.0
    assert data["fee_breakdown"]["fixed_fees"] == 15.0
    assert data["fee_breakdown"]["total_deductions"] == 65.0

def test_crowdfunding_validation(client):
    # Sum of percentages = 100% -> Should raise 400
    payload = {
        "required_funding_amount": 1000.0,
        "platform_fee_percentage": 50.0,
        "payment_processing_fee_percentage": 50.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # Platform fee < 0 -> Should raise 422
    payload = {
        "required_funding_amount": 1000.0,
        "platform_fee_percentage": -5.0,
        "payment_processing_fee_percentage": 0.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # Fixed fee < 0 -> Should raise 422
    payload = {
        "required_funding_amount": 1000.0,
        "platform_fee_percentage": 0.0,
        "payment_processing_fee_percentage": 0.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": -15.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

def test_crowdfunding_deterministic_and_scale(client):
    # Very small amount
    payload = {
        "required_funding_amount": 1.0,
        "platform_fee_percentage": 0.0,
        "payment_processing_fee_percentage": 0.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()["required_gross_target"] == 1.0

    # Large amount
    payload = {
        "required_funding_amount": 10000000.0,
        "platform_fee_percentage": 5.0,
        "payment_processing_fee_percentage": 5.0,
        "tax_percentage": 0.0,
        "fixed_transaction_fee": 0.0
    }
    response = client.post("/api/funding/crowdfunding-calculation", json=payload)
    assert response.status_code == status.HTTP_200_OK
    # Gross = 10000000 / 0.90 = 11111111.11
    assert response.json()["required_gross_target"] == 11111111.11

def test_funding_sources_registry(client):
    response = client.get("/api/funding/sources")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "sources" in data
    assert "platforms" in data
    assert len(data["sources"]) > 0
    assert len(data["platforms"]) > 0

    first_source = data["sources"][0]
    assert "name" in first_source
    assert "category" in first_source
    assert "data_status" in first_source
    assert "limitations" in first_source
