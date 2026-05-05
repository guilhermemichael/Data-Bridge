# Data-Bridge System Architecture

## Overview

Data-Bridge uses a modular monorepo architecture:

```text
React Frontend
     |
     | JWT bearer token
     |
     v
FastAPI Backend
     |
     +--> PostgreSQL
     |
     +--> Redis
             |
             v
        Celery Worker
```

## Backend Layers

- Routers: HTTP boundary and request validation.
- Services: business rules and orchestration.
- Repositories: database access through SQLAlchemy sessions.
- Integrations: storage and external service adapters.
- Workers: asynchronous processing tasks.

## Data Flow

```text
Upload request
  -> validate file metadata
  -> persist original file
  -> create import job
  -> enqueue worker task
  -> parse file with pandas
  -> detect schema
  -> persist raw records
  -> persist processed records
  -> calculate data health score
  -> save analytics snapshots
  -> evaluate alerts
  -> update import job status
```

## Runtime Services

- `backend`: FastAPI application served by Uvicorn.
- `worker`: Celery worker running data jobs.
- `db`: PostgreSQL 16.
- `redis`: Redis 7 broker.
- `frontend`: Vite development server for React.

Docker Compose wires health checks for PostgreSQL, Redis and the FastAPI health endpoint so dependent services start against ready infrastructure rather than guessed timing.

## Development Tradeoff

For portfolio usability, the backend can auto-create tables in development through `AUTO_CREATE_TABLES=true`. Production deployment should use Alembic migrations as the authoritative schema evolution mechanism.

## Persistence Lifecycle

Schema changes now flow through Alembic:

```text
SQLAlchemy models -> Alembic autogenerate -> migration file -> upgrade head
```

`Base.metadata` is wired into `backend/alembic/env.py`, and the database URL is read from `app.core.config.settings`.

## Verification Commands

```bash
cd backend
python -m pytest
python -m ruff check .

cd ../frontend
npm run build
```

## Module Boundaries

- Auth owns identity, password hashing and JWT creation.
- Organizations own tenant/workspace grouping.
- Datasets own logical data containers.
- Imports own file ingestion state.
- Analytics owns metric snapshots and summaries.
- Alerts own risk and anomaly messages.
- Reports own generated report metadata.
- Audit owns traceability of sensitive operations.

## Frontend Integration

The frontend uses a central API client with JWT bearer token injection. Protected routes redirect unauthenticated users to `/login`, while authenticated users enter `/app` and load workspace metrics from `GET /api/v1/analytics/overview`.

## Demo Workspace

The demo seed script creates a reviewer-ready workspace without bypassing the product flow:

```text
fixtures -> storage copy -> import job -> processing pipeline -> snapshots -> reports -> audit logs
```

Command:

```bash
cd backend
python -m app.scripts.seed_demo
```

The seed is idempotent for the demo user, organization, completed imports and generated reports. It is blocked when `APP_ENV=production`.
