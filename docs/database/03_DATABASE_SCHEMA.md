# Data-Bridge Database Schema

## Migration Strategy

Alembic is the authoritative migration tool for Data-Bridge. Development may use SQLAlchemy auto-create for quick bootstrapping, but PostgreSQL, CI and production should apply schema changes with:

```bash
cd backend
alembic upgrade head
```

The initial migration creates the core operational schema and can be validated locally with:

```bash
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

## Core Tables

### users

Stores identity and login information.

- `id`
- `email`
- `password_hash`
- `full_name`
- `is_active`
- `created_at`
- `updated_at`

### organizations

Represents a company, team or workspace.

- `id`
- `name`
- `slug`
- `created_at`
- `updated_at`

### organization_members

Connects users to organizations with a role.

- `id`
- `user_id`
- `organization_id`
- `role`
- `created_at`

Roles:

- `OWNER`
- `ADMIN`
- `ANALYST`
- `VIEWER`

### datasets

Represents a logical collection of operational data.

- `id`
- `organization_id`
- `name`
- `description`
- `domain_type`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### import_jobs

Tracks every file import.

- `id`
- `dataset_id`
- `uploaded_by`
- `original_filename`
- `stored_filename`
- `file_size_bytes`
- `mime_type`
- `status`
- `error_message`
- `total_rows`
- `valid_rows`
- `invalid_rows`
- `health_score`
- `started_at`
- `finished_at`
- `created_at`
- `updated_at`

### dataset_columns

Stores detected schema metadata.

- `id`
- `dataset_id`
- `import_job_id`
- `name`
- `detected_type`
- `nullable`
- `sample_values`
- `created_at`

### raw_records

Stores raw row payloads for audit and reprocessing.

- `id`
- `import_job_id`
- `row_number`
- `payload`
- `created_at`

### processed_records

Stores normalized row payloads.

- `id`
- `dataset_id`
- `import_job_id`
- `row_number`
- `payload`
- `quality_score`
- `created_at`

### analytics_snapshots

Stores calculated metrics.

- `id`
- `dataset_id`
- `metric_key`
- `metric_value`
- `dimensions`
- `calculated_at`

### alerts

Stores generated operational and data quality alerts.

- `id`
- `organization_id`
- `dataset_id`
- `type`
- `severity`
- `title`
- `message`
- `metadata`
- `status`
- `triggered_at`
- `resolved_at`
- `created_at`

### reports

Stores generated report metadata.

- `id`
- `organization_id`
- `dataset_id`
- `generated_by`
- `title`
- `file_path`
- `status`
- `error_message`
- `created_at`
- `finished_at`

### audit_logs

Stores sensitive actions and operational events.

- `id`
- `organization_id`
- `user_id`
- `action`
- `entity_type`
- `entity_id`
- `metadata`
- `ip_address`
- `user_agent`
- `created_at`

## Indexing Plan

- `users.email` unique.
- `organizations.slug` unique.
- `organization_members.user_id`.
- `organization_members.organization_id`.
- `datasets.organization_id`.
- `import_jobs.dataset_id`.
- `processed_records.dataset_id`.
- `analytics_snapshots.dataset_id`.
- `alerts.dataset_id`.
- `audit_logs.organization_id`.
