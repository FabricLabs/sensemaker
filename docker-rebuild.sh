#!/bin/bash

echo "Rebuilding Sensemaker Docker containers..."

# Stop and remove existing containers
echo "Stopping existing containers..."
docker compose down

# Remove dangling images and containers
echo "Cleaning up Docker cache..."
docker system prune -f

# Rebuild containers
echo "Building containers..."
docker compose build --no-cache

# Start services
echo "Starting services..."
docker compose up -d

echo "Done! Check container logs with: docker compose logs -f app" 