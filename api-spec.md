# REST API Specification

This document details the API endpoints, request/response models, and error behaviors for CareFin. All API payloads use JSON format.

---

## 1. Global Errors & Status Codes

All API errors return a standard JSON envelope:
```json
{
  "error_code": "ERROR_CODE_STRING",
  "message": "Human-friendly, calm message explaining the error.",
  "details": {}
}
```

### Standard Status Codes:
* `200 OK`: Successful fetch/read.
* `201 Created`: Successful creation (e.g. upload, policy creation).
* `400 Bad Request`: Input validation failure, missing fields, or incorrect formats.
* `401 Unauthorized`: Missing, expired, or invalid JWT tokens.
* `403 Forbidden`: Insufficient permissions.
* `404 Not Found`: Entity not found (e.g. hospital or procedure).
* `500 Internal Server Error`: Unhandled system failure.

---

## 2. Endpoints

### 2.1 Authentication & Profile
* **POST `/api/auth/register`**
  * Description: Creates a new user profile.
  * Request Body:
    ```json
    {
      "email": "user@example.in",
      "password": "SecurePassword123!",
      "full_name": "Rohan Sharma"
    }
    ```
  * Response (201):
    ```json
    {
      "id": 1,
      "email": "user@example.in",
      "full_name": "Rohan Sharma"
    }
    ```

* **POST `/api/auth/login`**
  * Description: Validates credentials and returns JWT.
  * Request Body:
    ```json
    {
      "email": "user@example.in",
      "password": "SecurePassword123!"
    }
    ```
  * Response (200):
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "token_type": "bearer"
    }
    ```

---

### 2.2 Insurance Management & RAG
* **POST `/api/insurance/policies`**
  * Description: Uploads a policy PDF, runs OCR extraction, and creates a policy profile.
  * Content-Type: `multipart/form-data`
  * Request Body:
    * `file`: (Binary PDF/Image)
  * Response (201):
    ```json
    {
      "policy_id": 10,
      "insurer": "Star Health",
      "policy_name": "Family Health Optima",
      "sum_insured": 500000.00,
      "deductible": 0.00,
      "co_payment_percentage": 10.00,
      "room_rent_limit_percentage": 1.00,
      "waiting_period_months": 24,
      "data_type": "verified",
      "source": "User uploaded policy document (StarHealth_Policy_Rohan.pdf)"
    }
    ```

* **GET `/api/insurance/policies/{policy_id}/explain`**
  * Description: Queries the RAG system to explain specific conditions or rules in the policy.
  * Query Parameters: `query=Is heart surgery covered?`
  * Response (200):
    ```json
    {
      "explanation": "Yes, heart surgery is covered after a 24-month waiting period, subject to co-payment limitations.",
      "citations": [
        {
          "page_number": 4,
          "source_text": "Waiting period for cardiac ailments is 24 consecutive months from policy inception.",
          "verified_at": "2026-08-19T14:00:00Z"
        }
      ]
    }
    ```

---

### 2.3 Healthcare Costs & Out-of-Pocket Calculator
* **GET `/api/costs/search`**
  * Description: Search procedure costs across cities.
  * Query Parameters: `query=Angioplasty`, `city_id=1`
  * Response (200):
    ```json
    [
      {
        "procedure_id": 5,
        "procedure_name": "Angioplasty",
        "average_package_cost": 150000.00,
        "min_package_cost": 120000.00,
        "max_package_cost": 220000.00,
        "data_type": "demo",
        "source": "Demo data — verify with hospital and insurer."
      }
    ]
    ```

* **POST `/api/costs/calculate-oop`**
  * Description: Executes the deterministic out-of-pocket calculator.
  * Request Body:
    ```json
    {
      "hospital_id": 101,
      "procedure_id": 5,
      "policy_id": 10,
      "room_category": "Twin Sharing (Estimated ₹4,000/day)",
      "hospitalization_days": 3
    }
    ```
  * Response (200):
    ```json
    {
      "total_estimated_bill": 162000.00,
      "breakdown": {
        "room_rent_excess": 3000.00,
        "non_payable_consumables": 10000.00,
        "eligible_hospital_cost": 149000.00,
        "deductible_applied": 0.00,
        "co_payment_deducted": 14900.00,
        "total_insurance_payable": 134100.00,
        "out_of_pocket_patient_share": 27900.00
      },
      "room_rent_details": {
        "room_rent_charged": 4000.00,
        "room_rent_policy_limit": 3000.00,
        "excess_per_day": 1000.00
      },
      "data_type": "demo"
    }
    ```

---

### 2.4 Hospitals Network Finder
* **GET `/api/hospitals/search`**
  * Description: Filters centralized hospitals based on active network state, location, specialty, and cashless configuration.
  * Query Parameters: `city_id=1`, `insurer_id=3`, `cashless=true`, `emergency=true`, `specialty=Cardiology`
  * Response (200):
    ```json
    [
      {
        "hospital_id": 101,
        "name": "Fortis Hospital Bengaluru",
        "address": "Bannerghatta Road, Bangalore",
        "specialties": ["Cardiology", "Neurology", "Orthopedics"],
        "network_status": {
          "insurer_id": 3,
          "insurer_name": "Star Health",
          "is_network": true,
          "is_cashless_supported": true
        },
        "has_24x7_emergency": true,
        "data_type": "verified",
        "source": "Star Health Cashless Hospital Network Directory, Q2 2026",
        "last_verified_at": "2026-06-15T00:00:00Z"
      }
    ]
    ```

---

### 2.5 Claims
* **GET `/api/claims`**
  * Description: Fetches claims initiated by the active user.
  * Response (200):
    ```json
    [
      {
        "claim_id": 201,
        "insurer_name": "Star Health",
        "hospital_name": "Fortis Hospital Bengaluru",
        "procedure_name": "Angioplasty",
        "claim_amount": 162000.00,
        "settled_amount": 134100.00,
        "status": "Settled",
        "timeline": [
          { "status": "Submitted", "timestamp": "2026-08-10T10:00:00Z" },
          { "status": "In Review", "timestamp": "2026-08-12T14:30:00Z" },
          { "status": "Approved", "timestamp": "2026-08-14T09:15:00Z" },
          { "status": "Settled", "timestamp": "2026-08-16T17:00:00Z" }
        ]
      }
    ]
    ```

---

### 2.6 Medical Funding & Crowdfunding
* **POST `/api/funding/calculate-disbursement`**
  * Description: Deterministic calculator for crowdfunding platform net payouts.
  * Request Body:
    ```json
    {
      "target_amount": 300000.00,
      "platform": "Milaap"
    }
    ```
  * Response (200):
    ```json
    {
      "platform_name": "Milaap",
      "target_amount": 300000.00,
      "platform_fee_percentage": 0.00,
      "platform_fee_amount": 0.00,
      "payment_gateway_percentage": 2.50,
      "payment_gateway_amount": 7500.00,
      "gst_on_fees": 1350.00,
      "net_disbursement": 291150.00
    }
    ```

---

### 2.7 Fraud & Safety
* **POST `/api/safety/verify-invoice`**
  * Description: Scans medical invoices for inconsistencies.
  * Content-Type: `multipart/form-data`
  * Request Body:
    * `file`: (Image/PDF invoice)
  * Response (200):
    ```json
    {
      "risk_rating": "Medium",
      "anomalies": [
        {
          "field": "Surgical Consumables Package",
          "description": "Consumables charge (₹25,000) is 40% higher than average standard regional cost (₹15,000-₹18,000).",
          "severity": "Warning"
        }
      ],
      "actions_suggested": [
        "Ask the hospital TPA desk for an itemized breakdown of surgical consumables.",
        "Verify if consumables are covered under non-medical extensions of your active policy."
      ]
    }
    ```
