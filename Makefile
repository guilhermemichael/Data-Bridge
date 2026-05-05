.PHONY: help up down logs backend frontend test lint format

help:
	@echo "Data-Bridge commands:"
	@echo "  make up        Start local environment"
	@echo "  make down      Stop local environment"
	@echo "  make logs      Show container logs"
	@echo "  make test      Run backend tests"
	@echo "  make lint      Run backend linter"
	@echo "  make format    Format backend code"

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

test:
	cd backend && pytest

lint:
	cd backend && ruff check .

format:
	cd backend && ruff format .
