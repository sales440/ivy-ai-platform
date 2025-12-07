#!/bin/bash
# Railway Database Migration Script
# This script runs database migrations after deployment

set -e  # Exit on error

echo "🚀 Starting Railway database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Run drizzle migrations
echo "📦 Running drizzle-kit generate..."
pnpm drizzle-kit generate

echo "🔄 Running drizzle-kit migrate..."
pnpm drizzle-kit migrate

echo "✅ Database migrations completed successfully!"

# Optional: Run seed data for demo (comment out for production)
# echo "🌱 Seeding demo data..."
# node scripts/seed-demo.mjs

echo "🎉 All done! Database is ready."
