from pathlib import Path
from shutil import copyfile

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.utils import slugify, utcnow
from app.database.models import (
    Alert,
    Dataset,
    ImportJob,
    Organization,
    OrganizationMember,
    Report,
    User,
)
from app.database.session import SessionLocal, init_db
from app.integrations.storage.local import LocalStorage
from app.modules.auth.password import hash_password
from app.services.audit_service import record_audit
from app.services.processing_service import process_import_job
from app.services.report_service import generate_report

DEMO_EMAIL = "demo@databridge.dev"
DEMO_PASSWORD = "Demo@123456"
DEMO_USER_NAME = "Data-Bridge Demo User"
DEMO_ORGANIZATION_NAME = "Data-Bridge Demo Workspace"

FIXTURE_DIR = Path(__file__).resolve().parents[1] / "fixtures"

DEMO_DATASETS = [
    {
        "name": "Demo Sales Operations",
        "description": (
            "Monthly sales records with revenue, units, customers and cities."
        ),
        "domain_type": "SALES",
        "fixture": "sales_demo.csv",
        "mime_type": "text/csv",
    },
    {
        "name": "Demo Inventory Control",
        "description": "Inventory balances, reorder points and stock movement signals.",
        "domain_type": "INVENTORY",
        "fixture": "inventory_demo.csv",
        "mime_type": "text/csv",
    },
    {
        "name": "Demo Support Tickets",
        "description": (
            "Support tickets with priorities, SLA status and resolution hours."
        ),
        "domain_type": "SUPPORT",
        "fixture": "support_demo.json",
        "mime_type": "application/json",
    },
]


def main() -> None:
    if settings.app_env == "production":
        raise RuntimeError("Demo seed is disabled when APP_ENV=production.")

    init_db()
    db = SessionLocal()
    try:
        seed_demo_workspace(db)
        db.commit()
    finally:
        db.close()


def seed_demo_workspace(db: Session) -> None:
    user = get_or_create_demo_user(db)
    organization = get_or_create_demo_organization(db, user)

    for dataset_config in DEMO_DATASETS:
        dataset = get_or_create_dataset(db, organization, user, dataset_config)
        if not has_completed_import(db, dataset):
            import_job = create_import_from_fixture(db, dataset, user, dataset_config)
            db.commit()
            process_import_job(import_job.id, db)

        ensure_report(db, dataset, user)

    ensure_demo_alert(db, organization)
    record_audit(
        db,
        action="DEMO_WORKSPACE_SEEDED",
        entity_type="organization",
        entity_id=organization.id,
        organization_id=organization.id,
        user_id=user.id,
        metadata={"demo_email": DEMO_EMAIL},
    )


def get_or_create_demo_user(db: Session) -> User:
    user = db.query(User).filter(User.email == DEMO_EMAIL).first()
    if user is not None:
        return user

    user = User(
        email=DEMO_EMAIL,
        full_name=DEMO_USER_NAME,
        password_hash=hash_password(DEMO_PASSWORD),
    )
    db.add(user)
    db.flush()
    return user


def get_or_create_demo_organization(db: Session, user: User) -> Organization:
    slug = slugify(DEMO_ORGANIZATION_NAME)
    organization = db.query(Organization).filter(Organization.slug == slug).first()
    if organization is None:
        organization = Organization(name=DEMO_ORGANIZATION_NAME, slug=slug)
        db.add(organization)
        db.flush()

    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == organization.id,
            OrganizationMember.user_id == user.id,
        )
        .first()
    )
    if membership is None:
        db.add(
            OrganizationMember(
                organization_id=organization.id,
                user_id=user.id,
                role="OWNER",
            )
        )
    return organization


def get_or_create_dataset(
    db: Session,
    organization: Organization,
    user: User,
    dataset_config: dict[str, str],
) -> Dataset:
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.organization_id == organization.id,
            Dataset.name == dataset_config["name"],
        )
        .first()
    )
    if dataset is not None:
        return dataset

    dataset = Dataset(
        organization_id=organization.id,
        name=dataset_config["name"],
        description=dataset_config["description"],
        domain_type=dataset_config["domain_type"],
        status="DRAFT",
        created_by=user.id,
    )
    db.add(dataset)
    db.flush()
    record_audit(
        db,
        action="DATASET_CREATED",
        entity_type="dataset",
        entity_id=dataset.id,
        organization_id=organization.id,
        user_id=user.id,
        metadata={"source": "demo_seed"},
    )
    return dataset


def has_completed_import(db: Session, dataset: Dataset) -> bool:
    return (
        db.query(ImportJob)
        .filter(ImportJob.dataset_id == dataset.id, ImportJob.status == "COMPLETED")
        .first()
        is not None
    )


def create_import_from_fixture(
    db: Session,
    dataset: Dataset,
    user: User,
    dataset_config: dict[str, str],
) -> ImportJob:
    source_path = FIXTURE_DIR / dataset_config["fixture"]
    if not source_path.exists():
        raise FileNotFoundError(f"Demo fixture not found: {source_path}")

    storage = LocalStorage()
    stored_filename = f"demo_{dataset.id}_{source_path.name}"
    destination_path = storage.base_dir / stored_filename
    copyfile(source_path, destination_path)

    import_job = ImportJob(
        dataset_id=dataset.id,
        uploaded_by=user.id,
        original_filename=source_path.name,
        stored_filename=stored_filename,
        file_size_bytes=destination_path.stat().st_size,
        mime_type=dataset_config["mime_type"],
        status="PENDING",
        created_at=utcnow(),
    )
    db.add(import_job)
    db.flush()
    record_audit(
        db,
        action="FILE_UPLOADED",
        entity_type="import_job",
        entity_id=import_job.id,
        organization_id=dataset.organization_id,
        user_id=user.id,
        metadata={"filename": source_path.name, "source": "demo_seed"},
    )
    return import_job


def ensure_report(db: Session, dataset: Dataset, user: User) -> None:
    existing_report = (
        db.query(Report)
        .filter(Report.dataset_id == dataset.id, Report.status == "GENERATED")
        .first()
    )
    if existing_report is not None:
        return

    generate_report(
        db,
        dataset=dataset,
        generated_by=user.id,
        title=f"{dataset.name} Demo Report",
    )


def ensure_demo_alert(db: Session, organization: Organization) -> None:
    existing_alert = (
        db.query(Alert)
        .filter(
            Alert.organization_id == organization.id,
            Alert.type == "DEMO_PORTFOLIO_ALERT",
        )
        .first()
    )
    if existing_alert is not None:
        return

    db.add(
        Alert(
            organization_id=organization.id,
            dataset_id=None,
            type="DEMO_PORTFOLIO_ALERT",
            severity="INFO",
            status="OPEN",
            title="Demo workspace ready",
            message=(
                "The demo workspace includes sales, inventory and support datasets "
                "with processed records, reports and audit events."
            ),
            metadata_payload={"source": "demo_seed"},
        )
    )


if __name__ == "__main__":
    main()
