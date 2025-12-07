#!/usr/bin/env node
/**
 * Update Ivy.AI Company Information
 * Updates website and email to correct values
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function updateIvyAI() {
  console.log('🔧 Updating Ivy.AI company information...\n');

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection established\n');

    // Update Ivy.AI company
    await connection.query(
      `UPDATE companies 
       SET website = ?, contactEmail = ?, updatedAt = NOW()
       WHERE slug = ?`,
      [
        'https://www.ivybai.com',
        'sales@ivybai.com',
        'ivy-ai'
      ]
    );

    console.log('✅ Updated Ivy.AI company information');

    // Verify update
    const [result] = await connection.query(
      'SELECT id, name, slug, website, contactEmail, industry, plan FROM companies WHERE slug = ?',
      ['ivy-ai']
    );

    if (result && result.length > 0) {
      const company = result[0];
      console.log('\n📊 Ivy.AI Company Details:');
      console.log('─────────────────────────────────────────────────────────');
      console.log(`ID:       ${company.id}`);
      console.log(`Name:     ${company.name}`);
      console.log(`Slug:     ${company.slug}`);
      console.log(`Website:  ${company.website}`);
      console.log(`Email:    ${company.contactEmail}`);
      console.log(`Industry: ${company.industry}`);
      console.log(`Plan:     ${company.plan}`);
      console.log('─────────────────────────────────────────────────────────');
    }

    console.log('\n🎉 Update completed successfully!');

  } catch (error) {
    console.error('\n❌ Update failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

updateIvyAI();
