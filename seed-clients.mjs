import mysql from 'mysql2/promise';

const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

async function seedClients() {
    console.log('🔧 Connecting to Railway MySQL...\n');

    const connection = await mysql.createConnection(DATABASE_URL);

    try {
        // 1. Create Ivy.AI user (self-promotion)
        console.log('📝 Creating Ivy.AI client...');
        const [ivyResult] = await connection.execute(
            `INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updatedAt, lastSignedIn) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            ['ivy-ai-platform-admin', 'Ivy.AI Platform', 'admin@ivy-ai.com', 'admin', 'email']
        );
        console.log(`✅ Ivy.AI user created (ID: ${ivyResult.insertId})`);

        // 2. Create FAGOR AUTOMATION user
        console.log('📝 Creating FAGOR AUTOMATION client...');
        const [fagorResult] = await connection.execute(
            `INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updatedAt, lastSignedIn) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            ['fagor-automation-admin', 'FAGOR AUTOMATION', 'admin@fagor-automation.com', 'admin', 'email']
        );
        console.log(`✅ FAGOR AUTOMATION user created (ID: ${fagorResult.insertId})`);

        // 3. Create PET LIFE 360 user
        console.log('📝 Creating PET LIFE 360 client...');
        const [petResult] = await connection.execute(
            `INSERT INTO users (openId, name, email, role, loginMethod, createdAt, updatedAt, lastSignedIn) 
             VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
            ['petlife360-admin', 'PET LIFE 360', 'admin@petlife360.com', 'admin', 'email']
        );
        console.log(`✅ PET LIFE 360 user created (ID: ${petResult.insertId})`);

        // Verify creation
        console.log('\n📊 Verifying created users...\n');
        const [users] = await connection.query('SELECT id, name, email, role FROM users');

        console.log('┌─────┬──────────────────────┬─────────────────────────────┬────────┐');
        console.log('│ ID  │ Name                 │ Email                       │ Role   │');
        console.log('├─────┼──────────────────────┼─────────────────────────────┼────────┤');
        users.forEach(u => {
            const id = String(u.id).padEnd(3);
            const name = String(u.name).substring(0, 20).padEnd(20);
            const email = String(u.email).substring(0, 27).padEnd(27);
            const role = String(u.role).padEnd(6);
            console.log(`│ ${id} │ ${name} │ ${email} │ ${role} │`);
        });
        console.log('└─────┴──────────────────────┴─────────────────────────────┴────────┘');

        await connection.end();

        console.log('\n✅ All clients created successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Create agents for each client');
        console.log('   2. Configure FAGOR drip campaigns');
        console.log('   3. Set up Ivy.AI self-promotion workflows');
        console.log('   4. Configure PET LIFE 360 campaigns');

    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code === 'ER_DUP_ENTRY') {
            console.log('\n💡 Users already exist. Checking current state...');
            const [users] = await connection.query('SELECT id, name, email FROM users');
            console.log(`\nFound ${users.length} user(s):`);
            users.forEach(u => console.log(`   - ${u.name} (${u.email})`));
        }
        await connection.end();
        process.exit(1);
    }
}

seedClients();
