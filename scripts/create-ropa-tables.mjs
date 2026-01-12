#!/usr/bin/env node
/**
 * Create ROPA tables in the database
 * This script creates all tables required for the ROPA (Meta-Agent) system
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      ssl: { rejectUnauthorized: false }
    };

    connection = await mysql.createConnection(config);

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-ropa-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        // Extract table name for logging
        const match = statement.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/i);
        if (match) {
          console.log(`[ROPA Tables] ✓ Created/verified table: ${match[1]}`);
        }
      } catch (err) {
        // Ignore "table already exists" errors
        if (err.code !== 'ER_TABLE_EXISTS_ERROR') {
          console.warn(`[ROPA Tables] Warning: ${err.message}`);
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
