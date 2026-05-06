# Data-Bridge

![CI](https://github.com/guilhermemichael/Data-Bridge/actions/workflows/ci.yml/badge.svg)

**Data-Bridge** is a Python-first operational data platform that turns raw business files into validated, traceable and actionable intelligence through a full-stack architecture built with **FastAPI, PostgreSQL, pandas, Celery, Redis, React, TypeScript, Docker and GitHub Actions**.

The project is designed as a professional portfolio system: not a static dashboard, but a production-oriented simulation of a real internal data platform used to import files, validate data quality, process records, expose analytics, generate reports and audit critical actions.

---

## Table of Contents

- [Overview](#overview)
- [Problem](#problem)
- [Solution](#solution)
- [Current Status](#current-status)
- [Core Features](#core-features)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Repository Structure](#repository-structure)
- [Running Locally](#running-locally)
- [Demo Workspace](#demo-workspace)
- [Backend Development](#backend-development)
- [Frontend Development](#frontend-development)
- [Verification](#verification)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Surface](#api-surface)
- [Frontend Workspace](#frontend-workspace)
- [Security Model](#security-model)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Portfolio Notes](#portfolio-notes)
- [License](#license)

---

## Overview

Data-Bridge centralizes the lifecycle of operational data:

```text
raw file
→ upload
→ validation
→ import job
→ schema detection
→ data quality scoring
→ processing pipeline
→ analytics snapshots
→ alerts
→ reports
→ audit logs
→ dashboard
```

Supported import formats:

- CSV
- XLSX
- JSON

The platform is organized around organizations, datasets, import jobs, analytics, alerts, reports and audit logs.

---

## Problem

Small and medium-sized businesses often operate with scattered operational files:

```text
sales.xlsx
inventory.csv
support_tickets.json
monthly_report_final_v3.xlsx
```

Those files usually contain inconsistent schemas, invalid dates, duplicated rows, null values, wrong numeric formats and no historical traceability.

The result is predictable:

- fragile decisions;
- manual reporting;
- no audit trail;
- no data quality visibility;
- no repeatable import process;
- no centralized analytics layer.

---

## Solution

Data-Bridge provides a structured web platform where users can:

1. authenticate securely;
2. manage organizations and datasets;
3. upload operational files;
4. process CSV, XLSX and JSON files;
5. calculate data quality metrics;
6. inspect dataset schemas and previews;
7. monitor import jobs;
8. view analytics dashboards;
9. generate operational alerts;
10. create downloadable PDF-style reports;
11. inspect audit logs for governance events.

---

## Current Status

The repository contains a functional portfolio MVP foundation.

Implemented areas include:

- FastAPI backend application factory and OpenAPI documentation;
- JWT authentication and password hashing;
- organization and dataset management;
- CSV, XLSX and JSON import jobs;
- pandas-based processing, schema detection and Data Health Score;
- analytics summary, time series and organization overview endpoints;
- alerts and anomaly-oriented operational checks;
- report registry and generated report download flow;
- audit log API;
- React/TypeScript/Vite frontend;
- login, registration and protected workspace routing;
- dataset list, dataset creation and dataset detail cockpit;
- import monitoring, alerts, reports, audit and settings pages;
- role-aware frontend actions;
- demo seed command;
- Alembic migrations;
- Docker Compose for PostgreSQL, Redis, API, worker and frontend;
- GitHub Actions CI for backend and frontend validation;
- Vitest and Testing Library frontend smoke tests.

The API routers are registered for health, auth, organizations, datasets, imports, analytics, alerts, reports and audit logs.

---

## Core Features

### Authentication and Access

- User registration
- User login
- JWT-based authentication
- Password hashing
- Protected API routes
- Protected frontend workspace routes
- Role-aware frontend behavior

### Organizations

- Organization-scoped workspace model
- Membership-aware architecture
- Foundation for multi-tenant data separation

### Datasets

- Dataset creation and listing
- Dataset detail cockpit
- Schema explorer
- Preview flow
- Health breakdown
- Data lineage-oriented view
- Archive/edit actions where enabled

### Imports

- CSV import jobs
- XLSX import jobs
- JSON import jobs
- Upload validation
- Import status monitoring
- Raw and processed data workflow foundation

### Data Quality

- Data Health Score
- Schema detection
- Null-rate checks
- Duplicate checks
- Numeric outlier-oriented anomaly alerts

### Analytics

- Organization overview endpoint
- Dataset summary endpoint
- Time series endpoint
- Dashboard metrics connected to API data

### Alerts

- Operational alert model
- Alert listing
- Alert resolution flow
- Severity-oriented alert UX

### Reports

- Report registry
- Generated report files
- Authenticated download flow
- Portfolio-ready PDF/report foundation

### Audit Logs

- Governance event tracking
- Authenticated audit log interface
- Foundation for traceability and compliance-style review

---

## Architecture

```text
┌──────────────────────────────────────────────┐
│                 Frontend                     │
│ React + TypeScript + Vite                    │
│ Protected routes + dashboard workspace       │
└──────────────────────┬───────────────────────┘
                       │ HTTP/REST
                       ▼
┌──────────────────────────────────────────────┐
│                 FastAPI API                  │
│ Auth | Organizations | Datasets | Imports    │
│ Analytics | Alerts | Reports | Audit Logs    │
└───────────────┬───────────────────┬──────────┘
                │                   │
                ▼                   ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│       PostgreSQL         │   │          Redis           │
│ Relational persistence   │   │ Broker/cache foundation  │
└──────────────────────────┘   └─────────────┬────────────┘
                                             ▼
                                  ┌──────────────────────┐
                                  │    Celery Worker     │
                                  │ Data processing jobs │
                                  └──────────────────────┘
```

### Backend registration map

The FastAPI app registers the following modules:

```text
/api/v1/health
/api/v1/auth
/api/v1/organizations
/api/v1/datasets
/api/v1/imports...
/api/v1/analytics...
/api/v1/alerts
/api/v1/reports...
/api/v1/audit-logs
```

---

## Technology Stack

### Backend

- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic
- Pydantic Settings
- SQLAlchemy
- Alembic
- PostgreSQL / psycopg
- python-jose
- passlib + bcrypt
- pandas
- openpyxl
- Redis
- Celery
- structlog
- ReportLab
- pytest
- Ruff

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios
- Recharts
- Tailwind CSS
- Lucide React
- Vitest
- Testing Library

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions
- PostgreSQL container
- Redis container
- Celery worker service

---

## Repository Structure

```text
Data-Bridge/
├── backend/        Python FastAPI application
├── frontend/       React TypeScript application
├── docs/           Architecture, deployment and product documentation
├── infra/          Infrastructure assets and scripts
├── .github/        Workflows, issue templates and PR templates
├── docker-compose.yml
├── Makefile
├── .env.example
├── README.md
└── LICENSE
```

---

## Running Locally

Create a local environment file:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up --build
```

Available services:

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8000 |
| OpenAPI Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/v1/health |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

Validate Docker Compose configuration:

```bash
docker compose config
docker compose build
```

Apply migrations:

```bash
cd backend
alembic upgrade head
```

---

## Demo Workspace

Load the demo data:

```bash
cd backend
python -m app.scripts.seed_demo
```

Demo credentials:

```text
Email: demo@databridge.dev
Password: Demo@123456
```

The demo workspace is intended for recruiters, reviewers and portfolio demonstrations. It should provide ready-to-use datasets and enough operational data to show the dashboard, imports, alerts, reports and audit flows without requiring manual setup.

---

## Backend Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
alembic upgrade head
python -m pytest
python -m ruff check .
```

Run the API locally:

```bash
uvicorn app.main:app --reload
```

---

## Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Build the frontend:

```bash
npm run build
```

Run frontend tests:

```bash
npm run test -- --run
```

Frontend environment:

```bash
cp .env.example .env
```

The Vite client reads:

```text
VITE_API_BASE_URL
```

It should point to the FastAPI base URL, usually:

```text
http://localhost:8000/api/v1
```

---

## Verification

Recommended local verification sequence:

```bash
cd backend
python -m alembic upgrade head
python -m app.scripts.seed_demo
python -m pytest
python -m ruff check .

cd ../frontend
npm run test -- --run
npm run build
```

Docker verification:

```bash
docker compose config
docker compose build
docker compose up
```

---

## Environment Variables

The root `.env.example` documents the main runtime variables.

Important variables:

```text
APP_ENV
APP_DEBUG
AUTO_CREATE_TABLES
DATABASE_URL
REDIS_URL
JWT_SECRET_KEY
CORS_ORIGINS
UPLOAD_DIR
REPORTS_DIR
VITE_API_BASE_URL
```

Production rules:

- use `APP_ENV=production`;
- use `APP_DEBUG=false`;
- use `AUTO_CREATE_TABLES=false`;
- keep secrets out of Git;
- restrict `CORS_ORIGINS` to the deployed frontend domain;
- run migrations explicitly with Alembic.

---

## Database Migrations

Alembic is the authoritative schema path for PostgreSQL.

Apply migrations:

```bash
cd backend
alembic upgrade head
```

Migration validation baseline:

```bash
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

`AUTO_CREATE_TABLES=true` may be used only for fast local bootstrapping. Portfolio and production workflows should rely on Alembic migrations.

---

## API Surface

Main backend modules:

| Area | Purpose |
|---|---|
| Health | API availability check |
| Auth | Registration, login and current user |
| Organizations | Workspace and membership foundation |
| Datasets | Dataset CRUD and dataset cockpit data |
| Imports | File upload and import job lifecycle |
| Analytics | Summary, time series and overview metrics |
| Alerts | Operational alerts and resolution |
| Reports | Report generation registry and download |
| Audit Logs | Governance and traceability events |

OpenAPI documentation is available at:

```text
http://localhost:8000/docs
```

---

## Frontend Workspace

Main frontend routes:

```text
/login
/register
/app
/app/datasets
/app/datasets/:datasetId
/app/imports
/app/alerts
/app/reports
/app/audit
/app/settings
```

The workspace uses protected routing and an authenticated shell with sidebar navigation, API health status and logout flow.

---

## Security Model

Current security foundations:

- password hashing;
- JWT authentication;
- protected backend routes;
- protected frontend workspace;
- role-aware frontend actions;
- upload validation foundation;
- organization-scoped data model;
- audit log records for governance events;
- production rules for CORS, debug mode and secrets.

Security rules for production:

- never commit `.env`;
- never log passwords or tokens;
- use a strong `JWT_SECRET_KEY`;
- use HTTPS on deployed services;
- restrict CORS to the deployed frontend;
- run database migrations explicitly;
- keep demo credentials clearly marked as demo-only.

---

## Deployment

Deployment planning is documented in:

- `docs/deployment/DEPLOYMENT.md`
- `docs/deployment/POSTGRESQL_CLOUD.md`
- `docs/deployment/STORAGE.md`

Recommended portfolio topology:

```text
Frontend: Vercel
Backend: Render, Railway or Fly.io
Database: Neon, Supabase, Railway PostgreSQL or Render PostgreSQL
Redis: Upstash, Redis Cloud or Railway Redis
```

Production checklist:

- configure backend environment variables;
- configure frontend `VITE_API_BASE_URL`;
- provision PostgreSQL;
- provision Redis or document eager-mode limitations;
- run `alembic upgrade head`;
- load demo data only when appropriate;
- validate `/api/v1/health`;
- validate login;
- validate dashboard;
- validate report download.

---

## Roadmap

Short-term priorities:

- add screenshots to `docs/assets/screenshots/`;
- record a short portfolio demo video;
- expand backend and frontend test coverage;
- harden production deployment configuration;
- add more dataset examples for sales, inventory and support;
- improve data lineage visualization;
- add richer data quality breakdown charts.

Release 1.0 target:

```text
login
→ organization
→ dataset
→ upload
→ import job
→ processing
→ data health score
→ analytics
→ alerts
→ reports
→ audit logs
→ deploy
→ README with screenshots and demo video
```

---

## Portfolio Notes

This project is intended to demonstrate practical ability across multiple areas:

- backend development;
- web development;
- data analysis;
- database modeling;
- data engineering fundamentals;
- cloud deployment preparation;
- product-oriented documentation;
- security-aware application design.

Suggested resume entry:

```text
Data-Bridge — Python-first operational data platform built with FastAPI, PostgreSQL, pandas, Celery, Redis, React and Docker. The system supports authenticated dataset management, CSV/XLSX/JSON import jobs, data quality scoring, analytics dashboards, alerts, PDF-style reports, audit logs, migrations, CI and a cloud-ready deployment structure.
```

---

## License

MIT License.
