# Data-Bridge System Architecture

## Overview

Data-Bridge uses a modular monorepo architecture:

```text
React Frontend
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

## Development Tradeoff

For portfolio usability, the backend can auto-create tables in development through `AUTO_CREATE_TABLES=true`. Production deployment should use Alembic migrations as the authoritative schema evolution mechanism.

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
