# Changelog

All notable changes to Data-Bridge will be documented in this file.

## [Unreleased]

### Added

- Initial repository structure.
- FastAPI backend foundation.
- React dashboard foundation.
- Docker Compose local environment.
- Technical documentation baseline.
- Alembic migration environment and initial Data-Bridge schema migration.
- JWT authentication, organizations and datasets.
- CSV/XLSX/JSON import job processing.
- Data Health Score and analytics snapshots.
- Alert, report and audit log APIs.
- Organization-scoped analytics overview endpoint for dashboard metrics.
- Frontend dashboard shell with metrics, charts, imports and alerts.
- Frontend API client, JWT token handling, login, registration and protected dashboard routing.
- Dashboard cards, chart and recent imports table connected to the analytics overview API.
- Authenticated dataset management page with API-backed list and create flow.
- Organization-scoped imports listing and recent imports endpoints.
- Authenticated upload interface with frontend file validation and import status polling.
- Frontend APIs and authenticated pages for alerts, reports and audit logs.
- Authenticated PDF report download flow through the shared API client.
- Demo workspace seed script with sales, inventory and support fixtures.
- Backend tests for authentication, upload validation, RBAC and report download.
- Unified CI workflow for backend linting, migrations, tests and frontend build.

### Changed

- Frontend build now runs TypeScript in no-emit mode to avoid generated metadata files.
- Database models now include import `updated_at`, processed record row numbers, organization-scoped reports and organization-scoped alerts.
- Separate backend and frontend workflows were consolidated into `.github/workflows/ci.yml`.
