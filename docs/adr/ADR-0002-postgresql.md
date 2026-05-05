# ADR-0002: Use PostgreSQL as the primary database

## Status

Accepted

## Context

Data-Bridge needs relational integrity, analytical queries, JSON payload support and a deployment path that matches professional backend environments.

## Decision

Use PostgreSQL 16 as the primary database.

## Consequences

Positive:

- Strong relational modeling.
- JSON support for flexible datasets.
- Mature indexing and query capabilities.
- Common in production systems.

Negative:

- Requires operational setup.
- Migrations and backups must be treated seriously.
