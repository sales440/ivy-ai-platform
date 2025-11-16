/**
 * Seed Demo Data Script
 * Populates the database with sample data for demonstration
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function seedDemoData() {
  console.log("🌱 Starting demo data seeding...\n");

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("✅ Database connection established");

    // Seed sample leads
    console.log("\n👥 Seeding sample leads...");
    
    const sampleLeads = [
      {
        leadId: uuidv4(),
        name: "John Smith",
        email: "john.smith@techcorp.com",
        company: "TechCorp Inc",
        title: "CTO",
        industry: "Technology",
        location: "San Francisco, CA",
        companySize: "200-500",
        qualificationScore: 85,
        qualificationLevel: "A",
        status: "qualified",
        source: "ai_generated",
        createdBy: 0
      },
      {
        leadId: uuidv4(),
        name: "Sarah Johnson",
        email: "sarah.j@innovate.io",
        company: "Innovate Solutions",
        title: "VP of Operations",
        industry: "SaaS",
        location: "New York, NY",
        companySize: "100-200",
        qualificationScore: 78,
        qualificationLevel: "B",
        status: "contacted",
        source: "ai_generated",
        createdBy: 0
      },
      {
        leadId: uuidv4(),
        name: "Michael Chen",
        email: "m.chen@globalventures.com",
        company: "Global Ventures",
        title: "Director of Sales",
        industry: "Finance",
        location: "Chicago, IL",
        companySize: "500-1000",
        qualificationScore: 92,
        qualificationLevel: "A",
        status: "new",
        source: "ai_generated",
        createdBy: 0
      }
    ];

    for (const lead of sampleLeads) {
      await connection.query(
        `INSERT INTO leads (leadId, name, email, company, title, industry, location, companySize, qualificationScore, qualificationLevel, status, source, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          lead.leadId,
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

    console.log(`✅ Seeded ${sampleLeads.length} sample leads`);

    // Seed sample tickets
    console.log("\n🎫 Seeding sample support tickets...");
    
    const sampleTickets = [
      {
        ticketId: uuidv4(),
        customerId: 1,
        customerEmail: "customer1@example.com",
        subject: "Unable to login to dashboard",
        issue: "I'm getting an error when trying to log in. The page just refreshes and doesn't show any error message.",
        category: "technical",
        priority: "high",
        status: "open",
        assignedTo: 0
      },
      {
        ticketId: uuidv4(),
        customerId: 2,
        customerEmail: "customer2@example.com",
        subject: "Question about pricing plans",
        issue: "What's the difference between the Pro and Enterprise plans? I need to know if Enterprise includes API access.",
        category: "billing",
        priority: "medium",
        status: "in_progress",
        assignedTo: 0
      },
      {
        ticketId: uuidv4(),
        customerId: 3,
        customerEmail: "customer3@example.com",
        subject: "Feature request: Export to CSV",
        issue: "It would be great to have an option to export analytics data to CSV format for reporting.",
        category: "general",
        priority: "low",
        status: "open",
        assignedTo: 0
      }
    ];

    for (const ticket of sampleTickets) {
      await connection.query(
        `INSERT INTO tickets (ticketId, customerId, customerEmail, subject, issue, category, priority, status, assignedTo, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          ticket.ticketId,
          ticket.customerId,
          ticket.customerEmail,
          ticket.subject,
          ticket.issue,
          ticket.category,
          ticket.priority,
          ticket.status,
          ticket.assignedTo
        ]
      );
    }

    console.log(`✅ Seeded ${sampleTickets.length} sample tickets`);

    // Seed agent communications
    console.log("\n💬 Seeding agent communications...");
    
    const sampleCommunications = [
      {
        communicationId: uuidv4(),
        fromAgent: "prospect",
        toAgent: "closer",
        messageType: "handoff",
        content: JSON.stringify({
          lead: sampleLeads[0].leadId,
          message: "High-quality lead qualified and ready for closing"
        }),
        status: "delivered"
      },
      {
        communicationId: uuidv4(),
        fromAgent: "solve",
        toAgent: "hive",
        messageType: "escalation",
        content: JSON.stringify({
          ticket: sampleTickets[0].ticketId,
          reason: "Requires technical expertise"
        }),
        status: "delivered"
      }
    ];

    for (const comm of sampleCommunications) {
      await connection.query(
        `INSERT INTO agentCommunications (communicationId, fromAgent, toAgent, messageType, content, status, sentAt)
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          comm.communicationId,
          comm.fromAgent,
          comm.toAgent,
          comm.messageType,
          comm.content,
          comm.status
        ]
      );
    }

    console.log(`✅ Seeded ${sampleCommunications.length} agent communications`);

    console.log("\n🎉 Demo data seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`  - ${sampleLeads.length} leads`);
    console.log(`  - ${sampleTickets.length} support tickets`);
    console.log(`  - ${sampleCommunications.length} agent communications`);
    console.log("\n✨ Your Ivy.AI platform is now ready for demonstration!\n");

  } catch (error) {
    console.error("\n❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run seeding
seedDemoData();
