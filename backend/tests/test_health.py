from fastapi.testclient import TestClient

from app.main import app


def test_health_endpoint_reports_service_status():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["status"] == "healthy"