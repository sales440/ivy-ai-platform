#!/bin/sh
# Production startup script with automatic database migrations

set -e  # Exit on error

echo "🚀 Starting Ivy.AI Platform v1.0.3 (Deployment Fix)..."
echo "📦 Package Version:"
grep '"version":' package.json

# Run database migrations
echo "📦 Running database migrations..."
pnpm db:migrate || echo "⚠️  Migration failed or no changes needed"

# Ensure notifications table exists
echo "🔔 Ensuring notifications table exists..."
node scripts/fix-notifications.mjs || echo "⚠️  Notifications table check failed"

# Create FAGOR tables if they don't exist
echo "📊 Creating FAGOR campaign tables..."
node scripts/create-fagor-tables.mjs || echo "⚠️  FAGOR tables creation failed or already exist"

# Ensure scheduledTasks table exists (Fix for missing migration)
echo "📋 Checking scheduledTasks table..."
node scripts/create-scheduled-tasks.mjs || echo "⚠️  scheduledTasks table check failed"


# Start the application
echo "✅ Starting application server..."
exec pnpm start
