# Multi-stage build for Ivy.AI Platform
# Cache bust: 2025-12-16 - Fix Missing Deps Stage

# 1. Install Dependencies only when needed
FROM node:22-alpine AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@10.4.1

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
# "Nuclear" option logic: if lockfile exists, use it; otherwise install.
# We removed --frozen-lockfile to allow fixing drift.
RUN \
    if [ -f pnpm-lock.yaml ]; then pnpm install; \
    else echo "Lockfile not found." && pnpm install; \
    fi

# 2. Rebuild the source code only when needed
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Declare build args
ARG VITE_APP_ID
ARG VITE_OAUTH_PORTAL_URL
ARG VITE_APP_TITLE
ARG VITE_FRONTEND_FORGE_API_KEY
ARG VITE_FRONTEND_FORGE_API_URL
ARG VITE_APP_LOGO
ARG VITE_ANALYTICS_ENDPOINT
ARG VITE_ANALYTICS_WEBSITE_ID

# Set ENV for build time
ENV VITE_APP_ID=$VITE_APP_ID
ENV VITE_OAUTH_PORTAL_URL=$VITE_OAUTH_PORTAL_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE
ENV VITE_FRONTEND_FORGE_API_KEY=$VITE_FRONTEND_FORGE_API_KEY
ENV VITE_FRONTEND_FORGE_API_URL=$VITE_FRONTEND_FORGE_API_URL
ENV VITE_APP_LOGO=$VITE_APP_LOGO
ENV VITE_ANALYTICS_ENDPOINT=$VITE_ANALYTICS_ENDPOINT
ENV VITE_ANALYTICS_WEBSITE_ID=$VITE_ANALYTICS_WEBSITE_ID

# Build
RUN npm install -g pnpm@10.4.1
RUN pnpm run build

# 3. Production image, copy all the files and run next
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm (needed for start/scripts if they use pnpm, otherwise node is fine)
RUN npm install -g pnpm@10.4.1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 reactjs

# Copy necessary files for production
COPY --from=builder /app/package.json ./
# Copy dependencies again (prod ones) or reuse builder's? reusing builder's is easier for now to ensure all deps exist.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/index.js ./dist/
COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/server ./server
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/campaigns ./campaigns

RUN chown -R reactjs:nodejs /app
USER reactjs

EXPOSE ${PORT:-3000}

CMD ["sh", "scripts/start-latest.sh"]
