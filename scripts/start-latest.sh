#!/bin/sh
# Production startup script with automatic database migrations

set -e  # Exit on error

echo "🚀 Starting Ivy.AI Platform v1.0.3 (Deployment Fix)..."
echo "📦 Package Version:"
grep '"version":' package.json

# Run database migrations (Moved to inside application for FAST BOOT)
echo "📦 FAST BOOT: Skipping external migrations to open port immediately..."
# pnpm db:migrate
# node scripts/fix-notifications.mjs
# node scripts/create-fagor-tables.mjs
# node scripts/create-scheduled-tasks.mjs

# Start the application
echo "✅ Starting application server..."
exec pnpm start
