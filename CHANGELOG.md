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

### Changed

- Frontend build now runs TypeScript in no-emit mode to avoid generated metadata files.
- Database models now include import `updated_at`, processed record row numbers, organization-scoped reports and organization-scoped alerts.
