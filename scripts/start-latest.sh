#!/bin/sh
# Production startup script with automatic database migrations

set -e  # Exit on error

echo "🚀 Starting Ivy.AI Platform v1.1.0 (Meta-Agent Architect Edition)..."
echo "📦 Package Version:"
grep '"version":' package.json

# Run database migrations (Critical for Railway persistence)
echo "📦 FAST BOOT: Syncing Database Schema..."
# Using db:push is safer for rapid iteration on Railway than migrate if snapshots are missing
pnpm db:push 

# Initialize DB if needed (seeds basic data if empty)
# node scripts/init-db.mjs

echo "✅ Database synced."

# Start the application
echo "✅ Starting application server (Direct Node Mode)..."
export NODE_ENV=production
# Bypass pnpm/npm and run node directly to ensure PID 1 and signal handling
exec node dist/index.js
