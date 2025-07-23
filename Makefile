# Makefile for Sensemaker

.PHONY: help setup up down logs rebuild dev init test build migrate seed models clean

help:
	@echo "Sensemaker Makefile - Common Commands:"
	@echo "  make setup     - Run first-time setup (generates .env, builds, starts all services)"
	@echo "  make up        - Start all services (Docker Compose)"
	@echo "  make down      - Stop all services"
	@echo "  make logs      - Tail logs for the app container"
	@echo "  make rebuild   - Rebuild all containers from scratch"
	@echo "  make dev       - Start in development mode (live code reload)"
	@echo "  make init      - Run DB migrations in a dedicated init container"
	@echo "  make test      - Run tests inside Docker"
	@echo "  make build     - Build the app (npm run build)"
	@echo "  make migrate   - Run DB migrations (npm run migrate:database)"
	@echo "  make seed      - Run DB seeds (npm run setup:seed)"
	@echo "  make models    - Install required Ollama models (llama3.2, mxbai-embed-large)"
	@echo "  make clean     - Remove containers, images, and volumes (DANGEROUS)"
	@echo ""
	@echo "Configuration:"
	@echo "  Ollama models - Set OLLAMA_MODELS_PATH in .env to use existing models"
	@echo "                  (defaults to ./empty-ollama-models for fresh setup)"

setup:
	chmod +x setup-first-time.sh
	./setup-first-time.sh

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

rebuild:
	chmod +x docker-rebuild.sh
	./docker-rebuild.sh

dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

init:
	docker compose -f docker-compose.yml -f docker-compose.init.yml up --build

test:
	docker compose run --rm app npm test

build:
	npm run build

migrate:
	docker compose run --rm app npm run migrate:database

seed:
	docker compose run --rm app npm run setup:seed

models:
	@echo "Installing Ollama models..."
	@./scripts/docker-install-models.sh

clean:
	docker compose down -v --rmi all --remove-orphans
	echo "All containers, images, and volumes removed." 