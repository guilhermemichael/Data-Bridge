import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def test_user_can_generate_and_download_report() -> None:
    with TestClient(create_app()) as client:
        token, dataset_id = create_processed_dataset(client)

        report_response = client.post(
            f"/api/v1/datasets/{dataset_id}/reports",
            headers=auth_headers(token),
            json={"title": "Downloadable Report"},
        )
        assert report_response.status_code == 201
        report_id = report_response.json()["id"]

        unauthenticated_download = client.get(
            f"/api/v1/reports/{report_id}/download",
        )
        assert unauthenticated_download.status_code == 401

        download_response = client.get(
            f"/api/v1/reports/{report_id}/download",
            headers=auth_headers(token),
        )

    assert download_response.status_code == 200
    assert download_response.headers["content-type"] == "application/pdf"
    assert download_response.content.startswith(b"%PDF")


def create_processed_dataset(client: TestClient) -> tuple[str, str]:
    email = f"report-{uuid4().hex}@example.com"
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "strong-password",
            "full_name": "Report User",
            "organization_name": f"Report Workspace {uuid4().hex[:8]}",
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
            "name": f"Report Dataset {uuid4().hex[:8]}",
            "description": "Dataset for report download test",
            "domain_type": "SALES",
        },
    )
    assert dataset_response.status_code == 201
    dataset_id = dataset_response.json()["id"]

    upload_response = client.post(
        f"/api/v1/datasets/{dataset_id}/imports",
        headers=auth_headers(token),
        files={"file": ("sales.csv", "date,value\n2026-01-01,10\n", "text/csv")},
    )
    assert upload_response.status_code == 201
    assert upload_response.json()["status"] == "COMPLETED"
    return token, dataset_id


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
