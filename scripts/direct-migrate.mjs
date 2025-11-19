#!/usr/bin/env node
/**
 * Direct SQL Migration Script
 * Executes migrations directly without interactive prompts
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('🔄 Starting direct SQL migration...\n');

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection established\n');

    // 1. Create scheduledTasks table
    console.log('📝 Creating scheduledTasks table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS scheduledTasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT NOT NULL,
        taskType ENUM('send-email', 'update-lead-score', 'send-notification') NOT NULL,
        taskData JSON NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
        scheduledFor TIMESTAMP NOT NULL,
        executedAt TIMESTAMP NULL,
        error TEXT NULL,
        retryCount INT NOT NULL DEFAULT 0,
        maxRetries INT NOT NULL DEFAULT 3,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ scheduledTasks table created\n');

    // 2. Add scoreHistory column to leads if it doesn't exist
    console.log('📝 Adding scoreHistory column to leads table...');
    try {
      await connection.query(`
        ALTER TABLE leads ADD COLUMN scoreHistory JSON NULL
      `);
      console.log('✓ scoreHistory column added\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  scoreHistory column already exists, skipping\n');
      } else {
        throw error;
      }
    }

    // 3. Create emailCampaigns table
    console.log('📝 Creating emailCampaigns table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS emailCampaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        body TEXT NOT NULL,
        type ENUM('callback', 'interested', 'notInterested', 'voicemail') NOT NULL,
        createdBy INT NOT NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ emailCampaigns table created\n');

    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Changes applied:');
    console.log('  ✓ Created scheduledTasks table');
    console.log('  ✓ Added scoreHistory column to leads');
    console.log('  ✓ Created emailCampaigns table\n');
    console.log('🎉 Next steps:');
    console.log('  1. Refresh your browser (F5)');
    console.log('  2. Click "Seed Demo Data" button in dashboard');
    console.log('  3. All features are now fully operational!');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
