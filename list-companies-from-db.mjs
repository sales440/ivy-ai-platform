import mysql from 'mysql2/promise';

async function listCompanies() {
    // Public Railway MySQL URL
    const DATABASE_URL = 'mysql://root:eBthBskHxAnOFkipsBmXgNrpQZyjsPrD@metro.proxy.rlwy.net:19471/railway';

    console.log('🔧 Connecting to Railway MySQL...');

    try {
        const connection = await mysql.createConnection(DATABASE_URL);
        console.log('✅ Connected successfully!');

        console.log('\n📋 Fetching companies from database...\n');

        const [companies] = await connection.query(
            'SELECT id, name, website, industry, createdAt FROM companies ORDER BY createdAt DESC'
        );

        if (companies.length === 0) {
            console.log('⚠️  No companies found in database');
        } else {
            console.log(`✅ Found ${companies.length} companies:\n`);
            console.log('┌─────┬──────────────────────────────────┬──────────────────────────────────┬──────────────────┬─────────────────────┐');
            console.log('│ ID  │ Name                             │ Website                          │ Industry         │ Created             │');
            console.log('├─────┼──────────────────────────────────┼──────────────────────────────────┼──────────────────┼─────────────────────┤');

            companies.forEach(company => {
                const id = String(company.id).padEnd(3);
                const name = String(company.name || '').substring(0, 32).padEnd(32);
                const website = String(company.website || '').substring(0, 32).padEnd(32);
                const industry = String(company.industry || 'N/A').substring(0, 16).padEnd(16);
                const created = company.createdAt ? new Date(company.createdAt).toISOString().split('T')[0] : 'N/A';

                console.log(`│ ${id} │ ${name} │ ${website} │ ${industry} │ ${created.padEnd(19)} │`);
            });

            console.log('└─────┴──────────────────────────────────┴──────────────────────────────────┴──────────────────┴─────────────────────┘');

            console.log('\n📊 Summary:');
            console.log(`   Total companies: ${companies.length}`);

            // Group by industry
            const byIndustry = {};
            companies.forEach(c => {
                const ind = c.industry || 'Unknown';
                byIndustry[ind] = (byIndustry[ind] || 0) + 1;
            });

            console.log('\n   By industry:');
            Object.entries(byIndustry).forEach(([industry, count]) => {
                console.log(`   - ${industry}: ${count}`);
            });
        }

        await connection.end();
        console.log('\n✅ Done!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

listCompanies();
