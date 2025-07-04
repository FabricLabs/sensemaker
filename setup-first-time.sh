#!/bin/bash

set -e  # Exit on any error

echo "🚀 Sensemaker First-Time Setup"
echo "==============================="

# Function to generate a random password
generate_mysql_password() {
    # Generate a 32-character random password using openssl
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Function to generate admin credentials
generate_admin_credentials() {
    # Generate admin username (default with random suffix)
    ADMIN_USERNAME="admin"

    # Generate admin password
    ADMIN_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

    echo "ADMIN_USERNAME=$ADMIN_USERNAME"
    echo "ADMIN_PASSWORD=$ADMIN_PASSWORD"
}

# Function to generate Fabric mnemonic (12 or 24-word BIP39 mnemonic, defaults to 24)
generate_fabric_mnemonic() {
    # Use Node.js to generate a proper BIP39 mnemonic (default 24-word with 256 bits)
    FABRIC_MNEMONIC=$(node -e "
        const bip39 = require('bip39');
        console.log(bip39.generateMnemonic(256));
    " 2>/dev/null)

    # Fallback if bip39 is not available
    if [ -z "$FABRIC_MNEMONIC" ]; then
        echo "⚠️  Warning: Could not generate BIP39 mnemonic, using fallback method"
        # Use a 24-word test seed as fallback
        FABRIC_MNEMONIC="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art"
    fi

    echo "FABRIC_MNEMONIC=$FABRIC_MNEMONIC"
}

# Function to detect local Ollama installation and models
detect_ollama_models() {
    local OLLAMA_MODELS_PATH=""
    
    # Check common Ollama model locations
    if [ -d "$HOME/.ollama/models" ] && [ "$(ls -A $HOME/.ollama/models 2>/dev/null)" ]; then
        OLLAMA_MODELS_PATH="$HOME/.ollama/models"
        echo "🤖 Found existing Ollama models at: $OLLAMA_MODELS_PATH"
        echo "   These will be mounted to avoid re-downloading"
    else
        OLLAMA_MODELS_PATH="./empty-ollama-models"
        echo "🤖 No existing Ollama models found"
        echo "   Models will be downloaded fresh on first run"
    fi
    
    echo "OLLAMA_MODELS_PATH=$OLLAMA_MODELS_PATH"
}

# Check if .env file exists, create if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."

    # Generate random MySQL password
    MYSQL_PASSWORD=$(generate_mysql_password)
    echo "🔐 Generated random MySQL password: $MYSQL_PASSWORD"
    echo "   Please save this password for future reference!"

    # Generate admin credentials
    ADMIN_CREDS=$(generate_admin_credentials)
    ADMIN_USERNAME=$(echo "$ADMIN_CREDS" | grep "ADMIN_USERNAME=" | cut -d'=' -f2)
    ADMIN_PASSWORD=$(echo "$ADMIN_CREDS" | grep "ADMIN_PASSWORD=" | cut -d'=' -f2)

    # Generate Fabric mnemonic
    FABRIC_MNEMONIC_OUTPUT=$(generate_fabric_mnemonic)
    FABRIC_MNEMONIC=$(echo "$FABRIC_MNEMONIC_OUTPUT" | grep "FABRIC_MNEMONIC=" | cut -d'=' -f2-)

    # Detect Ollama models
    OLLAMA_MODELS_OUTPUT=$(detect_ollama_models)
    OLLAMA_MODELS_PATH=$(echo "$OLLAMA_MODELS_OUTPUT" | grep "OLLAMA_MODELS_PATH=" | cut -d'=' -f2-)

    echo "👤 Generated admin credentials:"
    echo "   Username: $ADMIN_USERNAME"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "🔑 Generated Fabric mnemonic (BIP39, 24-word default):"
    echo "   $FABRIC_MNEMONIC"
    echo ""
    echo "   Please save these credentials for future reference!"
    
    cat > .env << EOF
# Fabric Configuration
FABRIC_MNEMONIC=$FABRIC_MNEMONIC

# Database Configuration
MYSQL_PASSWORD=$MYSQL_PASSWORD

# Admin Configuration
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Application Configuration
NODE_ENV=production

# Ollama Configuration
# Path to local Ollama models (set to your ~/.ollama/models to use existing models)
OLLAMA_MODELS_PATH=$OLLAMA_MODELS_PATH

# Optional: Uncomment and configure these for additional features
# DISCORD_TOKEN=your_discord_token_here
# DISCORD_CLIENT_ID=your_discord_client_id_here
# DISCORD_CLIENT_SECRET=your_discord_client_secret_here
EOF
    echo "✅ Created .env file with random MySQL password"
    echo "   You can edit .env to customize your settings"
else
    echo "✅ .env file already exists"
    # Check if required credentials exist in .env file
    MISSING_VARS=()

    if grep -q "MYSQL_PASSWORD=" .env; then
        EXISTING_MYSQL_PASSWORD=$(grep "MYSQL_PASSWORD=" .env | cut -d'=' -f2)
        echo "🔐 Using existing MySQL password: $EXISTING_MYSQL_PASSWORD"
    else
        MISSING_VARS+=("MYSQL_PASSWORD")
    fi

    if grep -q "ADMIN_USERNAME=" .env; then
        EXISTING_ADMIN_USERNAME=$(grep "ADMIN_USERNAME=" .env | cut -d'=' -f2)
        echo "👤 Using existing admin username: $EXISTING_ADMIN_USERNAME"
    else
        MISSING_VARS+=("ADMIN_USERNAME")
    fi

    if grep -q "ADMIN_PASSWORD=" .env; then
        EXISTING_ADMIN_PASSWORD=$(grep "ADMIN_PASSWORD=" .env | cut -d'=' -f2)
        echo "🔐 Using existing admin password: $EXISTING_ADMIN_PASSWORD"
    else
        MISSING_VARS+=("ADMIN_PASSWORD")
    fi

    if grep -q "FABRIC_MNEMONIC=" .env; then
        EXISTING_FABRIC_MNEMONIC=$(grep "FABRIC_MNEMONIC=" .env | cut -d'=' -f2-)
        echo "🔑 Using existing Fabric mnemonic: $EXISTING_FABRIC_MNEMONIC"
    else
        MISSING_VARS+=("FABRIC_MNEMONIC")
    fi

    if grep -q "OLLAMA_MODELS_PATH=" .env; then
        EXISTING_OLLAMA_MODELS_PATH=$(grep "OLLAMA_MODELS_PATH=" .env | cut -d'=' -f2-)
        echo "🤖 Using existing Ollama models path: $EXISTING_OLLAMA_MODELS_PATH"
    else
        echo "🤖 Adding OLLAMA_MODELS_PATH to existing .env file..."
        OLLAMA_MODELS_OUTPUT=$(detect_ollama_models)
        OLLAMA_MODELS_PATH=$(echo "$OLLAMA_MODELS_OUTPUT" | grep "OLLAMA_MODELS_PATH=" | cut -d'=' -f2-)
        echo "" >> .env
        echo "# Ollama Configuration" >> .env
        echo "# Path to local Ollama models (set to your ~/.ollama/models to use existing models)" >> .env
        echo "OLLAMA_MODELS_PATH=$OLLAMA_MODELS_PATH" >> .env
    fi

    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "⚠️  Warning: Missing required variables in .env file: ${MISSING_VARS[*]}"
        echo "   Please add the missing variables or delete .env to regenerate"
        exit 1
    fi
fi

# Create empty Ollama models directory if needed
if grep -q "OLLAMA_MODELS_PATH=./empty-ollama-models" .env; then
    echo "📁 Creating empty Ollama models directory..."
    mkdir -p empty-ollama-models
fi

# Stop any existing containers
echo "🛑 Stopping any existing containers..."
docker compose down 2>/dev/null || true

# Clean up old containers and images
echo "🧹 Cleaning up old Docker resources..."
docker system prune -f

# Build and start services
echo "🔨 Building containers..."
docker compose build --no-cache

echo "🚀 Starting services..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if app container is running
if docker compose ps app | grep -q "Up"; then
    echo "✅ Application container is running"

    # Check the logs for any errors
    echo "📋 Checking application logs..."
    docker compose logs app --tail=20

    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Check application status: docker compose ps"
    echo "2. View logs: docker compose logs -f app"
    echo "3. Access the application at: http://localhost:5050"
    echo "4. Stop services: docker compose down"
    echo ""
    echo "For development with live code changes:"
    echo "   docker compose -f docker-compose.yml -f docker-compose.dev.yml up"

else
    echo "❌ Application failed to start. Checking logs..."
    docker compose logs app
    exit 1
fi