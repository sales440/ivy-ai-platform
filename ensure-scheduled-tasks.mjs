/**
 * Database Initialization - Ensures scheduledTasks table exists
 * This runs BEFORE the application starts
 */

import { connection } from './server/db';

async function ensureScheduledTasksTable() {
    console.log('[DB Init] Ensuring scheduledTasks table exists...');

    try {
        // Check if table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'scheduledTasks'"
        );

        if (Array.isArray(tables) && tables.length === 0) {
            console.log('[DB Init] scheduledTasks table does NOT exist. Creating now...');

            // Create the table
            await connection.query(`
        CREATE TABLE scheduledTasks (
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

            console.log('[DB Init] ✅ scheduledTasks table created successfully!');
        } else {
            console.log('[DB Init] ✅ scheduledTasks table already exists');
        }

        await connection.end();
        console.log('[DB Init] Database initialization complete');
        process.exit(0);

    } catch (error) {
        console.error('[DB Init] ❌ Error:', error);
        process.exit(1);
    }
}

// Run immediately
ensureScheduledTasksTable();
