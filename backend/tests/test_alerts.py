import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def test_import_generates_quality_duplicate_and_anomaly_alerts() -> None:
    with TestClient(create_app()) as client:
        token, dataset_id = create_dataset(client)
        headers = auth_headers(token)

        csv_content = (
            "date,value,category\n"
            "2026-01-01,10,A\n"
            "2026-01-01,10,A\n"
            "2026-01-02,11,A\n"
            "2026-01-03,12,\n"
            "2026-01-04,13,\n"
            "2026-01-05,5000,\n"
            "2026-01-06,,\n"
            "2026-01-07,,A\n"
        )
        upload_response = client.post(
            f"/api/v1/datasets/{dataset_id}/imports",
            headers=headers,
            files={"file": ("alerts.csv", csv_content, "text/csv")},
        )
        assert upload_response.status_code == 201

        alerts_response = client.get("/api/v1/alerts", headers=headers)
        assert alerts_response.status_code == 200
        alert_types = {alert["type"] for alert in alerts_response.json()}

    assert "HIGH_NULL_RATE" in alert_types
    assert "HIGH_DUPLICATE_RATE" in alert_types
    assert "ANOMALY_DETECTED" in alert_types


def create_dataset(client: TestClient) -> tuple[str, str]:
    email = f"alerts-{uuid4().hex}@example.com"
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "strong-password",
            "full_name": "Alert User",
            "organization_name": f"Alert Workspace {uuid4().hex[:8]}",
        },
    )
    assert register_response.status_code == 201
    token = register_response.json()["access_token"]

    organizations_response = client.get(
        "/api/v1/organizations",
        headers=auth_headers(token),
    )
    organization_id = organizations_response.json()[0]["id"]

    dataset_response = client.post(
        "/api/v1/datasets",
        headers=auth_headers(token),
        json={
            "organization_id": organization_id,
            "name": f"Alert Dataset {uuid4().hex[:8]}",
            "description": "Dataset for alert coverage",
            "domain_type": "GENERIC",
        },
    )
    assert dataset_response.status_code == 201
    return token, dataset_response.json()["id"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
