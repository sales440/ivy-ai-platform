
import mysql from 'mysql2/promise';

async function main() {
    // Railway provides these environment variables for MySQL
    const config = {
        host: process.env.MYSQLHOST,
        port: process.env.MYSQLPORT || 3306,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE
    };

    console.log('🔧 Connecting to Railway MySQL database...');
    const connection = await mysql.createConnection(config);

    try {
        const [tables] = await connection.query("SHOW TABLES LIKE 'scheduledTasks'");

        if (tables.length > 0) {
            console.log('✅ scheduledTasks table already exists');
        } else {
            console.log('📦 Creating scheduledTasks table...');
            await connection.query(`
        CREATE TABLE IF NOT EXISTS \`scheduledTasks\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`companyId\` int NOT NULL,
          \`taskType\` enum('send-email','update-lead-score','send-notification','custom') NOT NULL,
          \`taskData\` json NOT NULL,
          \`status\` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
          \`scheduledFor\` timestamp NOT NULL,
          \`executedAt\` timestamp NULL DEFAULT NULL,
          \`error\` text,
          \`retryCount\` int NOT NULL DEFAULT '0',
          \`maxRetries\` int NOT NULL DEFAULT '3',
          \`createdBy\` int NOT NULL,
          \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        );
      `);
            console.log('✅ scheduledTasks table created successfully');
        }
    } catch (error) {
        console.error('❌ Error creating scheduledTasks table:', error.message);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

main();
