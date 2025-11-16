/**
 * Database Initialization Script
 * Run this after deploying to Railway to set up initial data
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

async function initializeDatabase() {
  console.log("🚀 Starting database initialization...\n");

  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);

    console.log("✅ Database connection established");

    // Check if tables exist
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'users'"
    );

    if (tables.length === 0) {
      console.log("⚠️  Tables not found. Please run 'pnpm db:push' first.");
      process.exit(1);
    }

    console.log("✅ Database tables verified");

    // Initialize knowledge base with sample articles
    console.log("\n📚 Initializing knowledge base...");
    
    const sampleArticles = [
      {
        articleId: "kb-001",
        title: "How to Reset Your Password",
        content: "To reset your password: 1. Go to login page, 2. Click 'Forgot Password', 3. Enter your email, 4. Check your inbox for reset link, 5. Follow the link and create a new password.",
        category: "account",
        tags: JSON.stringify(["password", "account", "security"]),
        viewCount: 0,
        helpfulCount: 0,
        createdBy: 0
      },
      {
        articleId: "kb-002",
        title: "Getting Started with Ivy.AI",
        content: "Welcome to Ivy.AI! This platform provides intelligent automation through specialized AI agents. Start by exploring the dashboard, then try executing commands in the console or creating workflows.",
        category: "getting_started",
        tags: JSON.stringify(["tutorial", "basics", "introduction"]),
        viewCount: 0,
        helpfulCount: 0,
        createdBy: 0
      },
      {
        articleId: "kb-003",
        title: "Understanding AI Agents",
        content: "Ivy.AI includes 6 specialized agents: Ivy-Prospect (sales leads), Ivy-Closer (deal closing), Ivy-Solve (customer support), Ivy-Logic (operations), Ivy-Talent (HR), and Ivy-Insight (strategy). Each agent has unique capabilities and KPIs.",
        category: "features",
        tags: JSON.stringify(["agents", "features", "capabilities"]),
        viewCount: 0,
        helpfulCount: 0,
        createdBy: 0
      },
      {
        articleId: "kb-004",
        title: "Troubleshooting Common Issues",
        content: "Common issues and solutions: 1. Agent not responding - Check system status, 2. Workflow stuck - Review execution logs, 3. Data not syncing - Verify database connection, 4. Performance slow - Check system metrics.",
        category: "troubleshooting",
        tags: JSON.stringify(["troubleshooting", "errors", "support"]),
        viewCount: 0,
        helpfulCount: 0,
        createdBy: 0
      },
      {
        articleId: "kb-005",
        title: "API Integration Guide",
        content: "Integrate Ivy.AI with your systems using our tRPC API. Available endpoints: agents.*, workflows.*, leads.*, tickets.*, analytics.*. Authentication is handled via session cookies.",
        category: "integration",
        tags: JSON.stringify(["api", "integration", "development"]),
        viewCount: 0,
        helpfulCount: 0,
        createdBy: 0
      }
    ];

    for (const article of sampleArticles) {
      await connection.query(
        `INSERT INTO knowledgeBase (articleId, title, content, category, tags, viewCount, helpfulCount, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
         title = VALUES(title),
         content = VALUES(content),
         category = VALUES(category),
         tags = VALUES(tags)`,
        [
          article.articleId,
          article.title,
          article.content,
          article.category,
          article.tags,
          article.viewCount,
          article.helpfulCount,
          article.createdBy
        ]
      );
    }

    console.log(`✅ Initialized ${sampleArticles.length} knowledge base articles`);

    // Initialize system metrics
    console.log("\n📊 Initializing system metrics...");
    
    await connection.query(
      `INSERT INTO systemMetrics (metricId, metricName, metricValue, category, timestamp)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       metricValue = VALUES(metricValue),
       timestamp = VALUES(timestamp)`,
      ["system-health", "System Health", 100, "health"]
    );

    await connection.query(
      `INSERT INTO systemMetrics (metricId, metricName, metricValue, category, timestamp)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
       metricValue = VALUES(metricValue),
       timestamp = VALUES(timestamp)`,
      ["total-agents", "Total Agents", 6, "agents"]
    );

    console.log("✅ System metrics initialized");

    console.log("\n🎉 Database initialization completed successfully!");
    console.log("\n📝 Next steps:");
    console.log("  1. Verify the application is running");
    console.log("  2. Test agent functionality");
    console.log("  3. Create your first workflow");
    console.log("  4. Monitor system metrics\n");

  } catch (error) {
    console.error("\n❌ Error during initialization:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run initialization
initializeDatabase();
