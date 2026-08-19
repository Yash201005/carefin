from unittest.mock import MagicMock

from fastapi import status


def test_healthcheck_success(client):
    """
    Verify /api/health returns 200 and healthy markers when db is responsive.
    """
    response = client.get("/api/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_healthcheck_database_offline(client, db_session):
    """
    Verify /api/health returns 503 if the database fails to execute query.
    """
    # Mock database execute to raise connection exception
    original_execute = db_session.execute
    db_session.execute = MagicMock(side_effect=Exception("Database offline"))

    response = client.get("/api/health")
    assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
    data = response.json()
    assert "detail" in data
    assert "Database connection failure" in data["detail"]

    # Restore database execute
    db_session.execute = original_execute
