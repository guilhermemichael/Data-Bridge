# ADR-0003: Use React and TypeScript for the frontend

## Status

Accepted

## Context

Data-Bridge needs a modern dashboard experience with reusable components, typed API boundaries and chart-heavy views.

## Decision

Use React, TypeScript and Vite for the frontend application.

## Consequences

Positive:

- Strong ecosystem for dashboards.
- Fast development feedback.
- Typed UI and service contracts.
- Works well with component-driven architecture.

Negative:

- Requires dependency management through Node tooling.
- API contracts must stay synchronized with the backend.
