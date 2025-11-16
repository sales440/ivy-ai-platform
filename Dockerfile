# Multi-stage build for Ivy.AI Platform
FROM node:22-alpine AS base

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Set working directory
WORKDIR /app

# Copy package files and patches
COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

# Install dependencies
FROM base AS deps
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM node:22-alpine AS runner
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/index.js ./dist/
COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts/start-production.sh ./scripts/

# Set environment
ENV NODE_ENV=production

# Expose port (Railway uses dynamic PORT)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with migrations
CMD ["sh", "scripts/start-production.sh"]
