/**
 * Database Schema Fixer
 * 
 * Ensures all required tables exist in production
 */

import { getDb } from './server/db';
import { connection } from './server/db';

async function fixDatabaseSchema() {
    console.log('[Schema Fixer] Starting database schema verification...');

    try {
        const db = await getDb();
        if (!db) {
            console.error('[Schema Fixer] Database connection failed');
            process.exit(1);
        }

        // Check if scheduledTasks table exists
        console.log('[Schema Fixer] Checking scheduledTasks table...');

        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'scheduledTasks'"
        );

        if (Array.isArray(tables) && tables.length === 0) {
            console.log('[Schema Fixer] scheduledTasks table does NOT exist. Creating...');

            // Create scheduledTasks table
            await connection.query(`
        CREATE TABLE IF NOT EXISTS scheduledTasks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          companyId INT NOT NULL,
          taskType VARCHAR(100) NOT NULL,
          taskData JSON NOT NULL,
          status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending' NOT NULL,
          scheduledFor TIMESTAMP NOT NULL,
          executedAt TIMESTAMP NULL,
          createdBy INT NOT NULL,
          retryCount INT DEFAULT 0 NOT NULL,
          maxRetries INT DEFAULT 3 NOT NULL,
          error TEXT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
          INDEX idx_scheduledTasks_companyId (companyId),
          INDEX idx_scheduledTasks_status (status),
          INDEX idx_scheduledTasks_scheduledFor (scheduledFor)
        )
      `);

            console.log('[Schema Fixer] ✅ scheduledTasks table created successfully');
        } else {
            console.log('[Schema Fixer] ✅ scheduledTasks table already exists');
        }

        // Verify table structure
        const [columns] = await connection.query(
            "DESCRIBE scheduledTasks"
        );

        console.log('[Schema Fixer] Table structure:');
        console.table(columns);

        console.log('[Schema Fixer] ✅ Database schema verification complete');
        process.exit(0);

    } catch (error: any) {
        console.error('[Schema Fixer] ❌ Error:', error);
        process.exit(1);
    }
}

// Run the fixer
fixDatabaseSchema();
