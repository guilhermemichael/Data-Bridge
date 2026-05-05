import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.database.models import OrganizationMember
from app.database.session import SessionLocal
from app.main import create_app


def test_upload_rejects_unsupported_extension() -> None:
    with TestClient(create_app()) as client:
        token, organization_id = register_user(client)
        dataset_id = create_dataset(client, token, organization_id)

        response = client.post(
            f"/api/v1/datasets/{dataset_id}/imports",
            headers=auth_headers(token),
            files={"file": ("malware.exe", "not,a,dataset", "text/plain")},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file extension."


def test_upload_sanitizes_path_traversal_filename() -> None:
    with TestClient(create_app()) as client:
        token, organization_id = register_user(client)
        dataset_id = create_dataset(client, token, organization_id)

        response = client.post(
            f"/api/v1/datasets/{dataset_id}/imports",
            headers=auth_headers(token),
            files={
                "file": (
                    "../../sales.csv",
                    "date,value\n2026-01-01,10\n",
                    "text/csv",
                )
            },
        )

    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "COMPLETED"
    assert body["original_filename"] == "sales.csv"
    assert ".." not in body["stored_filename"]
    assert "/" not in body["stored_filename"]
    assert "\\" not in body["stored_filename"]


def test_viewer_cannot_upload_dataset_imports() -> None:
    with TestClient(create_app()) as client:
        owner_token, organization_id = register_user(client)
        dataset_id = create_dataset(client, owner_token, organization_id)

        viewer_token, _ = register_user(client)
        viewer_id = client.get(
            "/api/v1/auth/me",
            headers=auth_headers(viewer_token),
        ).json()["id"]

        with SessionLocal() as db:
            db.add(
                OrganizationMember(
                    user_id=viewer_id,
                    organization_id=organization_id,
                    role="VIEWER",
                )
            )
            db.commit()

        response = client.post(
            f"/api/v1/datasets/{dataset_id}/imports",
            headers=auth_headers(viewer_token),
            files={"file": ("sales.csv", "date,value\n2026-01-01,10\n", "text/csv")},
        )

    assert response.status_code == 403
    assert response.json()["detail"] == "Insufficient role for this operation."


def register_user(client: TestClient) -> tuple[str, str]:
    email = f"upload-{uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "strong-password",
            "full_name": "Upload User",
            "organization_name": f"Upload Workspace {uuid4().hex[:8]}",
        },
    )
    assert response.status_code == 201
    token = response.json()["access_token"]

    organizations_response = client.get(
        "/api/v1/organizations",
        headers=auth_headers(token),
    )
    assert organizations_response.status_code == 200
    return token, organizations_response.json()[0]["id"]


def create_dataset(client: TestClient, token: str, organization_id: str) -> str:
    response = client.post(
        "/api/v1/datasets",
        headers=auth_headers(token),
        json={
            "organization_id": organization_id,
            "name": f"Dataset {uuid4().hex[:8]}",
            "description": "Upload validation dataset",
            "domain_type": "SALES",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}
