# Use Node.js 22.14.0 as base
FROM node:22.14.0-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install MySQL
RUN wget https://dev.mysql.com/get/mysql-apt-config_0.8.28-1_all.deb \
    && dpkg -i mysql-apt-config_0.8.28-1_all.deb \
    && apt-get update \
    && apt-get install -y mysql-server \
    && rm -rf /var/lib/apt/lists/*

# Install Redis Stack
RUN wget -O- https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/redis.list \
    && apt-get update \
    && apt-get install -y redis-stack-server \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama
RUN wget https://ollama.ai/download/linux \
    && chmod +x linux \
    && mv linux /usr/local/bin/ollama

# Create application directory
WORKDIR /app

# Copy application files
COPY . .

# Install Node.js dependencies
RUN npm install

# Create startup script
RUN echo '#!/bin/bash\n\
service mysql start\n\
service redis-stack-server start\n\
ollama serve &\n\
npm run setup\n\
node scripts/node.js\n' > /app/start.sh \
    && chmod +x /app/start.sh

# Expose necessary ports
EXPOSE 3000 3306 6379 11434

# Set entrypoint
ENTRYPOINT ["/app/start.sh"]
