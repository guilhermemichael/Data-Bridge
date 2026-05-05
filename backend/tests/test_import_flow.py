import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def test_user_can_import_csv_and_read_analytics() -> None:
    with TestClient(create_app()) as client:
        email = f"user-{uuid4().hex}@example.com"
        register_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": email,
                "password": "strong-password",
                "full_name": "Data Analyst",
                "organization_name": "Acme Operations",
            },
        )
        assert register_response.status_code == 201
        token = register_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        organizations_response = client.get("/api/v1/organizations", headers=headers)
        assert organizations_response.status_code == 200
        organization_id = organizations_response.json()[0]["id"]

        dataset_response = client.post(
            "/api/v1/datasets",
            headers=headers,
            json={
                "organization_id": organization_id,
                "name": "Sales",
                "description": "Monthly sales import",
                "domain_type": "SALES",
            },
        )
        assert dataset_response.status_code == 201
        dataset_id = dataset_response.json()["id"]

        csv_content = (
            "date,product,quantity,unit_price,city\n"
            "2026-01-01,Notebook,2,3500,Sao Paulo\n"
            "2026-01-15,Mouse,10,80,Rio de Janeiro\n"
            "2026-02-01,Keyboard,3,250,Curitiba\n"
        )
        upload_response = client.post(
            f"/api/v1/datasets/{dataset_id}/imports",
            headers=headers,
            files={"file": ("sales.csv", csv_content, "text/csv")},
        )
        assert upload_response.status_code == 201
        assert upload_response.json()["status"] == "COMPLETED"
        assert upload_response.json()["total_rows"] == 3

        summary_response = client.get(
            f"/api/v1/datasets/{dataset_id}/analytics/summary",
            headers=headers,
        )
        assert summary_response.status_code == 200
        metric_keys = {item["key"] for item in summary_response.json()["metrics"]}
        assert "row_count" in metric_keys
        assert "health_score" in metric_keys

        reports_response = client.post(
            f"/api/v1/datasets/{dataset_id}/reports",
            headers=headers,
            json={"title": "Sales Report"},
        )
        assert reports_response.status_code == 201

        overview_response = client.get("/api/v1/analytics/overview", headers=headers)
        assert overview_response.status_code == 200
        overview = overview_response.json()
        assert overview["active_datasets"] == 1
        assert overview["processed_imports"] == 1
        assert overview["generated_reports"] == 1
        assert overview["average_data_health_score"] > 0
        assert len(overview["recent_imports"]) == 1

        imports_response = client.get("/api/v1/imports/recent", headers=headers)
        assert imports_response.status_code == 200
        assert imports_response.json()[0]["status"] == "COMPLETED"
