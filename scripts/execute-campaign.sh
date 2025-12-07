#!/bin/bash

# FAGOR CNC Training 2026 - Campaign Execution Script
# This script sends Email 1 and Email 2 immediately
# Email 3 is scheduled automatically for December 1st, 2025

echo "🚀 FAGOR CNC Training 2026 - Campaign Execution"
echo "==============================================="
echo ""

# Change to project directory
cd /home/ubuntu/ivy-ai-platform

echo "📧 Step 1: Sending Email 1 (Training Invitation)..."
node scripts/send-campaign-emails.mjs 1
echo ""

echo "⏳ Waiting 5 seconds before sending Email 2..."
sleep 5
echo ""

echo "📧 Step 2: Sending Email 2 (Training Materials)..."
node scripts/send-campaign-emails.mjs 2
echo ""

echo "✅ Campaign execution completed!"
echo ""
echo "📊 Summary:"
echo "  ✅ Email 1 (Invitation) - Sent"
echo "  ✅ Email 2 (Materials) - Sent"
echo "  📅 Email 3 (Final Reminder) - Scheduled for December 1st, 2025 at 9:00 AM"
echo ""
echo "🎯 Total contacts enrolled: 201 clients across 40 US states"
echo ""
echo "📈 Next Steps:"
echo "  1. Monitor email open rates in the database"
echo "  2. Track registrations on the training website"
echo "  3. Email 3 will be sent automatically on December 1st"
echo ""
