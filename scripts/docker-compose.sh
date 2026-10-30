#!/usr/bin/env bash
# Run docker compose with optional host Ollama bind when ~/.ollama exists.
# Usage: ./scripts/docker-compose.sh up -d
#        EXTRA_COMPOSE_FILE=docker-compose.dev.yml ./scripts/docker-compose.sh up --build
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

USE_HOST="${USE_HOST_OLLAMA:-1}"
OLLAMA_DATA="${OLLAMA_HOST_DATA:-$HOME/.ollama}"

files=(docker-compose.yml)
if [[ -d "$OLLAMA_DATA" && "$USE_HOST" != "0" ]]; then
  export OLLAMA_HOST_DATA="$OLLAMA_DATA"
  files+=(docker-compose.ollama-host.yml)
fi

if [[ -n "${EXTRA_COMPOSE_FILE:-}" ]]; then
  files+=("$EXTRA_COMPOSE_FILE")
fi

export COMPOSE_FILE
COMPOSE_FILE=$(IFS=':'; echo "${files[*]}")

exec docker compose "$@"
