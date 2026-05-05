import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def test_dataset_detail_endpoints_expose_schema_preview_health_and_lineage() -> None:
    with TestClient(create_app()) as client:
        token, organization_id, dataset_id = create_processed_dataset(client)
        headers = auth_headers(token)

        columns_response = client.get(
            f"/api/v1/datasets/{dataset_id}/columns",
            headers=headers,
        )
        assert columns_response.status_code == 200
        column_names = {column["name"] for column in columns_response.json()}
        assert {"date", "value"}.issubset(column_names)

        preview_response = client.get(
            f"/api/v1/datasets/{dataset_id}/preview",
            headers=headers,
        )
        assert preview_response.status_code == 200
        assert preview_response.json()[0]["payload"]["value"] == 10

        health_response = client.get(
            f"/api/v1/datasets/{dataset_id}/analytics/health-breakdown",
            headers=headers,
        )
        assert health_response.status_code == 200
        health = health_response.json()
        assert health["score"] > 0
        assert 0 <= health["completeness"] <= 100

        lineage_response = client.get(
            f"/api/v1/datasets/{dataset_id}/lineage",
            headers=headers,
        )
        assert lineage_response.status_code == 200
        lineage = lineage_response.json()
        assert lineage["dataset_id"] == dataset_id
        assert {node["id"] for node in lineage["nodes"]} >= {
            "file",
            "import_job",
            "raw_records",
            "processed_records",
            "analytics",
            "reports",
        }

        members_response = client.get(
            f"/api/v1/organizations/{organization_id}/members",
            headers=headers,
        )
        assert members_response.status_code == 200
        assert members_response.json()[0]["role"] == "OWNER"


def create_processed_dataset(client: TestClient) -> tuple[str, str, str]:
    email = f"details-{uuid4().hex}@example.com"
    register_response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "strong-password",
            "full_name": "Details User",
            "organization_name": f"Details Workspace {uuid4().hex[:8]}",
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
            "name": f"Details Dataset {uuid4().hex[:8]}",
            "description": "Dataset detail endpoint coverage",
            "domain_type": "GENERIC",
        },
    )
    assert dataset_response.status_code == 201
    dataset_id = dataset_response.json()["id"]

    upload_response = client.post(
        f"/api/v1/datasets/{dataset_id}/imports",
        headers=auth_headers(token),
        files={
            "file": (
                "details.csv",
                "date,value\n2026-01-01,10\n2026-01-02,20\n",
                "text/csv",
            )
        },
    )
    assert upload_response.status_code == 201
    return token, organization_id, dataset_id


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
