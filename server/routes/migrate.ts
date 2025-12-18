import { Router } from "express";
import { getDb } from "../db";

const router = Router();

/**
 * Migration endpoint to sync database schema with Drizzle schema
 * This adds missing columns to existing tables
 */
router.post("/migrate", async (req, res) => {
  // Simple auth check - only allow with secret key
  const authKey = req.headers["x-migrate-key"];
  const expectedKey = process.env.MIGRATE_SECRET_KEY || "ivy-migrate-2024";
  
  if (authKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const db = await getDb();
  if (!db) {
    return res.status(500).json({ error: "Database not available" });
  }

  const results: { table: string; column: string; status: string }[] = [];
  const errors: { table: string; column: string; error: string }[] = [];

  // Helper function to add column if not exists
  async function addColumnIfNotExists(
    table: string,
    column: string,
    definition: string
  ) {
    try {
      // Check if column exists
      const [columns] = await db.execute(`SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`);
      
      if (Array.isArray(columns) && columns.length === 0) {
        // Column doesn't exist, add it
        await db.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        results.push({ table, column, status: "added" });
      } else {
        results.push({ table, column, status: "exists" });
      }
    } catch (error: any) {
      // Table might not exist
      if (error.code === "ER_NO_SUCH_TABLE") {
        results.push({ table, column, status: "table_not_found" });
      } else {
        errors.push({ table, column, error: error.message });
      }
    }
  }

  // Helper function to create table if not exists
  async function createTableIfNotExists(table: string, createSQL: string) {
    try {
      await db.execute(createSQL);
      results.push({ table, column: "*", status: "table_created_or_exists" });
    } catch (error: any) {
      errors.push({ table, column: "*", error: error.message });
    }
  }

  try {
    console.log("[Migration] Starting database schema sync...");

    // ============================================
    // COMPANIES TABLE - Add missing columns
    // ============================================
    await addColumnIfNotExists("companies", "slug", "VARCHAR(255) UNIQUE AFTER name");
    await addColumnIfNotExists("companies", "industry", "VARCHAR(100) AFTER slug");
    await addColumnIfNotExists("companies", "plan", "ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter' AFTER industry");
    await addColumnIfNotExists("companies", "logo", "TEXT AFTER plan");
    await addColumnIfNotExists("companies", "website", "VARCHAR(500) AFTER logo");
    await addColumnIfNotExists("companies", "contactEmail", "VARCHAR(320) AFTER website");
    await addColumnIfNotExists("companies", "contactPhone", "VARCHAR(50) AFTER contactEmail");
    await addColumnIfNotExists("companies", "address", "TEXT AFTER contactPhone");
    await addColumnIfNotExists("companies", "isActive", "BOOLEAN DEFAULT TRUE AFTER address");

    // Update existing rows to have a slug if null
    try {
      await db.execute(`
        UPDATE companies 
        SET slug = LOWER(REPLACE(REPLACE(name, ' ', '-'), '.', '')) 
        WHERE slug IS NULL OR slug = ''
      `);
      results.push({ table: "companies", column: "slug", status: "updated_null_values" });
    } catch (e: any) {
      errors.push({ table: "companies", column: "slug_update", error: e.message });
    }

    // ============================================
    // USERS TABLE - Add missing columns
    // ============================================
    await addColumnIfNotExists("users", "companyId", "INT AFTER id");

    // ============================================
    // USER_COMPANIES TABLE
    // ============================================
    await createTableIfNotExists("userCompanies", `
      CREATE TABLE IF NOT EXISTS userCompanies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        companyId INT NOT NULL,
        role ENUM('viewer', 'analyst', 'member', 'manager', 'admin') DEFAULT 'member' NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        UNIQUE KEY unique_user_company (userId, companyId)
      )
    `);

    // ============================================
    // USER_PREFERENCES TABLE
    // ============================================
    await createTableIfNotExists("userPreferences", `
      CREATE TABLE IF NOT EXISTS userPreferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        theme ENUM('light', 'dark', 'system') DEFAULT 'dark' NOT NULL,
        language VARCHAR(10) DEFAULT 'en' NOT NULL,
        notificationsEnabled BOOLEAN DEFAULT TRUE NOT NULL,
        emailNotifications BOOLEAN DEFAULT TRUE NOT NULL,
        workflowNotifications BOOLEAN DEFAULT TRUE NOT NULL,
        leadNotifications BOOLEAN DEFAULT TRUE NOT NULL,
        ticketNotifications BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // ============================================
    // NOTIFICATIONS TABLE
    // ============================================
    await createTableIfNotExists("notifications", `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error') DEFAULT 'info' NOT NULL,
        category ENUM('workflow', 'agent', 'lead', 'ticket', 'system') NOT NULL,
        relatedId VARCHAR(64),
        isRead BOOLEAN DEFAULT FALSE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_user_read (userId, isRead)
      )
    `);

    // ============================================
    // AGENTS TABLE
    // ============================================
    await createTableIfNotExists("agents", `
      CREATE TABLE IF NOT EXISTS agents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT,
        agentId VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        type ENUM('prospect', 'closer', 'solve', 'logic', 'talent', 'insight') NOT NULL,
        department ENUM('sales', 'marketing', 'customer_service', 'operations', 'hr', 'strategy') NOT NULL,
        status ENUM('idle', 'active', 'training', 'error') DEFAULT 'idle' NOT NULL,
        capabilities JSON NOT NULL,
        kpis JSON NOT NULL,
        configuration JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_type (type),
        INDEX idx_status (status)
      )
    `);

    // ============================================
    // TASKS TABLE
    // ============================================
    await createTableIfNotExists("tasks", `
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        taskId VARCHAR(64) NOT NULL UNIQUE,
        agentId INT NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
        input JSON NOT NULL,
        output JSON,
        error TEXT,
        executionTime INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completedAt TIMESTAMP,
        INDEX idx_agent (agentId),
        INDEX idx_status (status)
      )
    `);

    // ============================================
    // WORKFLOWS TABLE
    // ============================================
    await createTableIfNotExists("workflows", `
      CREATE TABLE IF NOT EXISTS workflows (
        id INT AUTO_INCREMENT PRIMARY KEY,
        workflowId VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        steps JSON NOT NULL,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // ============================================
    // WORKFLOW_EXECUTIONS TABLE
    // ============================================
    await createTableIfNotExists("workflowExecutions", `
      CREATE TABLE IF NOT EXISTS workflowExecutions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        executionId VARCHAR(64) NOT NULL UNIQUE,
        workflowId INT NOT NULL,
        status ENUM('running', 'completed', 'failed', 'interrupted') DEFAULT 'running' NOT NULL,
        initialData JSON NOT NULL,
        results JSON,
        currentStep INT DEFAULT 0,
        totalSteps INT NOT NULL,
        error TEXT,
        startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        completedAt TIMESTAMP,
        INDEX idx_workflow (workflowId),
        INDEX idx_status (status)
      )
    `);

    // ============================================
    // LEADS TABLE
    // ============================================
    await createTableIfNotExists("leads", `
      CREATE TABLE IF NOT EXISTS leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT,
        leadId VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        email VARCHAR(320),
        company VARCHAR(200),
        title VARCHAR(200),
        industry VARCHAR(100),
        location VARCHAR(200),
        companySize VARCHAR(50),
        qualificationScore INT DEFAULT 0,
        qualificationLevel ENUM('A', 'B', 'C', 'D'),
        scoreHistory JSON,
        status ENUM('new', 'contacted', 'qualified', 'nurture', 'converted', 'lost') DEFAULT 'new' NOT NULL,
        source VARCHAR(100),
        prospectSearchId INT,
        metadata JSON,
        assignedTo INT,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_status (status),
        INDEX idx_score (qualificationScore)
      )
    `);

    // ============================================
    // TICKETS TABLE
    // ============================================
    await createTableIfNotExists("tickets", `
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT,
        ticketId VARCHAR(64) NOT NULL UNIQUE,
        customerId INT,
        customerEmail VARCHAR(320),
        subject VARCHAR(300) NOT NULL,
        issue TEXT NOT NULL,
        category ENUM('login', 'billing', 'technical', 'feature_request', 'account', 'general'),
        priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' NOT NULL,
        status ENUM('open', 'in_progress', 'resolved', 'escalated', 'closed') DEFAULT 'open' NOT NULL,
        assignedTo INT,
        resolution TEXT,
        resolutionTime INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_status (status),
        INDEX idx_priority (priority)
      )
    `);

    // ============================================
    // AGENT_MEMORY TABLE (for RAG)
    // ============================================
    await createTableIfNotExists("agentMemory", `
      CREATE TABLE IF NOT EXISTS agentMemory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        memoryId VARCHAR(64) NOT NULL UNIQUE,
        agentId INT NOT NULL,
        companyId INT,
        campaignId INT,
        memoryType ENUM('instruction', 'context', 'feedback', 'learning', 'interaction') NOT NULL,
        content TEXT NOT NULL,
        embedding JSON,
        metadata JSON,
        relevanceScore DECIMAL(5,4) DEFAULT 1.0000,
        accessCount INT DEFAULT 0,
        lastAccessed TIMESTAMP,
        expiresAt TIMESTAMP,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_agent (agentId),
        INDEX idx_company (companyId),
        INDEX idx_campaign (campaignId),
        INDEX idx_type (memoryType),
        INDEX idx_active (isActive)
      )
    `);

    // ============================================
    // INTERACTION_LOGS TABLE
    // ============================================
    await createTableIfNotExists("interactionLogs", `
      CREATE TABLE IF NOT EXISTS interactionLogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        logId VARCHAR(64) NOT NULL UNIQUE,
        agentId INT NOT NULL,
        userId INT,
        companyId INT,
        sessionId VARCHAR(64),
        interactionType ENUM('chat', 'task', 'training', 'feedback', 'system') NOT NULL,
        input TEXT NOT NULL,
        output TEXT,
        tokensUsed INT,
        latencyMs INT,
        success BOOLEAN DEFAULT TRUE,
        errorMessage TEXT,
        metadata JSON,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_agent (agentId),
        INDEX idx_session (sessionId),
        INDEX idx_type (interactionType)
      )
    `);

    // ============================================
    // TRAINING_HISTORY TABLE
    // ============================================
    await createTableIfNotExists("trainingHistory", `
      CREATE TABLE IF NOT EXISTS trainingHistory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        trainingId VARCHAR(64) NOT NULL UNIQUE,
        agentId INT NOT NULL,
        companyId INT,
        version INT NOT NULL,
        trainingType ENUM('initial', 'update', 'feedback', 'correction') NOT NULL,
        systemPrompt TEXT NOT NULL,
        instructions TEXT,
        examples JSON,
        performanceMetrics JSON,
        trainedBy INT,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_agent (agentId),
        INDEX idx_version (version),
        INDEX idx_active (isActive)
      )
    `);

    // ============================================
    // CAMPAIGNS TABLE
    // ============================================
    await createTableIfNotExists("campaigns", `
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaignId VARCHAR(64) NOT NULL UNIQUE,
        companyId INT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        type ENUM('email', 'call', 'multi_channel', 'drip', 'event') NOT NULL,
        status ENUM('draft', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'draft' NOT NULL,
        targetAudience JSON,
        schedule JSON,
        metrics JSON,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_status (status),
        INDEX idx_type (type)
      )
    `);

    // ============================================
    // EMAIL_TEMPLATES TABLE
    // ============================================
    await createTableIfNotExists("emailTemplates", `
      CREATE TABLE IF NOT EXISTS emailTemplates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        templateId VARCHAR(64) NOT NULL UNIQUE,
        companyId INT,
        name VARCHAR(200) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        category VARCHAR(100),
        variables JSON,
        isActive BOOLEAN DEFAULT TRUE NOT NULL,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_category (category)
      )
    `);

    // ============================================
    // SCHEDULED_TASKS TABLE
    // ============================================
    await createTableIfNotExists("scheduledTasks", `
      CREATE TABLE IF NOT EXISTS scheduledTasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        taskId VARCHAR(64) NOT NULL UNIQUE,
        companyId INT,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        taskType VARCHAR(100) NOT NULL,
        schedule VARCHAR(100) NOT NULL,
        nextRun TIMESTAMP,
        lastRun TIMESTAMP,
        payload JSON,
        status ENUM('active', 'paused', 'completed', 'failed') DEFAULT 'active' NOT NULL,
        retryCount INT DEFAULT 0,
        maxRetries INT DEFAULT 3,
        createdBy INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
        INDEX idx_company (companyId),
        INDEX idx_status (status),
        INDEX idx_next_run (nextRun)
      )
    `);

    console.log("[Migration] Schema sync completed");
    console.log("[Migration] Results:", results.length, "operations");
    console.log("[Migration] Errors:", errors.length, "errors");

    res.status(200).json({
      success: true,
      message: "Database schema sync completed",
      results,
      errors,
      summary: {
        total: results.length,
        added: results.filter(r => r.status === "added").length,
        exists: results.filter(r => r.status === "exists").length,
        tables_created: results.filter(r => r.status === "table_created_or_exists").length,
        errors: errors.length
      }
    });

  } catch (error: any) {
    console.error("[Migration] Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      results,
      errors
    });
  }
});

export default router;
