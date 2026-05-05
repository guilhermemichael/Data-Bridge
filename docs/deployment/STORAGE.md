# Storage Strategy

## Current Implementation

Data-Bridge currently ships with a local filesystem storage adapter:

```env
STORAGE_BACKEND=local
UPLOAD_DIR=/app/storage/uploads
REPORT_DIR=/app/storage/reports
```

Uploads are sanitized and saved with generated filenames. Reports are generated into `REPORT_DIR`.

## Production Requirement

For a real cloud deployment, storage must be persistent.

Use one of:

- A persistent disk mounted into the backend service.
- A shared volume mounted into both backend and worker.
- S3-compatible object storage through a future adapter.

Avoid relying on ephemeral container storage for portfolio demos that need report downloads after restarts.

## Backend and Worker Consistency

The backend API and Celery worker must see the same upload files. If uploads are stored on local disk, both services need the same mounted volume.

Docker Compose already mounts:

```text
databridge_storage:/app/storage
```

## Future S3 Adapter

The code now resolves upload storage through `app.integrations.storage.factory.get_upload_storage()`. That keeps the upload flow ready for a future `S3Storage` implementation without changing routers or processing services.

Expected future variables:

```env
STORAGE_BACKEND=s3
S3_BUCKET=...
S3_REGION=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
```

Do not commit cloud storage credentials.
