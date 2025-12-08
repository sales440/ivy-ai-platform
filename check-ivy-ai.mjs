import mysql from 'mysql2/promise';

async function checkIvyAI() {
    const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

    console.log('🔧 Connecting to Railway MySQL...\n');

    try {
        const connection = await mysql.createConnection(DATABASE_URL);

        // First, check what columns exist in users table
        console.log('📋 Checking users table structure...\n');
        const [columns] = await connection.query("DESCRIBE users");
        console.log('Available columns:');
        columns.forEach(col => console.log(`   - ${col.Field} (${col.Type})`));

        // Check for any users
        console.log('\n🔍 Checking for any users in database...\n');
        const [users] = await connection.query("SELECT * FROM users LIMIT 5");

        if (users.length > 0) {
            console.log(`✅ Found ${users.length} user(s):\n`);
            users.forEach(u => {
                console.log(`   ID: ${u.id}`);
                Object.keys(u).forEach(key => {
                    if (key !== 'id' && key !== 'password') {
                        console.log(`   ${key}: ${u[key]}`);
                    }
                });
                console.log('   ---');
            });
        } else {
            console.log('❌ No users found in database');
            console.log('\n💡 The database is completely empty.');
            console.log('\n📝 To enable Ivy.AI self-promotion, you need to:');
            console.log('   1. Create an "Ivy.AI" company/user in the system');
            console.log('   2. Configure Meta-Agent to manage Ivy.AI\'s own campaigns');
            console.log('   3. Set up automated lead generation for the platform');
            console.log('   4. Create agents that promote Ivy.AI itself');
        }

        await connection.end();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkIvyAI();
