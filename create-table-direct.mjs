import mysql from 'mysql2/promise';

async function createTable() {
    // Public Railway MySQL URL
    const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

    console.log('🔧 Connecting to Railway MySQL (public network)...');

    try {
        const connection = await mysql.createConnection(DATABASE_URL);
        console.log('✅ Connected successfully!');

        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS scheduledTasks (
                id INT NOT NULL AUTO_INCREMENT,
                companyId INT NOT NULL,
                taskType ENUM('send-email','update-lead-score','send-notification','custom') NOT NULL,
                taskData JSON NOT NULL,
                status ENUM('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
                scheduledFor TIMESTAMP NOT NULL,
                executedAt TIMESTAMP NULL DEFAULT NULL,
                error TEXT,
                retryCount INT NOT NULL DEFAULT 0,
                maxRetries INT NOT NULL DEFAULT 3,
                createdBy INT NOT NULL,
                createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        console.log('📝 Creating scheduledTasks table...');
        await connection.execute(createTableSQL);
        console.log('✅ Table created successfully!');

        // Verify table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'scheduledTasks'");
        console.log(`✅ Verification: Found ${tables.length} table(s)`);

        await connection.end();
        console.log('✅ Done! The scheduledTasks table is now available.');
        console.log('🎉 The error in your Railway logs should disappear immediately!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

createTable();
