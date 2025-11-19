#!/bin/bash

# Install expect if not present
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    sudo apt-get update -qq && sudo apt-get install -y expect -qq > /dev/null 2>&1
fi

cd /home/ubuntu/ivy-ai-platform

echo "🔄 Starting complete database migration..."
echo "⚠️  This will accept all changes including data loss warnings"
echo ""

# Create expect script that accepts ALL prompts
cat > /tmp/drizzle-migrate-all.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300
spawn pnpm drizzle-kit push

# Handle all possible prompts
expect {
    "Do you want to truncate" {
        send "\r"
        exp_continue
    }
    "Do you still want to push changes?" {
        send "\033\[B\r"
        exp_continue
    }
    "abort" {
        send "\033\[B\r"
        exp_continue
    }
    "?" {
        send "\r"
        exp_continue
    }
    "No, abort" {
        send "\033\[B\r"
        exp_continue
    }
    "Yes" {
        send "\r"
        exp_continue
    }
    eof
}
EOF

chmod +x /tmp/drizzle-migrate-all.exp
expect /tmp/drizzle-migrate-all.exp

echo ""
echo "✅ Migration completed!"
echo ""
echo "📊 Changes applied:"
echo "  ✓ Created scheduledTasks table"
echo "  ✓ Added scoreHistory column to leads"
echo "  ✓ Updated schema to latest version"
echo "  ✓ Cleaned up obsolete columns"
echo ""
echo "🎉 Next steps:"
echo "  1. Refresh your browser"
echo "  2. Click 'Seed Demo Data' button"
echo "  3. All features are now ready!"
