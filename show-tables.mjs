import mysql from 'mysql2/promise';

async function showTables() {
    const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

    console.log('🔧 Connecting to Railway MySQL...');

    try {
        const connection = await mysql.createConnection(DATABASE_URL);
        console.log('✅ Connected successfully!\n');

        console.log('📋 Listing all tables in database:\n');

        const [tables] = await connection.query('SHOW TABLES');

        if (tables.length === 0) {
            console.log('⚠️  No tables found in database');
        } else {
            console.log(`Found ${tables.length} tables:\n`);
            tables.forEach((table, index) => {
                const tableName = Object.values(table)[0];
                console.log(`${(index + 1).toString().padStart(2)}. ${tableName}`);
            });
        }

        await connection.end();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

showTables();
