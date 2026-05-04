# Makefile for Sensemaker

.PHONY: help setup up down logs rebuild dev init test build migrate seed models clean redis-local redis-local-down

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
	@echo "  make models    - Install default small Ollama models (qwen3:0.6b, nomic-embed-text; override OLLAMA_PULL_MODELS)"
	@echo "  make clean     - Remove containers, images, and volumes (DANGEROUS)"
	@echo "  make redis-local      - Redis Stack in Docker on 127.0.0.1:6379 (for host npm start)"
	@echo "  make redis-local-down - Stop that Redis container"
	@echo ""
	@echo "Configuration:"
	@echo "  Ollama — if ~/.ollama exists, compose bind-mounts it (reuse local pulls)."
	@echo "           Disable with USE_HOST_OLLAMA=0. Override path: OLLAMA_HOST_DATA=/path"
	@echo "  setup-first-time OLLAMA_MODELS_PATH — legacy .env hint; compose uses bind above"

setup:
	chmod +x setup-first-time.sh
	./setup-first-time.sh

up:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh up -d

down:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh down

logs:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh logs -f app

rebuild:
	chmod +x docker-rebuild.sh
	./docker-rebuild.sh

dev:
	@chmod +x scripts/docker-compose.sh
	@EXTRA_COMPOSE_FILE=docker-compose.dev.yml ./scripts/docker-compose.sh up --build

init:
	@chmod +x scripts/docker-compose.sh
	@EXTRA_COMPOSE_FILE=docker-compose.init.yml ./scripts/docker-compose.sh up --build

test:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh run --rm app npm test

build:
	npm run build

migrate:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh run --rm app npm run migrate:database

seed:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh run --rm app npm run setup:seed

models:
	@echo "Installing Ollama models..."
	@./scripts/docker-install-models.sh

clean:
	@chmod +x scripts/docker-compose.sh
	@./scripts/docker-compose.sh down -v --rmi all --remove-orphans
	echo "All containers, images, and volumes removed."

# Redis Stack for local Node (npm start); requires Docker Desktop / engine.
redis-local:
	docker compose -f docker-compose.redis-local.yml up -d
	@echo "Redis Stack at 127.0.0.1:6379 — run npm start on the host (see DEVELOPERS.md)."

redis-local-down:
	docker compose -f docker-compose.redis-local.yml down 