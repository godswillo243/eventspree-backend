

FROM node:22-bookworm-slim

# Enable pnpm through Corepack

RUN corepack enable && corepack prepare pnpm@10.28.0 --activate

WORKDIR /app

# Install dependencies using the existing lockfile
COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

# Copy application source and migration files
COPY . .

# Compile TypeScript
RUN pnpm build

# Expose the application port
EXPOSE 5000

# Start Express
CMD ["node", "dist/index.mjs"]
