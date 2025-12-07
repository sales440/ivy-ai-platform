#!/usr/bin/env node
import mysql from 'mysql2/promise';
import fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL || 'mysql://root:VYHCOzpWCQMJQFRbSiaLXEHeJhGRIINE@mysql.railway.internal:3306/railway';

async function loadAllClients() {
  console.log('📊 Loading FAGOR Clients to Database');
  console.log('=' .repeat(80));

  // Read the JSON file
  const clientsData = JSON.parse(fs.readFileSync('/home/ubuntu/fagor-clients-by-state.json', 'utf8'));
  
  // Connect to database
  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('✅ Connected to database');

  let imported = 0;
  let skipped = 0;
  let enrolled = 0;

  try {
    // Process each state
    for (const [state, clients] of Object.entries(clientsData)) {
      if (clients.length === 0) continue;

      console.log(`\n📍 Processing ${state}: ${clients.length} clients`);

      for (const client of clients) {
        try {
          // Check if client already exists
          const [existing] = await connection.execute(
            'SELECT id FROM fagorContacts WHERE company = ? AND customFields LIKE ?',
            [client.company_name, `%"state":"${state}"%`]
          );

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Generate email if not provided
          const email = client.email || `info@${client.company_name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
          
          // Insert contact
          const [result] = await connection.execute(
            `INSERT INTO fagorContacts (name, email, phone, company, role, source, customFields, tags, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
              client.contact_name || 'Sales Department',
              email,
              client.phone || '',
              client.company_name,
              'Contact',
              'excel_import',
              JSON.stringify({
                customer_number: client.customer_number || '',
                city: client.city || '',
                state: state,
                machine_model: client.machine_model || '',
                control_type: client.control_type || '',
                purchase_date: client.purchase_date || '',
                address: client.address || `${client.city}, ${state}`,
                website: client.website || '',
                import_source: 'excel_2009_2023',
              }),
              JSON.stringify([state, 'excel_import', 'fagor_customer'])
            ]
          );

          imported++;

          // Enroll in CNC Training 2026 campaign
          await connection.execute(
            `INSERT INTO fagorCampaignEnrollments (contactId, campaignName, currentStep, status, enrolledAt) 
             VALUES (?, ?, ?, ?, NOW())`,
            [result.insertId, 'CNC Training 2026', 0, 'active']
          );

          enrolled++;

        } catch (error) {
          console.error(`   ❌ Error importing ${client.company_name}: ${error.message}`);
        }
      }

      console.log(`   ✅ ${state}: Imported ${imported} clients`);
    }

    console.log('\n\n📊 IMPORT SUMMARY');
    console.log('=' .repeat(80));
    console.log(`✅ Imported: ${imported} clients`);
    console.log(`⏭️  Skipped (duplicates): ${skipped} clients`);
    console.log(`📧 Enrolled in campaign: ${enrolled} clients`);
    console.log(`📊 Total processed: ${imported + skipped} clients`);

  } finally {
    await connection.end();
  }
}

loadAllClients().catch(console.error);
