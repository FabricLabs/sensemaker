# Use Node.js 22.14.0 as base
FROM node:22.14.0-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    build-essential \
    libpixman-1-dev \
    libcairo2-dev \
    libsdl-pango-dev \
    libgif-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Create application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p /media/storage/stores/sensemaker \
    && mkdir -p /media/storage/node/files \
    && mkdir -p /media/storage/uploads/users

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Waiting for services to be ready..."\n\
sleep 10\n\
echo "Running database migrations..."\n\
npm run migrate:database\n\
echo "Starting Sensemaker in Docker mode..."\n\
exec node scripts/docker-node.js\n' > /app/start.sh \
    && chmod +x /app/start.sh

# Expose application port
EXPOSE 3040

# Set entrypoint
ENTRYPOINT ["/app/start.sh"]