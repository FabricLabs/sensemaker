# Build stage
FROM node:22.14.0-slim AS builder

# Create app directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy source code
COPY . .

# Production stage
FROM node:22.14.0-slim

WORKDIR /app

# Install runtime dependencies, netcat, and Bitcoin Core
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    curl \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install Bitcoin Core with architecture detection
ENV BITCOIN_VERSION=28.0
RUN cd /tmp \
    && ARCH=$(dpkg --print-architecture) \
    && if [ "$ARCH" = "amd64" ]; then \
        BITCOIN_ARCH="x86_64-linux-gnu"; \
    elif [ "$ARCH" = "arm64" ]; then \
        BITCOIN_ARCH="aarch64-linux-gnu"; \
    else \
        echo "Unsupported architecture: $ARCH" && exit 1; \
    fi \
    && echo "Downloading Bitcoin Core for architecture: $BITCOIN_ARCH" \
    && wget https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/bitcoin-${BITCOIN_VERSION}-${BITCOIN_ARCH}.tar.gz \
    && wget https://bitcoincore.org/bin/bitcoin-core-${BITCOIN_VERSION}/SHA256SUMS \
    && grep bitcoin-${BITCOIN_VERSION}-${BITCOIN_ARCH}.tar.gz SHA256SUMS | sha256sum -c - \
    && tar -xzf bitcoin-${BITCOIN_VERSION}-${BITCOIN_ARCH}.tar.gz \
    && install -m 0755 -o root -g root -t /usr/local/bin bitcoin-${BITCOIN_VERSION}/bin/bitcoind bitcoin-${BITCOIN_VERSION}/bin/bitcoin-cli \
    && rm -rf /tmp/bitcoin-*

# Copy package files first
COPY package*.json ./

# Copy application files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Create startup script and set permissions
COPY start.sh /app/start.sh
RUN chmod 755 /app/start.sh

# Expose port
EXPOSE 3040

# Set entrypoint
ENTRYPOINT ["/app/start.sh"]
