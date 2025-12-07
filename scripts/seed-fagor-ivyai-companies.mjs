#!/usr/bin/env node
/**
 * Seed FAGOR and Ivy.AI Companies
 * Creates/updates FAGOR and Ivy.AI companies in the database
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function seedCompanies() {
  console.log('🏢 Seeding FAGOR and Ivy.AI companies...\n');

  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection established\n');

    // Check if FAGOR exists
    const [fagorExists] = await connection.query(
      'SELECT id, name FROM companies WHERE slug = ?',
      ['fagor']
    );

    if (fagorExists && fagorExists.length > 0) {
      console.log(`✓ FAGOR company already exists (ID: ${fagorExists[0].id})`);
    } else {
      // Create FAGOR company
      await connection.query(
        `INSERT INTO companies (name, slug, industry, plan, website, contactEmail, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'FAGOR Automation',
          'fagor',
          'Manufacturing & Industrial Automation',
          'enterprise',
          'https://www.fagorautomation.com',
          'info@fagorautomation.com',
          true
        ]
      );
      console.log('✅ Created FAGOR Automation company');
    }

    // Check if Ivy.AI exists
    const [ivyExists] = await connection.query(
      'SELECT id, name FROM companies WHERE slug = ?',
      ['ivy-ai']
    );

    if (ivyExists && ivyExists.length > 0) {
      console.log(`✓ Ivy.AI company already exists (ID: ${ivyExists[0].id})`);
    } else {
      // Create Ivy.AI company
      await connection.query(
        `INSERT INTO companies (name, slug, industry, plan, website, contactEmail, isActive, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'Ivy.AI',
          'ivy-ai',
          'Artificial Intelligence & Automation',
          'enterprise',
          'https://www.ivybai.com',
          'sales@ivybai.com',
          true
        ]
      );
      console.log('✅ Created Ivy.AI company');
    }

    // List all companies
    const [allCompanies] = await connection.query(
      'SELECT id, name, slug, industry, plan, isActive FROM companies ORDER BY name'
    );

    console.log('\n📊 All Companies in Database:');
    console.log('─────────────────────────────────────────────────────────');
    allCompanies.forEach(company => {
      const status = company.isActive ? '✓ Active' : '✗ Inactive';
      console.log(`${status} | ID: ${company.id} | ${company.name} (${company.slug}) | ${company.plan}`);
    });

    console.log('\n🎉 Company seeding completed successfully!');

  } catch (error) {
    console.error('\n❌ Seeding failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedCompanies();
