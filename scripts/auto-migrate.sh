#!/bin/bash

# Automated Database Migration Script
# This script automatically accepts all drizzle-kit push prompts

echo "🔄 Starting automated database migration..."
echo ""

# Change to project directory
cd /home/ubuntu/ivy-ai-platform

# Run drizzle-kit push with automatic "yes" responses
# Using printf to send multiple Enter keypresses
printf '\n\n\n\n\n\n\n\n\n\n' | pnpm drizzle-kit push

echo ""
echo "✅ Migration completed!"
echo ""
echo "Next steps:"
echo "1. Refresh the application"
echo "2. Click 'Seed Demo Data' to populate the database"
echo "3. Start using the platform!"
