FROM oven/bun:1

WORKDIR /app

# Install system tools
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install kubectl
RUN curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl" \
    && install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl \
    && rm kubectl

# Install dependencies
COPY package.json bun.lockb* bun.lock* ./
RUN bun install

# Copy source
COPY . .

# Prisma 7 generate needs DATABASE_URL available at build time
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgeops
ENV DATABASE_URL=${DATABASE_URL}

RUN bunx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", "start"]