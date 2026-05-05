# ADR-0001: Use Python and FastAPI as the backend core

## Status

Accepted

## Context

Data-Bridge requires a backend capable of handling API requests, authentication, file upload, data processing orchestration and integration with analytical Python libraries.

## Decision

Use Python with FastAPI as the backend framework.

## Consequences

Positive:

- Native alignment with pandas and data processing.
- Automatic OpenAPI documentation.
- High developer productivity.
- Async support for I/O boundaries.

Negative:

- CPU-bound work must not run inside request handlers for large files.
- Worker boundaries are required for scalable processing.
