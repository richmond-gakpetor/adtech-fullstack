from fastapi.testclient import TestClient

from app.main import app


def test_public_registration_rejects_an_admin_account():
    client = TestClient(app)
    payload = {
        "email": "admin@example.com",
        "password": "SecurePass1",
        "user_type": "admin",
        "first_name": "Admin",
        "last_name": "User",
        "phone_number": "0240000000",
    }

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 422
    assert "Admin accounts cannot be created via API" in response.text