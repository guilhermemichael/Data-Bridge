from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import init_db
from app.modules.alerts.router import router as alerts_router
from app.modules.analytics.router import router as analytics_router
from app.modules.audit.router import router as audit_router
from app.modules.auth.router import router as auth_router
from app.modules.datasets.router import router as datasets_router
from app.modules.health.router import router as health_router
from app.modules.imports.router import router as imports_router
from app.modules.organizations.router import router as organizations_router
from app.modules.reports.router import router as reports_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if settings.auto_create_tables:
        init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Data-Bridge API",
        version="0.1.0",
        description="Python-first API for operational data integration and analytics.",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = settings.api_v1_prefix
    app.include_router(health_router, prefix=f"{prefix}/health", tags=["Health"])
    app.include_router(auth_router, prefix=f"{prefix}/auth", tags=["Auth"])
    app.include_router(
        organizations_router,
        prefix=f"{prefix}/organizations",
        tags=["Organizations"],
    )
    app.include_router(datasets_router, prefix=f"{prefix}/datasets", tags=["Datasets"])
    app.include_router(imports_router, prefix=prefix, tags=["Imports"])
    app.include_router(analytics_router, prefix=prefix, tags=["Analytics"])
    app.include_router(alerts_router, prefix=f"{prefix}/alerts", tags=["Alerts"])
    app.include_router(reports_router, prefix=prefix, tags=["Reports"])
    app.include_router(audit_router, prefix=f"{prefix}/audit-logs", tags=["Audit"])

    return app


app = create_app()
