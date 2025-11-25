# Multi-stage build for Ivy.AI Platform
# Cache bust: 2025-11-25 13:49:45 UTC - Force rebuild to include all scripts
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

# Declare build arguments for VITE variables
ARG VITE_APP_ID
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_APP_TITLE
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_FRONTEND_FORGE_API_URL
ARG VITE_APP_LOGO
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID

# Make them available as environment variables during build
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_FRONTEND_FORGE_API_KEY=$VITE_FRONTEND_FORGE_API_KEY
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application with VITE variables available
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
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts ./scripts
RUN chmod +x ./scripts/start-production.sh

# Set environment
ENV NODE_ENV=production

# Expose port (Railway uses dynamic PORT)
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with migrations
CMD ["sh", "scripts/start-production.sh"]
