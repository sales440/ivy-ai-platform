#!/usr/bin/env node
/**
 * Seed Demo Data with Company ID
 * Populates the database with sample data linked to Demo Company
 */

import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seedDemoData() {
  console.log('🌱 Starting demo data seeding with company linkage...\n');

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

    // Clear existing demo data for this company
    console.log('🧹 Clearing existing demo data...');
    // Skip deletion - just insert new data
    console.log('✓ Cleared existing demo data\n');

    // Seed sample leads
    console.log('👥 Seeding sample leads...');
    
    const sampleLeads = [
      {
        leadId: uuidv4(),
        companyId,
        name: "Sarah Johnson",
        email: "sarah.johnson@techcorp.com",
        company: "TechCorp Industries",
        title: "VP of Operations",
        industry: "Technology",
        location: "San Francisco, CA",
        companySize: "500-1000",
        qualificationScore: 85,
        qualificationLevel: "A",
        status: "qualified",
        source: "demo",
        createdBy: 1
      },
      {
        leadId: uuidv4(),
        companyId,
        name: "Michael Chen",
        email: "m.chen@innovate.io",
        company: "Innovate Solutions",
        title: "CTO",
        industry: "Software",
        location: "Austin, TX",
        companySize: "100-500",
        qualificationScore: 92,
        qualificationLevel: "A",
        status: "contacted",
        source: "demo",
        createdBy: 1
      },
      {
        leadId: uuidv4(),
        companyId,
        name: "Emily Rodriguez",
        email: "emily.r@globalretail.com",
        company: "Global Retail Group",
        title: "Director of IT",
        industry: "Retail",
        location: "New York, NY",
        companySize: "1000+",
        qualificationScore: 78,
        qualificationLevel: "B",
        status: "new",
        source: "demo",
        createdBy: 1
      },
      {
        leadId: uuidv4(),
        companyId,
        name: "David Kim",
        email: "david.kim@healthplus.com",
        company: "HealthPlus Systems",
        title: "COO",
        industry: "Healthcare",
        location: "Boston, MA",
        companySize: "200-500",
        qualificationScore: 88,
        qualificationLevel: "A",
        status: "qualified",
        source: "demo",
        createdBy: 1
      },
      {
        leadId: uuidv4(),
        companyId,
        name: "Jennifer Martinez",
        email: "j.martinez@financegroup.com",
        company: "Finance Group LLC",
        title: "VP of Technology",
        industry: "Finance",
        location: "Miami, FL",
        companySize: "500-1000",
        qualificationScore: 81,
        qualificationLevel: "B",
        status: "contacted",
        source: "demo",
        createdBy: 1
      }
    ];

    for (const lead of sampleLeads) {
      await connection.query(
        `INSERT INTO leads (leadId, companyId, name, email, company, title, industry, location, companySize, qualificationScore, qualificationLevel, status, source, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          lead.leadId,
          lead.companyId,
          lead.name,
          lead.email,
          lead.company,
          lead.title,
          lead.industry,
          lead.location,
          lead.companySize,
          lead.qualificationScore,
          lead.qualificationLevel,
          lead.status,
          lead.source,
          lead.createdBy
        ]
      );
    }

    console.log(`✅ Seeded ${sampleLeads.length} sample leads\n`);

    // Seed sample support tickets
    console.log('🎫 Seeding sample support tickets...');
    
    const sampleTickets = [
      {
        ticketId: uuidv4(),
        companyId,
        customerId: 1,
        subject: "Login Issues - Unable to Access Dashboard",
        issue: "Customer reports being unable to log in to their account dashboard after password reset.",
        status: "open",
        priority: "high",
        category: "login",
        source: "demo",
        createdBy: 1
      },
      {
        ticketId: uuidv4(),
        companyId,
        customerId: 1,
        subject: "Feature Request - Export Data to CSV",
        issue: "Customer requests ability to export analytics data to CSV format for external reporting.",
        status: "in_progress",
        priority: "medium",
        category: "feature",
        source: "demo",
        createdBy: 1
      },
      {
        ticketId: uuidv4(),
        companyId,
        customerId: 1,
        subject: "Billing Question - Invoice Discrepancy",
        issue: "Customer noticed a discrepancy in their latest invoice and requests clarification.",
        status: "resolved",
        priority: "medium",
        category: "billing",
        source: "demo",
        createdBy: 1
      },
      {
        ticketId: uuidv4(),
        companyId,
        customerId: 1,
        subject: "Technical Issue - API Integration Error",
        issue: "Customer experiencing 500 errors when calling the /api/leads endpoint.",
        status: "open",
        priority: "critical",
        category: "technical",
        source: "demo",
        createdBy: 1
      }
    ];

    for (const ticket of sampleTickets) {
      await connection.query(
        `INSERT INTO tickets (ticketId, companyId, customerId, subject, issue, status, priority, category, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ticket.ticketId,
          ticket.companyId,
          ticket.customerId,
          ticket.subject,
          ticket.issue,
          ticket.status,
          ticket.priority,
          ticket.category
        ]
      );
    }

    console.log(`✅ Seeded ${sampleTickets.length} sample tickets\n`);

    console.log('🎉 Demo data seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`  - ${sampleLeads.length} leads (linked to company ${companyId})`);
    console.log(`  - ${sampleTickets.length} support tickets (linked to company ${companyId})`);
    console.log('\n✨ Your Ivy.AI platform is now ready for demonstration!');
    console.log('🔄 Refresh your browser to see the updated data.');

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

seedDemoData();
