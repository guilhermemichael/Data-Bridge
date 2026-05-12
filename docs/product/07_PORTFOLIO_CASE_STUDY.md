# Data-Bridge Portfolio Case Study

## One-Line Pitch

Data-Bridge is a Python-first operational BI platform that transforms raw CSV, XLSX and JSON business files into validated datasets, dashboards, alerts, PDF reports and audit trails.

## Problem

Small and mid-sized teams often run operations through disconnected spreadsheets for sales, inventory and support. Those files usually have inconsistent schemas, missing values, duplicates, manual reporting and no audit trail.

## Solution

Data-Bridge creates a controlled path from raw operational files to decision-ready intelligence:

```text
Upload -> validation -> schema detection -> processing -> persistence -> analytics -> alerts -> PDF reports -> audit logs
```

## Demo Flow

1. Sign in with the demo user.
2. Open the operational dashboard.
3. Review active datasets and processed imports.
4. Open the dataset cockpit.
5. Inspect schema, preview, lineage and Data Health breakdown.
6. Review alerts, reports and audit logs.
7. Download a generated PDF report.

Demo credentials:

```text
Email: demo@databridge.dev
Password: Demo@123456
```

## Technical Scope

- FastAPI API with JWT authentication.
- Organization workspaces and role-aware member management.
- Dataset CRUD and authenticated file uploads.
- CSV, XLSX and JSON processing with pandas.
- Data Health Score and quality breakdown.
- Statistical anomaly alerts for nulls, duplicates and numeric outliers.
- PDF report generation and token-backed download.
- Audit logs for sensitive business events.
- React, TypeScript and Vite frontend with protected routes.
- Docker Compose, Alembic migrations and GitHub Actions CI.

## Portfolio Weight

| Area | Signal |
| --- | --- |
| Backend Python | Strong API, auth, services, uploads, reports and tests |
| Full-stack | React UI integrated with real FastAPI endpoints |
| Data/BI | Dashboards, metrics, health score, lineage and alerts |
| Database | SQLAlchemy models, Alembic migrations and PostgreSQL-ready schema |
| DevOps | Docker Compose, CI, deployment docs and Render/Vercel prep |
| Product thinking | Demo user, screenshots, video, README and case-study narrative |

## Recruiter Read

In 30 seconds, the repository should communicate:

- This is a real internal-company tool, not a static dashboard.
- The project has a clear business problem.
- The main user journey is visible in screenshots and video.
- The codebase demonstrates backend, frontend, data and deployment discipline.
- The candidate understands product presentation, not just implementation.

## Current Demo Assets

- Screenshots: `docs/assets/screenshots/`
- Demo video: `docs/assets/demo/data-bridge-demo.webm`
- Frontend deploy config: `frontend/vercel.json`
- Backend deploy blueprint: `render.yaml`
