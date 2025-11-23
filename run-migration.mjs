#!/usr/bin/env node

/**
 * Migration script for Multi-Channel Campaigns System
 * Executes SQL migrations on Railway MySQL database
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection config
const DB_CONFIG = {
  host: 'interchange.proxy.rlwy.net',
  port: 29565,
  user: 'root',
  password: 'VYHCOzpWCQMJQFRbSiaLXEHeJhGRIINE',
  database: 'railway',
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to Railway MySQL database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected successfully');
    
    // Read migration SQL file
    const sqlPath = path.join(__dirname, 'migrations', 'multi-channel-campaigns.sql');
    console.log(`📄 Reading migration file: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute migration
    console.log('🚀 Executing migration...');
    const [results] = await connection.query(sql);
    console.log('✅ Migration executed successfully');
    
    // Verify tables were created
    console.log('\n📊 Verifying tables...');
    const [tables] = await connection.query(`
      SELECT 
        TABLE_NAME,
        TABLE_ROWS,
        CREATE_TIME
      FROM 
        information_schema.TABLES
      WHERE 
        TABLE_SCHEMA = 'railway'
        AND TABLE_NAME IN ('multiChannelCampaigns', 'campaignSteps', 'campaignExecutions')
      ORDER BY 
        TABLE_NAME
    `);
    
    console.log('\n✅ Tables created:');
    console.table(tables);
    
    // Show table structures
    console.log('\n📋 Table Structures:');
    
    for (const table of ['multiChannelCampaigns', 'campaignSteps', 'campaignExecutions']) {
      console.log(`\n--- ${table} ---`);
      const [columns] = await connection.query(`DESCRIBE ${table}`);
      console.table(columns);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your Railway app URL');
    console.log('2. Navigate to /multi-channel-campaigns');
    console.log('3. Create your first campaign');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
runMigration();
