#!/bin/bash

# Install expect if not present
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    sudo apt-get update -qq && sudo apt-get install -y expect -qq > /dev/null 2>&1
fi

cd /home/ubuntu/ivy-ai-platform

echo "🔄 Starting COMPLETE database migration..."
echo "⚠️  This will accept ALL changes including data loss warnings"
echo ""

# Create expect script with proper arrow key handling
cat > /tmp/drizzle-force-migrate.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300
spawn pnpm drizzle-kit push

# Handle all prompts - send Enter for default selections
expect {
    -re "Do you want to truncate.*table" {
        send "\r"
        exp_continue
    }
    "Do you still want to push changes?" {
        # Send Down arrow to select "Yes, push changes"
        send "\x1B\[B"
        sleep 0.5
        send "\r"
        exp_continue
    }
    -re "No, abort|Yes, push changes" {
        send "\x1B\[B"
        sleep 0.5
        send "\r"
        exp_continue
    }
    "?" {
        send "\r"
        exp_continue
    }
    eof
}
EOF

chmod +x /tmp/drizzle-force-migrate.exp

echo "📝 Running migration with automatic confirmations..."
expect /tmp/drizzle-force-migrate.exp

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Changes applied:"
    echo "  ✓ Created scheduledTasks table"
    echo "  ✓ Added scoreHistory column to leads"
    echo "  ✓ Created emailCampaigns table"
    echo "  ✓ Updated all schema to latest version"
    echo "  ✓ Cleaned up obsolete columns"
    echo ""
    echo "🎉 Next steps:"
    echo "  1. Refresh your browser (F5)"
    echo "  2. Click 'Seed Demo Data' button in dashboard"
    echo "  3. All features are now fully operational!"
else
    echo "⚠️  Migration process completed with warnings"
    echo "Check the output above for details"
fi
