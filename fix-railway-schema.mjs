#!/usr/bin/env node

/**
 * Complete schema fix for Railway MySQL database
 * Creates all missing tables to resolve deployment errors
 */

import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'interchange.proxy.rlwy.net',
  port: 29565,
  user: 'root',
  password: 'VYHCOzpWCQMJQFRbSiaLXEHeJhGRIINE',
  database: 'railway',
  multipleStatements: true
};

const SQL_SCHEMA = `
-- Create scheduledTasks table (CRITICAL - causing errors)
CREATE TABLE IF NOT EXISTS scheduledTasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT,
  taskType VARCHAR(100) NOT NULL,
  taskData JSON,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  scheduledFor TIMESTAMP NOT NULL,
  executedAt TIMESTAMP NULL,
  error TEXT,
  retryCount INT DEFAULT 0 NOT NULL,
  maxRetries INT DEFAULT 3 NOT NULL,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_status_scheduled (status, scheduledFor),
  INDEX idx_company (companyId)
);

-- Create linkedInPosts table (for multi-channel campaigns)
CREATE TABLE IF NOT EXISTS linkedInPosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leadId INT,
  postType VARCHAR(100),
  content TEXT NOT NULL,
  status ENUM('draft', 'scheduled', 'published', 'failed') DEFAULT 'draft' NOT NULL,
  scheduledFor TIMESTAMP NULL,
  publishedAt TIMESTAMP NULL,
  engagement JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_lead (leadId),
  INDEX idx_status (status)
);

-- Create emailSequences table
CREATE TABLE IF NOT EXISTS emailSequences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  targetAudience VARCHAR(100),
  status ENUM('active', 'paused', 'archived') DEFAULT 'active' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Create emailSequenceSteps table
CREATE TABLE IF NOT EXISTS emailSequenceSteps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sequenceId INT NOT NULL,
  stepOrder INT NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  delayDays INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_sequence (sequenceId),
  INDEX idx_order (sequenceId, stepOrder)
);

-- Create emailCampaigns table
CREATE TABLE IF NOT EXISTS emailCampaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sequenceId INT,
  status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft' NOT NULL,
  sentCount INT DEFAULT 0 NOT NULL,
  openCount INT DEFAULT 0 NOT NULL,
  clickCount INT DEFAULT 0 NOT NULL,
  replyCount INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_sequence (sequenceId),
  INDEX idx_status (status)
);

-- Create emailLogs table
CREATE TABLE IF NOT EXISTS emailLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT,
  leadId INT,
  sequenceStepId INT,
  subject VARCHAR(500),
  status ENUM('sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed') NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  openedAt TIMESTAMP NULL,
  clickedAt TIMESTAMP NULL,
  repliedAt TIMESTAMP NULL,
  error TEXT,
  metadata JSON,
  INDEX idx_campaign (campaignId),
  INDEX idx_lead (leadId),
  INDEX idx_status (status),
  INDEX idx_sent_at (sentAt)
);

-- Create knowledgeBase table
CREATE TABLE IF NOT EXISTS knowledgeBase (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags JSON,
  isPublic BOOLEAN DEFAULT false NOT NULL,
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_category (category),
  INDEX idx_public (isPublic)
);

-- Create prospectSearches table
CREATE TABLE IF NOT EXISTS prospectSearches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  searchCriteria JSON NOT NULL,
  resultsCount INT DEFAULT 0 NOT NULL,
  status ENUM('pending', 'running', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  completedAt TIMESTAMP NULL,
  INDEX idx_user (userId),
  INDEX idx_status (status)
);

-- Create savedSearches table
CREATE TABLE IF NOT EXISTS savedSearches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  searchCriteria JSON NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user (userId)
);

-- Create commandHistory table
CREATE TABLE IF NOT EXISTS commandHistory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  command TEXT NOT NULL,
  result TEXT,
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user (userId),
  INDEX idx_executed (executedAt)
);

-- Create dashboardWidgets table
CREATE TABLE IF NOT EXISTS dashboardWidgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  widgetType VARCHAR(100) NOT NULL,
  config JSON,
  position JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_user (userId)
);

-- Create systemMetrics table
CREATE TABLE IF NOT EXISTS systemMetrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metricType VARCHAR(100) NOT NULL,
  metricValue DECIMAL(15,2) NOT NULL,
  metadata JSON,
  recordedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_type_time (metricType, recordedAt)
);

-- Create crmIntegrations table
CREATE TABLE IF NOT EXISTS crmIntegrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  companyId INT NOT NULL,
  provider VARCHAR(100) NOT NULL,
  config JSON NOT NULL,
  status ENUM('active', 'inactive', 'error') DEFAULT 'inactive' NOT NULL,
  lastSyncAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_company (companyId),
  INDEX idx_provider (provider)
);

-- Create marketingLeads table
CREATE TABLE IF NOT EXISTS marketingLeads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  source VARCHAR(100),
  campaign VARCHAR(255),
  email VARCHAR(320) NOT NULL,
  name VARCHAR(200),
  company VARCHAR(200),
  metadata JSON,
  convertedToLeadId INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_email (email),
  INDEX idx_source (source),
  INDEX idx_campaign (campaign)
);
`;

async function fixSchema() {
  let connection;
  
  try {
    console.log('🔄 Connecting to Railway MySQL database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected successfully\n');
    
    console.log('📊 Creating missing tables...');
    await connection.query(SQL_SCHEMA);
    console.log('✅ All tables created successfully\n');
    
    // Verify tables exist
    console.log('🔍 Verifying table creation...');
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'railway' 
      ORDER BY table_name
    `);
    
    console.log(`\n✅ Found ${tables.length} tables in database:`);
    tables.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name || t.TABLE_NAME}`);
    });
    
    console.log('\n🎉 Schema fix completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Railway will auto-redeploy');
    console.log('2. Check logs to confirm no more "Table doesn\'t exist" errors');
    console.log('3. Access: https://ivyai-hoxbpybq.manus.space/multi-channel-campaigns');
    
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run fix
fixSchema();
