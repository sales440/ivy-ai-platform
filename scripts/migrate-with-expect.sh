#!/bin/bash

# Install expect if not present
if ! command -v expect &> /dev/null; then
    echo "Installing expect..."
    sudo apt-get update -qq && sudo apt-get install -y expect -qq
fi

cd /home/ubuntu/ivy-ai-platform

# Create expect script
cat > /tmp/drizzle-migrate.exp << 'EOF'
#!/usr/bin/expect -f

set timeout 300
spawn pnpm drizzle-kit push

# Handle all prompts by sending Enter (selecting default option)
expect {
    "Do you want to truncate" {
        send "\r"
        exp_continue
    }
    "Do you want to proceed" {
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

chmod +x /tmp/drizzle-migrate.exp
expect /tmp/drizzle-migrate.exp

echo ""
echo "✅ Migration completed!"
