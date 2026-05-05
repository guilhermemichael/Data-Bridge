import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def test_user_can_register_login_and_read_profile() -> None:
    with TestClient(create_app()) as client:
        email = f"auth-{uuid4().hex}@example.com"
        payload = {
            "email": email,
            "password": "strong-password",
            "full_name": "Auth User",
            "organization_name": "Auth Workspace",
        }

        register_response = client.post("/api/v1/auth/register", json=payload)
        assert register_response.status_code == 201
        token = register_response.json()["access_token"]

        duplicate_response = client.post("/api/v1/auth/register", json=payload)
        assert duplicate_response.status_code == 409

        bad_login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "wrong-password"},
        )
        assert bad_login_response.status_code == 401

        login_response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "strong-password"},
        )
        assert login_response.status_code == 200
        assert login_response.json()["token_type"] == "bearer"

        me_without_token = client.get("/api/v1/auth/me")
        assert me_without_token.status_code == 401

        me_response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert me_response.status_code == 200
        assert me_response.json()["email"] == email
