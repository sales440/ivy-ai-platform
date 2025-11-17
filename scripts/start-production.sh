#!/bin/sh
# Production startup script with automatic database migrations

set -e  # Exit on error

echo "🚀 Starting Ivy.AI Platform..."

# Run database migrations
echo "📦 Running database migrations..."
pnpm db:push || echo "⚠️  Migration failed or no changes needed"

# Ensure notifications table exists
echo "🔔 Ensuring notifications table exists..."
node scripts/fix-notifications.mjs || echo "⚠️  Notifications table check failed"

# Start the application
echo "✅ Starting application server..."
exec pnpm start
