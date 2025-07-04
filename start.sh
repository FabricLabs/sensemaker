#!/bin/bash

set -e  # Exit on any error

# Function to check if database has tables
check_database_initialized() {
    echo "Checking if database is initialized..."

    # Try to query a basic table to see if database is set up
    if node -e "
        const mysql = require('mysql2/promise');
        (async () => {
            try {
                const connection = await mysql.createConnection({
                    host: 'db',
                    user: 'db_user_sensemaker',
                    password: process.env.SQL_DB_CRED,
                    database: 'db_sensemaker'
                });

                const [rows] = await connection.execute('SHOW TABLES LIKE \"users\"');
                await connection.end();

                if (rows.length > 0) {
                    console.log('Database appears to be initialized.');
                    process.exit(0);
                } else {
                    console.log('Database tables not found.');
                    process.exit(1);
                }
            } catch (error) {
                console.log('Database check failed:', error.message);
                process.exit(1);
            }
        })();
    " 2>/dev/null; then
        return 0  # Database is initialized
    else
        return 1  # Database needs initialization
    fi
}

# Wait for MySQL to be ready
echo "Waiting for MySQL to be ready..."
while ! nc -z db 3306; do
  sleep 1
done
echo "MySQL is ready!"

# Wait for Redis to be ready
echo "Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "Redis is ready!"

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
while ! nc -z ollama 11434; do
  sleep 1
done
echo "Ollama is ready!"

# Check if database needs initialization
if ! check_database_initialized; then
    echo "Database not initialized. Running migrations..."

    # Run database migrations
    echo "Running database migrations..."
    npm run migrate:database

    # Run seeds to create initial users (sensemaker, then admin)
    echo "Running database seeds..."
    npm run setup:seed || echo "Warning: Seeding failed, continuing..."

    echo "Database initialization complete!"
else
    echo "Database already initialized, skipping migrations."
fi

# Ensure required Ollama models are available
echo "Checking for required Ollama models..."

# Required models for Sensemaker
REQUIRED_MODELS=("mxbai-embed-large" "llama3.2" "qwen3:0.6b")

# Function to check if model exists
check_model_exists() {
    curl -s http://ollama:11434/api/tags | grep -q "$1"
}

# Function to pull model with retry logic
pull_model() {
    local model_name="$1"
    local max_retries=3
    local retry_count=0

    echo "Pulling model: $model_name..."
    echo "This may take several minutes for larger models..."

    while [ $retry_count -lt $max_retries ]; do
        echo "Attempt $((retry_count + 1)) of $max_retries for $model_name..."

        # Start the pull
        curl -X POST http://ollama:11434/api/pull -d "{\"name\": \"$model_name\"}" &
        PULL_PID=$!

        # Wait for the model to be available (check every 15 seconds, timeout after 10 minutes)
        local wait_count=0
        local max_wait=40  # 40 * 15 seconds = 10 minutes

        while [ $wait_count -lt $max_wait ] && ! check_model_exists "$model_name"; do
            echo "Still downloading $model_name... ($((wait_count * 15))s elapsed)"
            sleep 15
            wait_count=$((wait_count + 1))
        done

        # Check if model was successfully downloaded
        if check_model_exists "$model_name"; then
            echo "Model $model_name download complete!"
            return 0
        else
            echo "Download failed for $model_name (attempt $((retry_count + 1)))"
            retry_count=$((retry_count + 1))

            # Kill any hanging curl processes
            pkill -f "curl.*api/pull.*$model_name" || true
            sleep 5
        fi
    done

    echo "Failed to download $model_name after $max_retries attempts. Continuing anyway..."
    return 1
}

# Check and pull all required models
echo "Downloading required models..."
for model in "${REQUIRED_MODELS[@]}"; do
    if ! check_model_exists "$model"; then
        if ! pull_model "$model"; then
            echo "ERROR: Failed to download required model $model after retries. Application may not work properly."
            echo "You may need to manually run: docker compose exec ollama ollama pull $model"
        fi
    else
        echo "Required model $model already available."
    fi
done

echo "Model setup complete!"

# Start the application
echo "Starting Sensemaker..."
node scripts/node.js