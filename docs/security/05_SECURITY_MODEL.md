# Data-Bridge Security Model

## Authentication

Data-Bridge uses JWT access tokens. Passwords are hashed before persistence and never stored as plain text.

## Authorization

The authorization model is organization-scoped RBAC:

- `OWNER`: full control.
- `ADMIN`: manages users, datasets and imports.
- `ANALYST`: imports and analyzes data.
- `VIEWER`: read-only access.

## Upload Protection

Every upload must pass:

- Extension validation.
- MIME type validation.
- Maximum size validation.
- Empty file validation.
- Safe generated storage name.
- Path traversal prevention.

## Secret Handling

Secrets belong in `.env` or deployment secret managers. `.env` is ignored by Git. `.env.example` contains safe placeholders only.

## CORS

CORS origins are configured through `CORS_ORIGINS`. Production deployments should only allow trusted frontend origins.

## SQL Injection

The backend uses SQLAlchemy query construction and parameter binding. Raw SQL should be avoided unless documented and parameterized.

## Logging

Logs must not include passwords, raw tokens or sensitive file contents.
