# Data-Bridge Deployment Guide

## Recommended Portfolio Topology

```text
Vercel Frontend -> Render/Railway/Fly.io Backend -> Managed PostgreSQL
                                               -> Managed Redis
```

The project is cloud-ready, but production deployment must be configured with real provider credentials and environment variables outside the repository.

## Backend Service

Recommended platform options:

- Render Web Service
- Railway Service
- Fly.io App

Backend build command:

```bash
pip install -e ".[dev]"
```

Backend start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Production health check:

```text
GET /api/v1/health
```

## Backend Environment Variables

```env
APP_ENV=production
APP_DEBUG=false
AUTO_CREATE_TABLES=false
DATABASE_URL=postgresql+psycopg://user:password@host:5432/database?sslmode=require
REDIS_URL=redis://user:password@host:6379/0
JWT_SECRET_KEY=replace-with-a-long-random-secret
CORS_ORIGINS=https://your-frontend-domain.vercel.app
UPLOAD_DIR=/app/storage/uploads
REPORT_DIR=/app/storage/reports
STORAGE_BACKEND=local
CELERY_TASK_ALWAYS_EAGER=false
```

Rules:

- Never use SQLite in production.
- Never commit production secrets.
- Keep `APP_DEBUG=false`.
- Keep `AUTO_CREATE_TABLES=false` and run Alembic migrations.
- Restrict `CORS_ORIGINS` to the deployed frontend URL.
- Use persistent storage for `UPLOAD_DIR` and `REPORT_DIR`.

## Database Migrations

Run migrations after provisioning the database and before opening the demo:

```bash
cd backend
alembic upgrade head
```

Do not create production tables manually.

## Worker

If the hosting platform supports a background worker, run:

```bash
celery -A app.workers.celery_app.celery_app worker --loglevel=INFO
```

For a constrained portfolio demo, document when the backend is running with eager tasks instead of a separate worker.

## Frontend Service

Recommended platform:

- Vercel

Frontend settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Frontend environment variable:

```env
VITE_API_BASE_URL=https://your-backend-domain.com/api/v1
```

Vite reads client environment variables at build time, so set this variable before building the frontend.

## Verification

After deployment:

```text
1. Open backend /api/v1/health.
2. Open backend /docs.
3. Open frontend URL.
4. Register or use demo credentials when available.
5. Create/load a dataset.
6. Upload a file.
7. Confirm dashboard, alerts, reports and audit logs update.
```

## Troubleshooting

- `401` in the frontend usually means the access token expired or the API rejected it.
- CORS errors usually mean `CORS_ORIGINS` does not match the exact frontend origin.
- Database SSL errors usually mean the cloud provider requires `sslmode=require`.
- Missing report downloads usually mean storage is ephemeral or `REPORT_DIR` is not writable.
