# Contributing to Data-Bridge

Data-Bridge follows a structured engineering workflow.

## Branch Naming

- `main` - stable branch
- `develop` - integration branch
- `feat/<scope>` - new feature
- `fix/<scope>` - bug fix
- `docs/<scope>` - documentation
- `chore/<scope>` - maintenance
- `refactor/<scope>` - internal restructuring

## Commit Style

Use conventional commits:

```text
feat: add dataset upload endpoint
fix: handle invalid CSV encoding
docs: document database schema
chore: configure docker compose
refactor: isolate analytics service
test: add auth service tests
```

## Pull Request Rules

Every PR must include:

- Clear description
- Scope of change
- Testing evidence
- Screenshots if UI changed
- Migration notes if database changed
