from app.database.session import SessionLocal, init_db
from app.services.processing_service import process_import_job
from app.workers.celery_app import celery_app


@celery_app.task(name="process_import_job")
def process_import_job_task(import_job_id: str) -> str:
    init_db()
    db = SessionLocal()
    try:
        process_import_job(import_job_id, db)
        return import_job_id
    finally:
        db.close()
