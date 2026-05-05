.PHONY: help up down logs migrate downgrade seed backend frontend test lint format

help:
	@echo "Data-Bridge commands:"
	@echo "  make up        Start local environment"
	@echo "  make down      Stop local environment"
	@echo "  make logs      Show container logs"
	@echo "  make migrate   Run backend database migrations"
	@echo "  make downgrade Roll back one backend migration"
	@echo "  make seed      Load demo workspace data"
	@echo "  make test      Run backend tests"
	@echo "  make lint      Run backend linter"
	@echo "  make format    Format backend code"

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	cd backend && alembic upgrade head

downgrade:
	cd backend && alembic downgrade -1

seed:
	cd backend && python -m app.scripts.seed_demo

test:
	cd backend && pytest

lint:
	cd backend && ruff check .

format:
	cd backend && ruff format .
