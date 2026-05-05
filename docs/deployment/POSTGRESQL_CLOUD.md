# Cloud PostgreSQL Setup

## Recommended Providers

For a portfolio demo, use one of:

- Neon
- Supabase
- Railway PostgreSQL
- Render PostgreSQL

## Connection String

Use the SQLAlchemy/psycopg form:

```env
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database?sslmode=require
```

Many managed PostgreSQL providers require SSL. Keep `sslmode=require` when the provider documents it.

## Migration Flow

```bash
cd backend
alembic upgrade head
```

Alembic is the source of truth for database schema creation and evolution.

## Production Rules

- Do not use `AUTO_CREATE_TABLES=true` in production.
- Do not create tables manually from a provider dashboard.
- Do not paste production connection strings into the repository.
- Rotate credentials if a connection string is exposed.

## Validation Queries

After migration, the database should contain the initial Data-Bridge tables:

```text
users
organizations
organization_members
datasets
dataset_columns
import_jobs
raw_records
processed_records
analytics_snapshots
alerts
reports
audit_logs
```
