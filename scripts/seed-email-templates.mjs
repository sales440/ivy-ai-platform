#!/usr/bin/env node
/**
 * Seed Email Templates
 * Creates professional email templates for different scenarios
 */

import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seedEmailTemplates() {
  console.log('📧 Starting email templates seeding...\n');

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection established');

    // Get Demo Company ID
    const [companies] = await connection.query(
      'SELECT id FROM companies WHERE name LIKE "%Demo%" LIMIT 1'
    );
    
    if (!companies || companies.length === 0) {
      console.error('❌ Demo Company not found in database');
      process.exit(1);
    }

    const companyId = companies[0].id;
    console.log(`✓ Found Demo Company (ID: ${companyId})\n`);

    // Email templates for different scenarios
    const templates = [
      {
        id: uuidv4(),
        companyId,
        name: "Initial Outreach - Technology Sector",
        subject: "Streamline Your Operations with AI-Powered Solutions",
        body: `Hi {{leadName}},

I noticed that {{company}} is in the {{industry}} sector, and I wanted to reach out with something that could make a real difference for your team.

We specialize in AI-powered automation solutions that help companies like yours reduce operational costs by up to 40% while improving efficiency. Given your role as {{title}}, I thought this might be particularly relevant.

**What we offer:**
- Intelligent lead qualification and scoring
- Automated customer support with AI agents
- Real-time analytics and insights
- Seamless CRM integration

**Quick wins for {{company}}:**
- Reduce response time from hours to minutes
- Free up your team to focus on high-value tasks
- Scale operations without scaling headcount

Would you be open to a 15-minute call next week to explore how this could work for {{company}}? I'm based in {{location}} and happy to work around your schedule.

Best regards,
The Ivy.AI Team

P.S. We recently helped a similar company in your industry increase their conversion rate by 35% in just 3 months.`,
        type: "callback",
        variables: ["leadName", "company", "title", "industry", "location"],
        createdBy: 1,
        isActive: true
      },
      {
        id: uuidv4(),
        companyId,
        name: "Follow-up - Interested Lead",
        subject: "Next Steps for {{company}} - AI Implementation",
        body: `Hi {{leadName}},

Thank you for expressing interest in our AI-powered solutions! I'm excited to help {{company}} transform its operations.

Based on our conversation, here's what I propose:

**Immediate Next Steps:**
1. **Discovery Call** (30 min) - Deep dive into your current processes
2. **Custom Demo** (45 min) - Tailored to {{company}}'s specific needs
3. **Pilot Program** (30 days) - Risk-free trial with your team

**Timeline:**
- Week 1: Discovery & Requirements
- Week 2: Custom configuration
- Week 3-4: Pilot deployment
- Week 5: Results review & decision

**What You'll See:**
- 50% reduction in manual tasks
- Real-time visibility into operations
- Measurable ROI within 30 days

I've reserved a few slots for next week. Which of these works best for you?
- Tuesday, 2:00 PM
- Wednesday, 10:00 AM  
- Thursday, 3:00 PM

Looking forward to partnering with {{company}}!

Best,
The Ivy.AI Team`,
        type: "interested",
        variables: ["leadName", "company"],
        createdBy: 1,
        isActive: true
      },
      {
        id: uuidv4(),
        companyId,
        name: "Re-engagement - Not Interested",
        subject: "One Last Thing for {{company}}",
        body: `Hi {{leadName}},

I understand you're not interested right now, and I respect that. Before I close your file, I wanted to share one quick insight that might be valuable.

**Industry Trend Alert:**
Companies in {{industry}} that haven't adopted AI automation by 2026 are projected to face 25% higher operational costs compared to competitors. (Source: McKinsey 2024 Report)

**No pressure, but here's what we're offering:**
- Free 30-day pilot (no credit card required)
- Dedicated implementation support
- Cancel anytime, keep the insights

Even if you don't move forward with us, I'd love to send you our free guide: "{{industry}} Automation Playbook - 10 Quick Wins."

Would that be helpful?

Best regards,
The Ivy.AI Team

P.S. If timing is the issue, I'm happy to reconnect in Q2 2025. Just let me know!`,
        type: "notInterested",
        variables: ["leadName", "company", "industry"],
        createdBy: 1,
        isActive: true
      },
      {
        id: uuidv4(),
        companyId,
        name: "Voicemail Follow-up",
        subject: "Quick Follow-up - Tried to Reach You",
        body: `Hi {{leadName}},

I tried calling you earlier today but wasn't able to connect. No worries!

**Quick context:**
I'm reaching out because {{company}} fits the profile of organizations that benefit most from our AI automation platform. Companies in {{industry}} typically see:

- 40% reduction in operational costs
- 3x faster response times
- 60% improvement in customer satisfaction

**What I'd love to discuss:**
- Your current challenges with {{title}} responsibilities
- How AI can free up 15+ hours/week for your team
- A custom demo tailored to {{company}}'s needs

**Easy next step:**
Reply with "Yes" and I'll send you a calendar link to book a time that works for you. Or, if you prefer, I can call back at a specific time—just let me know!

Looking forward to connecting,
The Ivy.AI Team

P.S. Here's a 2-minute video showing how we helped a company like yours: [Demo Video Link]`,
        type: "voicemail",
        variables: ["leadName", "company", "title", "industry"],
        createdBy: 1,
        isActive: true
      },
      {
        id: uuidv4(),
        companyId,
        name: "Meeting Confirmation",
        subject: "Confirmed: {{company}} Discovery Call - {{date}}",
        body: `Hi {{leadName}},

Great news! Your discovery call is confirmed for:

**Date:** {{date}}
**Time:** {{time}}
**Duration:** 30 minutes
**Meeting Link:** [Zoom/Teams Link]

**What to Expect:**
1. Quick intro (5 min)
2. Your current challenges & goals (10 min)
3. Live demo of Ivy.AI platform (10 min)
4. Q&A and next steps (5 min)

**To make the most of our time, please have ready:**
- Current pain points in your {{title}} role
- Key metrics you'd like to improve
- Any specific questions about AI automation

**Can't make it?**
No problem! Just reply to this email and we'll reschedule.

See you soon!

Best,
The Ivy.AI Team

P.S. Feel free to invite anyone from your team who'd benefit from seeing this.`,
        type: "callback",
        variables: ["leadName", "company", "title", "date", "time"],
        createdBy: 1,
        isActive: true
      }
    ];

    console.log('📝 Creating email templates...\n');

    for (const template of templates) {
      await connection.query(
        `INSERT INTO emailCampaigns (companyId, name, subject, body, type, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          template.companyId,
          template.name,
          template.subject,
          template.body,
          template.type,
          template.createdBy
        ]
      );
      console.log(`✓ Created: ${template.name}`);
    }

    console.log(`\n🎉 Email templates seeding completed successfully!`);
    console.log(`📊 Summary: ${templates.length} professional email templates created`);
    console.log('\n✨ Templates are ready to use in your campaigns!');
    console.log('🔄 Refresh the Email Templates page to see them.');

  } catch (error) {
    console.error('\n❌ Seeding failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedEmailTemplates();
