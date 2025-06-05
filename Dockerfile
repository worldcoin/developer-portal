# Dockerfile
FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
  libssl-dev \
  ca-certificates \
  build-essential \
  python3 \
  && rm -rf /var/lib/apt/lists/*
  
# Install Node.js and pnpm dependencies
RUN apt-get update && apt-get install -y curl gnupg git \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm@9

# Create app directory and copy source
WORKDIR /app/web
COPY web /app/web

# Install dependencies
RUN pnpm install --frozen-lockfile

# Run tests
CMD ["pnpm", "test:api"]