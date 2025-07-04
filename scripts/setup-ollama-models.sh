#!/bin/bash

# Script to set up Ollama models for Sensemaker Docker deployment

echo "Setting up Ollama models for Sensemaker..."

# Wait for Ollama to be ready
echo "Waiting for Ollama service to be ready..."
until curl -f http://localhost:11434/api/tags >/dev/null 2>&1; do
  echo "Waiting for Ollama..."
  sleep 5
done

echo "Ollama is ready! Pulling models..."

# Pull smaller models suitable for Docker containers
echo "Pulling llama3.2:1b model..."
ollama pull llama3.2:1b

echo "Pulling qwen2.5:0.5b model..."
ollama pull qwen2.5:0.5b

echo "Models pulled successfully!"

# List available models
echo "Available models:"
ollama list

echo "Ollama setup complete!"