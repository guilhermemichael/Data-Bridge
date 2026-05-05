# Data-Bridge

**Data-Bridge** is a Python-first web platform for importing, validating, processing, analyzing and visualizing operational datasets through a production-oriented architecture.

## Vision

Data-Bridge transforms raw operational files into trusted intelligence. It connects CSV, XLSX and JSON imports, validation pipelines, asynchronous processing, PostgreSQL persistence, analytical dashboards, PDF-style reports, audit logs and alerting workflows into a single cloud-ready platform.

## Core Stack

- Python 3.12
- FastAPI
- PostgreSQL
- SQLAlchemy
- Pandas
- Redis
- Celery
- React
- TypeScript
- Vite
- Docker
- GitHub Actions

## Current Capabilities

- FastAPI backend with OpenAPI docs
- JWT authentication and password hashing
- Organization and dataset management
- File import jobs for CSV, XLSX and JSON
- Pandas-based schema detection and data quality scoring
- Analytics summary and time series endpoints
- Automatic operational alerts
- Report registry with generated summary files
- Audit log API
- React dashboard shell with product-grade internal UI
- Docker Compose for PostgreSQL, Redis, API, worker and frontend

## Current Status

The repository now contains a functional MVP foundation: backend, worker, database models, frontend dashboard, documentation and CI workflows are in place. The backend test suite covers health checks and the main import flow from registration to CSV processing, analytics and PDF report generation.

## Architecture

```text
Frontend -> FastAPI API -> PostgreSQL
              |
              v
            Redis
              |
              v
          Celery Worker
              |
              v
       Data Processing Pipeline
```

## Repository Structure

```text
backend/    Python FastAPI application
frontend/   React TypeScript application
docs/       Technical documentation
infra/      Infrastructure and deployment files
.github/    CI/CD workflows and collaboration templates
```

## Running Locally

Create a local environment file:

```bash
cp .env.example .env
```

Start the full stack:

```bash
docker compose up --build
```

Services:

- API: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/api/v1/health
- Frontend: http://localhost:5173
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Backend Development

```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
pytest
ruff check .
```

## Frontend Development

```bash
cd frontend
npm install
npm run dev
npm run build
```

## Verification

```bash
cd backend
python -m pytest
python -m ruff check .

cd ../frontend
npm run build
```

## Product Modules

- Authentication
- Organizations
- Datasets
- Imports
- Processing
- Analytics
- Alerts
- Reports
- Audit logs

## Roadmap

- Add Alembic migrations as the production schema path.
- Add real authenticated frontend flows.
- Connect dashboard widgets to live API data.
- Add role management screens.
- Prepare Render, Railway or Fly.io deployment manifests.
- Add portfolio screenshots and a short demo video.

## License

MIT License.
