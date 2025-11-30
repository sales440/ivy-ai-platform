#!/usr/bin/env node
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function enrollAllContacts() {
  console.log('📧 Enrolling FAGOR Contacts in CNC Training 2026 Campaign');
  console.log('=' .repeat(80));

  const connection = await mysql.createConnection(DATABASE_URL);
  console.log('✅ Connected to database');

  try {
    // Get all contacts from excel_import source
    const [contacts] = await connection.execute(
      'SELECT id, name, company FROM fagorContacts WHERE source = ?',
      ['excel_import']
    );

    console.log(`\n📊 Found ${contacts.length} contacts to enroll`);

    let enrolled = 0;
    let skipped = 0;

    for (const contact of contacts) {
      try {
        // Check if already enrolled
        const [existing] = await connection.execute(
          'SELECT id FROM fagorCampaignEnrollments WHERE contactId = ? AND campaignName = ?',
          [contact.id, 'CNC Training 2026']
        );

        if (existing.length > 0) {
          skipped++;
          continue;
        }

        // Enroll in campaign
        await connection.execute(
          `INSERT INTO fagorCampaignEnrollments (contactId, campaignName, currentStep, status, enrolledAt) 
           VALUES (?, ?, ?, ?, NOW())`,
          [contact.id, 'CNC Training 2026', 0, 'active']
        );

        enrolled++;

        if (enrolled % 50 === 0) {
          console.log(`   ✅ Enrolled ${enrolled} contacts...`);
        }

      } catch (error) {
        console.error(`   ❌ Error enrolling ${contact.company}: ${error.message}`);
      }
    }

    console.log('\n\n📊 ENROLLMENT SUMMARY');
    console.log('=' .repeat(80));
    console.log(`✅ Enrolled: ${enrolled} contacts`);
    console.log(`⏭️  Skipped (already enrolled): ${skipped} contacts`);
    console.log(`📊 Total processed: ${enrolled + skipped} contacts`);

  } finally {
    await connection.end();
  }
}

enrollAllContacts().catch(console.error);
