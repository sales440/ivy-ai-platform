#!/usr/bin/env node
/**
 * Create ROPA tables in the database
 * This script creates all tables required for the ROPA (Meta-Agent) system
 */

import mysql from 'mysql2/promise';

async function createRopaTables() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.log('[ROPA Tables] No DATABASE_URL found, skipping table creation');
    return;
  }

  console.log('[ROPA Tables] Creating ROPA tables...');

  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(databaseUrl);
    const config = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      multipleStatements: false
    };

    connection = await mysql.createConnection(config);

    // Define all tables as separate statements
    const tables = [
      {
        name: 'ropa_tasks',
        sql: `CREATE TABLE IF NOT EXISTS ropa_tasks (
          id int AUTO_INCREMENT PRIMARY KEY,
          task_id varchar(64) NOT NULL UNIQUE,
          type varchar(64) NOT NULL,
          status enum('pending', 'running', 'completed', 'failed', 'cancelled') NOT NULL DEFAULT 'pending',
          priority enum('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
          tool_used varchar(128),
          input json,
          output json,
          error text,
          started_at timestamp NULL,
          completed_at timestamp NULL,
          duration int,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_logs',
        sql: `CREATE TABLE IF NOT EXISTS ropa_logs (
          id int AUTO_INCREMENT PRIMARY KEY,
          task_id varchar(64),
          level enum('debug', 'info', 'warn', 'error') NOT NULL DEFAULT 'info',
          message text NOT NULL,
          metadata json,
          timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_metrics',
        sql: `CREATE TABLE IF NOT EXISTS ropa_metrics (
          id int AUTO_INCREMENT PRIMARY KEY,
          metric_type varchar(64) NOT NULL,
          value decimal(10, 2) NOT NULL,
          unit varchar(32),
          metadata json,
          timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_config',
        sql: `CREATE TABLE IF NOT EXISTS ropa_config (
          id int AUTO_INCREMENT PRIMARY KEY,
          \`key\` varchar(128) NOT NULL UNIQUE,
          value json NOT NULL,
          description text,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_chat_history',
        sql: `CREATE TABLE IF NOT EXISTS ropa_chat_history (
          id int AUTO_INCREMENT PRIMARY KEY,
          role enum('user', 'assistant', 'system') NOT NULL,
          message text NOT NULL,
          metadata json,
          timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_learning',
        sql: `CREATE TABLE IF NOT EXISTS ropa_learning (
          id int AUTO_INCREMENT PRIMARY KEY,
          category varchar(64) NOT NULL,
          pattern text NOT NULL,
          frequency int NOT NULL DEFAULT 1,
          success_rate decimal(5, 2),
          metadata json,
          last_seen timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ropa_alerts',
        sql: `CREATE TABLE IF NOT EXISTS ropa_alerts (
          id int AUTO_INCREMENT PRIMARY KEY,
          severity enum('info', 'warning', 'error', 'critical') NOT NULL,
          title varchar(255) NOT NULL,
          message text NOT NULL,
          resolved boolean NOT NULL DEFAULT false,
          resolved_at timestamp NULL,
          metadata json,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'google_drive_tokens',
        sql: `CREATE TABLE IF NOT EXISTS google_drive_tokens (
          id int AUTO_INCREMENT PRIMARY KEY,
          user_id varchar(64) NOT NULL UNIQUE,
          access_token text NOT NULL,
          refresh_token text,
          expiry_date bigint,
          scope text,
          token_type varchar(64),
          folder_ids json,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'email_drafts',
        sql: `CREATE TABLE IF NOT EXISTS email_drafts (
          id int AUTO_INCREMENT PRIMARY KEY,
          draft_id varchar(64) NOT NULL UNIQUE,
          company varchar(255) NOT NULL,
          campaign varchar(255),
          subject varchar(500) NOT NULL,
          body text NOT NULL,
          html_content text,
          recipient_email varchar(320),
          recipient_name varchar(255),
          status enum('pending', 'approved', 'rejected', 'sent') NOT NULL DEFAULT 'pending',
          rejection_reason text,
          approved_by varchar(64),
          approved_at timestamp NULL,
          sent_at timestamp NULL,
          created_by varchar(64),
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ivy_clients',
        sql: `CREATE TABLE IF NOT EXISTS ivy_clients (
          id int AUTO_INCREMENT PRIMARY KEY,
          client_id varchar(32) NOT NULL UNIQUE,
          company_name varchar(255) NOT NULL,
          industry varchar(100),
          contact_name varchar(255),
          contact_email varchar(320),
          contact_phone varchar(50),
          address text,
          website varchar(255),
          logo_url varchar(500),
          google_drive_folder_id varchar(100),
          google_drive_structure text,
          status enum('active', 'inactive', 'prospect', 'churned') NOT NULL DEFAULT 'prospect',
          \`plan\` enum('free', 'starter', 'professional', 'enterprise') NOT NULL DEFAULT 'free',
          notes text,
          created_by varchar(64),
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'sales_campaigns',
        sql: `CREATE TABLE IF NOT EXISTS sales_campaigns (
          id int AUTO_INCREMENT PRIMARY KEY,
          name varchar(255) NOT NULL,
          type enum('email', 'phone', 'social_media', 'multi_channel') NOT NULL,
          status enum('draft', 'active', 'paused', 'completed') NOT NULL DEFAULT 'draft',
          target_audience text,
          content text,
          social_platform varchar(50),
          metrics text,
          start_date timestamp NULL,
          end_date timestamp NULL,
          created_by varchar(64) NOT NULL,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'campaign_content',
        sql: `CREATE TABLE IF NOT EXISTS campaign_content (
          id int AUTO_INCREMENT PRIMARY KEY,
          campaign_id int,
          company_id int,
          company_name varchar(255) NOT NULL,
          company_logo varchar(500),
          company_address text,
          company_phone varchar(50),
          company_email varchar(320),
          company_website varchar(255),
          content_type enum('email', 'call_script', 'sms') NOT NULL,
          subject varchar(500),
          body text NOT NULL,
          html_content text,
          target_recipients text,
          status enum('pending', 'approved', 'rejected', 'sent') NOT NULL DEFAULT 'pending',
          rejection_reason text,
          approved_by varchar(64),
          approved_at timestamp NULL,
          sent_at timestamp NULL,
          sent_count int DEFAULT 0,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'client_leads',
        sql: `CREATE TABLE IF NOT EXISTS client_leads (
          id int AUTO_INCREMENT PRIMARY KEY,
          company_name varchar(255) NOT NULL,
          contact_name varchar(255),
          email varchar(320),
          phone varchar(50),
          industry varchar(100),
          company_size varchar(50),
          status enum('new', 'contacted', 'qualified', 'proposal', 'closed_won', 'closed_lost') NOT NULL DEFAULT 'new',
          source varchar(100),
          notes text,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'client_files',
        sql: `CREATE TABLE IF NOT EXISTS client_files (
          id int AUTO_INCREMENT PRIMARY KEY,
          client_id varchar(32) NOT NULL,
          file_type enum('logo', 'template', 'report', 'backup', 'document', 'campaign_asset', 'client_list', 'other') NOT NULL,
          file_name varchar(255) NOT NULL,
          google_drive_file_id varchar(100),
          google_drive_url varchar(500),
          mime_type varchar(100),
          file_size int,
          description text,
          uploaded_by varchar(64),
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'uploaded_files',
        sql: `CREATE TABLE IF NOT EXISTS uploaded_files (
          id int AUTO_INCREMENT PRIMARY KEY,
          file_name varchar(255) NOT NULL,
          file_type varchar(50) NOT NULL,
          file_size int NOT NULL,
          s3_key varchar(500) NOT NULL,
          s3_url varchar(500) NOT NULL,
          uploaded_by varchar(64) NOT NULL,
          processed_leads int DEFAULT 0,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'company_files',
        sql: `CREATE TABLE IF NOT EXISTS company_files (
          id int AUTO_INCREMENT PRIMARY KEY,
          company_id int,
          company_name varchar(255) NOT NULL,
          file_name varchar(255) NOT NULL,
          file_type enum('logo', 'email_example', 'branding', 'document', 'client_list', 'other') NOT NULL,
          mime_type varchar(100) NOT NULL,
          file_size int NOT NULL,
          s3_key varchar(500) NOT NULL,
          s3_url varchar(500) NOT NULL,
          description text,
          uploaded_by varchar(64),
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'client_lists',
        sql: `CREATE TABLE IF NOT EXISTS client_lists (
          id int AUTO_INCREMENT PRIMARY KEY,
          company_id int,
          company_name varchar(255) NOT NULL,
          list_name varchar(255) NOT NULL,
          source_file_id int,
          source_file_name varchar(255),
          total_records int DEFAULT 0,
          processed_records int DEFAULT 0,
          status enum('pending', 'processing', 'completed', 'error') NOT NULL DEFAULT 'pending',
          error_message text,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'client_records',
        sql: `CREATE TABLE IF NOT EXISTS client_records (
          id int AUTO_INCREMENT PRIMARY KEY,
          list_id int NOT NULL,
          company_id int,
          name varchar(255),
          email varchar(320),
          phone varchar(50),
          company varchar(255),
          position varchar(255),
          industry varchar(100),
          location varchar(255),
          custom_fields text,
          status enum('active', 'contacted', 'responded', 'converted', 'unsubscribed') NOT NULL DEFAULT 'active',
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ab_tests',
        sql: `CREATE TABLE IF NOT EXISTS ab_tests (
          id int AUTO_INCREMENT PRIMARY KEY,
          campaign_id int,
          test_name varchar(255) NOT NULL,
          test_type enum('email_subject', 'email_content', 'call_script', 'sms_content', 'landing_page') NOT NULL,
          hypothesis text,
          status enum('draft', 'running', 'completed', 'paused') NOT NULL DEFAULT 'draft',
          start_date timestamp NULL,
          end_date timestamp NULL,
          winner_variant_id int,
          confidence_level int DEFAULT 95,
          significance_reached int DEFAULT 0,
          created_by varchar(64),
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ab_test_variants',
        sql: `CREATE TABLE IF NOT EXISTS ab_test_variants (
          id int AUTO_INCREMENT PRIMARY KEY,
          test_id int NOT NULL,
          variant_name varchar(100) NOT NULL,
          is_control int DEFAULT 0,
          content text NOT NULL,
          traffic_percentage int DEFAULT 50,
          created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'ab_test_results',
        sql: `CREATE TABLE IF NOT EXISTS ab_test_results (
          id int AUTO_INCREMENT PRIMARY KEY,
          test_id int NOT NULL,
          variant_id int NOT NULL,
          impressions int DEFAULT 0,
          opens int DEFAULT 0,
          clicks int DEFAULT 0,
          conversions int DEFAULT 0,
          bounces int DEFAULT 0,
          unsubscribes int DEFAULT 0,
          revenue int DEFAULT 0,
          conversion_rate int DEFAULT 0,
          open_rate int DEFAULT 0,
          click_rate int DEFAULT 0,
          updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      }
    ];

    for (const table of tables) {
      try {
        await connection.execute(table.sql);
        console.log(`[ROPA Tables] ✓ Created/verified table: ${table.name}`);
      } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`[ROPA Tables] ✓ Table already exists: ${table.name}`);
        } else {
          console.error(`[ROPA Tables] ✗ Error creating ${table.name}: ${err.message}`);
        }
      }
    }

    console.log('[ROPA Tables] ✓ All ROPA tables created successfully');
  } catch (error) {
    console.error('[ROPA Tables] Error creating tables:', error.message);
    // Don't throw - let the app continue even if table creation fails
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createRopaTables();
