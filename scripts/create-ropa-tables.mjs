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
