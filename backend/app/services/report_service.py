from pathlib import Path

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.utils import utcnow
from app.database.models import Alert, AnalyticsSnapshot, Dataset, ImportJob, Report
from app.services.audit_service import record_audit


def generate_report(
    db: Session,
    *,
    dataset: Dataset,
    generated_by: str,
    title: str | None = None,
) -> Report:
    report_title = title or f"{dataset.name} Operational Report"
    report_dir = Path(settings.report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    file_path = report_dir / f"report_{dataset.id}.pdf"

    imports = (
        db.query(ImportJob)
        .filter(ImportJob.dataset_id == dataset.id)
        .order_by(ImportJob.created_at.desc())
        .limit(5)
        .all()
    )
    metrics = (
        db.query(AnalyticsSnapshot)
        .filter(AnalyticsSnapshot.dataset_id == dataset.id)
        .order_by(AnalyticsSnapshot.metric_key.asc())
        .all()
    )
    alerts = (
        db.query(Alert)
        .filter(Alert.dataset_id == dataset.id)
        .order_by(Alert.created_at.desc())
        .limit(5)
        .all()
    )

    pdf = canvas.Canvas(str(file_path), pagesize=letter)
    width, height = letter
    y = height - 56
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(56, y, report_title)
    y -= 30
    pdf.setFont("Helvetica", 10)
    pdf.drawString(56, y, f"Dataset: {dataset.name}")
    y -= 18
    pdf.drawString(56, y, f"Rows: {dataset.row_count}")
    y -= 18
    pdf.drawString(56, y, f"Data Health Score: {dataset.health_score:.1f}/100")
    y -= 30

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(56, y, "Metrics")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for metric in metrics[:12]:
        pdf.drawString(56, y, f"- {metric.metric_key}: {metric.metric_value:.2f}")
        y -= 14
        if y < 80:
            pdf.showPage()
            y = height - 56

    y -= 10
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(56, y, "Recent Imports")
    y -= 18
    pdf.setFont("Helvetica", 9)
    for item in imports:
        pdf.drawString(56, y, f"- {item.original_filename}: {item.status}")
        y -= 14

    y -= 10
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(56, y, "Alerts")
    y -= 18
    pdf.setFont("Helvetica", 9)
    if not alerts:
        pdf.drawString(56, y, "- No alerts generated.")
    for alert in alerts:
        pdf.drawString(56, y, f"- [{alert.severity}] {alert.title}")
        y -= 14

    pdf.save()

    report = Report(
        organization_id=dataset.organization_id,
        dataset_id=dataset.id,
        generated_by=generated_by,
        title=report_title,
        file_path=str(file_path),
        status="GENERATED",
        finished_at=utcnow(),
    )
    db.add(report)
    db.flush()
    record_audit(
        db,
        action="REPORT_GENERATED",
        entity_type="report",
        entity_id=report.id,
        organization_id=dataset.organization_id,
        user_id=generated_by,
    )
    return report
