#!/bin/bash

echo "Rebuilding Sensemaker Docker containers..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DC="$SCRIPT_DIR/scripts/docker-compose.sh"
chmod +x "$DC" 2>/dev/null || true

# Stop and remove existing containers
echo "Stopping existing containers..."
"$DC" down

# Remove dangling images and containers
echo "Cleaning up Docker cache..."
docker system prune -f

# Rebuild containers
echo "Building containers..."
"$DC" build --no-cache

# Start services
echo "Starting services..."
"$DC" up -d

echo "Done! Check container logs with: $DC logs -f app"
