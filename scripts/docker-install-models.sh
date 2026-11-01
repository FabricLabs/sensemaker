#!/bin/bash
## Install Models to Docker Ollama Instance
## This script installs required models to the Ollama container

set -e

CONTAINER_NAME="sensemaker-ollama"

echo "Installing models to Docker Ollama container: $CONTAINER_NAME"

# Check if container is running
if ! docker exec $CONTAINER_NAME ollama --version > /dev/null 2>&1; then
    echo "Error: Ollama container '$CONTAINER_NAME' is not running or accessible"
    echo "Start it with: docker compose up -d ollama"
    exit 1
fi

# Default: smallest chat + embedding models (override: OLLAMA_PULL_MODELS="a,b" ./scripts/docker-install-models.sh)
IFS=',' read -ra MODELS <<< "${OLLAMA_PULL_MODELS:-llama3.2:latest,qwen3:0.6b,nomic-embed-text}"
for i in "${!MODELS[@]}"; do
  MODELS[$i]=$(echo "${MODELS[$i]}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
done

for m in "${MODELS[@]}"; do
  echo "Pulling $m..."
  docker exec $CONTAINER_NAME ollama pull "$m"
  echo "✓ $m"
done

echo "✓ Requested models installed."
echo ""
echo "Available models:"
docker exec $CONTAINER_NAME ollama list 