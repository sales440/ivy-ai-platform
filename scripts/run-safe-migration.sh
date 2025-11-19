#!/bin/bash

echo "🔄 Starting safe database migration..."
echo ""

cd /home/ubuntu/ivy-ai-platform

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract MySQL connection parameters from DATABASE_URL
# Format: mysql://user:password@host:port/database
DB_URL=$DATABASE_URL

# Use mysql client to execute the safe migration SQL
echo "📝 Executing safe migration SQL..."
mysql --defaults-extra-file=<(echo "[client]"; echo "password=${DB_URL#*:*:}") \
      -h "$(echo $DB_URL | sed -n 's/.*@\(.*\):.*/\1/p')" \
      -u "$(echo $DB_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')" \
      "$(echo $DB_URL | sed -n 's/.*\/\(.*\)/\1/p')" \
      < /home/ubuntu/ivy-ai-platform/scripts/safe-migration.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Safe migration completed successfully!"
    echo ""
    echo "📊 Changes applied:"
    echo "  ✓ Created scheduledTasks table"
    echo "  ✓ Added scoreHistory column to leads table"
    echo "  ✓ Created emailCampaigns table"
    echo ""
    echo "🎉 Next steps:"
    echo "  1. Refresh your browser"
    echo "  2. Click 'Seed Demo Data' to populate the database"
    echo "  3. Start using all features!"
else
    echo ""
    echo "❌ Migration failed. Check the error messages above."
    exit 1
fi
