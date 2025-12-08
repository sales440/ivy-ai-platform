import mysql from 'mysql2/promise';

async function checkData() {
    const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

    console.log('🔧 Connecting to Railway MySQL...\n');

    try {
        const connection = await mysql.createConnection(DATABASE_URL);

        // Check users table
        console.log('📊 Checking users table:');
        const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
        console.log(`   Total users: ${users[0].count}`);

        if (users[0].count > 0) {
            const [sampleUsers] = await connection.query('SELECT id, username, email, role, createdAt FROM users LIMIT 5');
            console.log('\n   Sample users:');
            sampleUsers.forEach(u => {
                console.log(`   - ${u.id}: ${u.username} (${u.email}) - Role: ${u.role}`);
            });
        }

        // Check leads table
        console.log('\n📊 Checking leads table:');
        const [leads] = await connection.query('SELECT COUNT(*) as count FROM leads');
        console.log(`   Total leads: ${leads[0].count}`);

        if (leads[0].count > 0) {
            const [sampleLeads] = await connection.query('SELECT id, name, email, company, status, createdAt FROM leads LIMIT 5');
            console.log('\n   Sample leads:');
            sampleLeads.forEach(l => {
                console.log(`   - ${l.id}: ${l.name} from ${l.company || 'N/A'} (${l.email}) - Status: ${l.status}`);
            });
        }

        // Check agents table
        console.log('\n📊 Checking agents table:');
        const [agents] = await connection.query('SELECT COUNT(*) as count FROM agents');
        console.log(`   Total agents: ${agents[0].count}`);

        if (agents[0].count > 0) {
            const [sampleAgents] = await connection.query('SELECT id, name, type, status, createdAt FROM agents LIMIT 5');
            console.log('\n   Sample agents:');
            sampleAgents.forEach(a => {
                console.log(`   - ${a.id}: ${a.name} (${a.type}) - Status: ${a.status}`);
            });
        }

        await connection.end();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkData();
