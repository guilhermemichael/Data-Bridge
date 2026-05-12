import os
from uuid import uuid4

os.environ["DATABASE_URL"] = "sqlite+pysqlite:///:memory:"
os.environ["AUTO_CREATE_TABLES"] = "true"
os.environ["CELERY_TASK_ALWAYS_EAGER"] = "true"

from fastapi.testclient import TestClient

from app.main import create_app


def _register(client: TestClient, prefix: str) -> tuple[str, str]:
    email = f"{prefix}-{uuid4().hex}@example.com"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "strong-password",
            "full_name": f"{prefix.title()} User",
            "organization_name": f"{prefix.title()} Workspace",
        },
    )
    assert response.status_code == 201
    return email, response.json()["access_token"]


def test_owner_can_manage_existing_organization_members() -> None:
    with TestClient(create_app()) as client:
        owner_email, owner_token = _register(client, "owner")
        analyst_email, analyst_token = _register(client, "analyst")
        owner_headers = {"Authorization": f"Bearer {owner_token}"}
        analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

        organizations_response = client.get(
            "/api/v1/organizations",
            headers=owner_headers,
        )
        assert organizations_response.status_code == 200
        organization_id = organizations_response.json()[0]["id"]

        add_response = client.post(
            f"/api/v1/organizations/{organization_id}/members",
            headers=owner_headers,
            json={"email": analyst_email, "role": "ANALYST"},
        )
        assert add_response.status_code == 201
        member = add_response.json()
        assert member["role"] == "ANALYST"

        members_response = client.get(
            f"/api/v1/organizations/{organization_id}/members",
            headers=analyst_headers,
        )
        assert members_response.status_code == 200
        member_emails = {item["user_email"] for item in members_response.json()}
        assert {owner_email, analyst_email}.issubset(member_emails)

        update_response = client.patch(
            f"/api/v1/organizations/{organization_id}/members/{member['id']}",
            headers=owner_headers,
            json={"role": "ADMIN"},
        )
        assert update_response.status_code == 200
        assert update_response.json()["role"] == "ADMIN"

        remove_response = client.delete(
            f"/api/v1/organizations/{organization_id}/members/{member['id']}",
            headers=owner_headers,
        )
        assert remove_response.status_code == 204

        removed_access_response = client.get(
            f"/api/v1/organizations/{organization_id}/members",
            headers=analyst_headers,
        )
        assert removed_access_response.status_code == 403


def test_last_owner_membership_is_protected() -> None:
    with TestClient(create_app()) as client:
        _, token = _register(client, "single-owner")
        headers = {"Authorization": f"Bearer {token}"}

        organization_id = client.get(
            "/api/v1/organizations",
            headers=headers,
        ).json()[0]["id"]
        owner_member = client.get(
            f"/api/v1/organizations/{organization_id}/members",
            headers=headers,
        ).json()[0]

        demote_response = client.patch(
            f"/api/v1/organizations/{organization_id}/members/{owner_member['id']}",
            headers=headers,
            json={"role": "ADMIN"},
        )
        assert demote_response.status_code == 400

        remove_self_response = client.delete(
            f"/api/v1/organizations/{organization_id}/members/{owner_member['id']}",
            headers=headers,
        )
        assert remove_self_response.status_code == 400
