from fastapi import status


def test_auth_registration_and_login(client):
    # 1. Sign up user
    payload = {
        "username": "user1",
        "email": "user1@carefin.com",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["username"] == "user1"
    assert data["email"] == "user1@carefin.com"
    assert "hashed_password" not in data

    # 2. Duplicate registration (username)
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Login success
    login_payload = {
        "username_or_email": "user1",
        "password": "securepassword123"
    }
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == status.HTTP_200_OK
    token_data = response.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # 4. Login fail (bad password)
    login_payload["password"] = "wrongpassword"
    response = client.post("/api/auth/login", json=login_payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # 5. Logout
    response = client.post("/api/auth/logout")
    assert response.status_code == status.HTTP_200_OK

def test_protected_routes_unauthenticated(client):
    # Unauthenticated fetch documents -> should raise 401
    response = client.get("/api/documents")
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    # Unauthenticated save calculation -> should raise 401
    response = client.post("/api/calculations", json={})
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

def test_authorization_cross_user_isolation(client):
    # Create two users and generate tokens
    user_a = {"username": "usera", "email": "usera@carefin.com", "password": "passwordA"}
    user_b = {"username": "userb", "email": "userb@carefin.com", "password": "passwordB"}
    
    client.post("/api/auth/register", json=user_a)
    client.post("/api/auth/register", json=user_b)

    token_a = client.post("/api/auth/login", json={"username_or_email": "usera", "password": "passwordA"}).json()["access_token"]
    token_b = client.post("/api/auth/login", json={"username_or_email": "userb", "password": "passwordB"}).json()["access_token"]

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A uploads a document
    file_data = {"document_type": "Medical Bill"}
    files = {"file": ("bill.pdf", b"%PDF-1.4 mock pdf contents", "application/pdf")}
    doc_response = client.post("/api/documents", data=file_data, files=files, headers=headers_a)
    assert doc_response.status_code == status.HTTP_201_CREATED
    doc_id = doc_response.json()["id"]

    # 1. User B tries to view User A's documents
    docs_b = client.get("/api/documents", headers=headers_b).json()
    assert len(docs_b) == 0 # User B sees empty list, does not see User A's document

    # 2. User B tries to delete User A's document -> should raise 403
    del_response = client.delete(f"/api/documents/{doc_id}", headers=headers_b)
    assert del_response.status_code == status.HTTP_403_FORBIDDEN

    # User A saves a calculation
    calc_payload = {
        "calculation_type": "OOP",
        "input_values": {"treatment_cost": 50000},
        "output_values": {"oop_share": 10000},
        "reference_metadata": "Demo calculation"
    }
    calc_response = client.post("/api/calculations", json=calc_payload, headers=headers_a)
    assert calc_response.status_code == status.HTTP_201_CREATED
    calc_id = calc_response.json()["id"]

    # 3. User B tries to view User A's calculations
    calcs_b = client.get("/api/calculations", headers=headers_b).json()
    assert len(calcs_b) == 0

    # 4. User B tries to delete User A's calculation -> should raise 403
    del_calc_response = client.delete(f"/api/calculations/{calc_id}", headers=headers_b)
    assert del_calc_response.status_code == status.HTTP_403_FORBIDDEN

def test_document_upload_validations(client):
    # Register and login
    user = {"username": "uploader", "email": "uploader@carefin.com", "password": "password123"}
    client.post("/api/auth/register", json=user)
    token = client.post("/api/auth/login", json={"username_or_email": "uploader", "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Invalid extension (e.g. executable)
    files = {"file": ("hack.exe", b"MZexecutable...", "application/octet-stream")}
    response = client.post("/api/documents", data={"document_type": "Other"}, files=files, headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 2. Invalid magic bytes (disguised PDF starting with MZ executable header)
    files = {"file": ("disguised.pdf", b"MZ\x90\x00\x03\x00\x00\x00", "application/pdf")}
    response = client.post("/api/documents", data={"document_type": "Insurance Policy"}, files=files, headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

    # 3. Path traversal attack filename (ensure it sanitizes path traversal to base name)
    files = {"file": ("../../../../etc/passwd.pdf", b"%PDF-1.4 file...", "application/pdf")}
    response = client.post("/api/documents", data={"document_type": "Prescription"}, files=files, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["filename"] == "passwd.pdf"  # Traversal segment stripped out

    # 4. Oversized upload (size exceeds 10MB)
    large_content = b"%PDF" + b"x" * (10 * 1024 * 1024 + 100)
    files = {"file": ("large.pdf", large_content, "application/pdf")}
    response = client.post("/api/documents", data={"document_type": "Other"}, files=files, headers=headers)
    assert response.status_code == status.HTTP_400_BAD_REQUEST

def test_saved_calculations_lifecycle(client):
    # Register and login
    user = {"username": "calcuser", "email": "calcuser@carefin.com", "password": "password123"}
    client.post("/api/auth/register", json=user)
    token = client.post("/api/auth/login", json={"username_or_email": "calcuser", "password": "password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Save calculation
    payload = {
        "calculation_type": "FUNDING_GAP",
        "input_values": {"cost": 100000, "insurance": 50000},
        "output_values": {"gap": 50000},
        "reference_metadata": "GAP analysis"
    }
    response = client.post("/api/calculations", json=payload, headers=headers)
    assert response.status_code == status.HTTP_201_CREATED
    calc_id = response.json()["id"]

    # 2. Retrieve own calculation
    list_response = client.get("/api/calculations", headers=headers)
    assert list_response.status_code == status.HTTP_200_OK
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["calculation_type"] == "FUNDING_GAP"
    assert list_response.json()[0]["input_values"]["cost"] == 100000

    # 3. Delete own calculation
    del_response = client.delete(f"/api/calculations/{calc_id}", headers=headers)
    assert del_response.status_code == status.HTTP_200_OK

    # 4. Confirm deleted
    assert len(client.get("/api/calculations", headers=headers).json()) == 0
