#!/bin/sh
# Production startup script with automatic database migrations

set -e  # Exit on error

echo "🚀 Starting Ivy.AI Platform..."

# Run database migrations
echo "📦 Running database migrations..."
pnpm db:push || echo "⚠️  Migration failed or no changes needed"

# Start the application
echo "✅ Starting application server..."
exec pnpm start
