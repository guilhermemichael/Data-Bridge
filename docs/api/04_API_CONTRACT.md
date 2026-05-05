# Data-Bridge API Contract

Base path:

```text
/api/v1
```

## Health

- `GET /health`

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

## Organizations

- `POST /organizations`
- `GET /organizations`
- `GET /organizations/{organization_id}`

## Datasets

- `POST /datasets`
- `GET /datasets`
- `GET /datasets/{dataset_id}`
- `PATCH /datasets/{dataset_id}`
- `DELETE /datasets/{dataset_id}`

## Imports

- `POST /datasets/{dataset_id}/imports`
- `GET /imports/{import_id}`
- `GET /datasets/{dataset_id}/imports`

## Analytics

- `GET /datasets/{dataset_id}/analytics/summary`
- `GET /datasets/{dataset_id}/analytics/timeseries`

## Alerts

- `GET /alerts`
- `PATCH /alerts/{alert_id}/resolve`

## Reports

- `POST /datasets/{dataset_id}/reports`
- `GET /reports`
- `GET /reports/{report_id}/download`

## Audit

- `GET /audit-logs`

## Authentication

Protected endpoints use:

```http
Authorization: Bearer <access_token>
```
