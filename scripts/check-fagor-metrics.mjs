#!/usr/bin/env node

/**
 * Check FAGOR Campaign Metrics from Database
 * 
 * Queries the local database for FAGOR campaign enrollment and email event data
 * to provide real-time metrics without relying on SendGrid API.
 */

import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

/**
 * Parse Railway MySQL connection string
 */
function parseDatabaseUrl(url) {
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/);
  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }
  
  return {
    host: match[3],
    port: parseInt(match[4]),
    user: match[1],
    password: match[2],
    database: match[5],
    ssl: {
      rejectUnauthorized: true
    }
  };
}

/**
 * Main function
 */
async function main() {
  console.log('📊 Checking FAGOR Campaign Metrics from Database...\n');

  let connection;

  try {
    // Connect to database
    const dbConfig = parseDatabaseUrl(DATABASE_URL);
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database\n');

    // Query 1: Total contacts and enrollments
    const [enrollments] = await connection.execute(`
      SELECT 
        COUNT(*) as total_enrolled,
        SUM(CASE WHEN currentStep = 1 THEN 1 ELSE 0 END) as step_1,
        SUM(CASE WHEN currentStep = 2 THEN 1 ELSE 0 END) as step_2,
        SUM(CASE WHEN currentStep = 3 THEN 1 ELSE 0 END) as step_3,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END) as responded
      FROM fagorCampaignEnrollments
    `);

    const enrollment = enrollments[0];

    console.log('📋 Campaign Enrollment Status:');
    console.log('─────────────────────────────────────────');
    console.log(`Total Enrolled:    ${enrollment.total_enrolled}`);
    console.log(`Active:            ${enrollment.active}`);
    console.log(`Completed:         ${enrollment.completed}`);
    console.log(`Responded:         ${enrollment.responded}`);
    console.log(`\nCurrent Step Distribution:`);
    console.log(`  Step 1 (Email 1): ${enrollment.step_1}`);
    console.log(`  Step 2 (Email 2): ${enrollment.step_2}`);
    console.log(`  Step 3 (Email 3): ${enrollment.step_3}`);

    // Query 2: Email events summary
    const [events] = await connection.execute(`
      SELECT 
        eventType,
        COUNT(*) as count
      FROM fagorEmailEvents
      GROUP BY eventType
      ORDER BY count DESC
    `);

    if (events.length > 0) {
      console.log('\n\n📧 Email Events Summary:');
      console.log('─────────────────────────────────────────');
      
      const eventCounts = {};
      events.forEach(row => {
        eventCounts[row.eventType] = row.count;
      });

      const delivered = eventCounts['delivered'] || 0;
      const opened = eventCounts['opened'] || 0;
      const clicked = eventCounts['clicked'] || 0;
      const bounced = eventCounts['bounced'] || 0;
      const unsubscribed = eventCounts['unsubscribed'] || 0;

      console.log(`Delivered:         ${delivered}`);
      console.log(`Opened:            ${opened} ${delivered > 0 ? `(${(opened/delivered*100).toFixed(1)}%)` : ''}`);
      console.log(`Clicked:           ${clicked} ${delivered > 0 ? `(${(clicked/delivered*100).toFixed(1)}%)` : ''}`);
      console.log(`Bounced:           ${bounced} ${delivered > 0 ? `(${(bounced/delivered*100).toFixed(1)}%)` : ''}`);
      console.log(`Unsubscribed:      ${unsubscribed}`);
    } else {
      console.log('\n\nℹ️  No email events recorded yet');
      console.log('   (Events are tracked via SendGrid webhook)');
    }

    // Query 3: Contacts by company
    const [companies] = await connection.execute(`
      SELECT 
        company,
        COUNT(*) as count
      FROM fagorContacts
      WHERE company IS NOT NULL AND company != ''
      GROUP BY company
      ORDER BY count DESC
      LIMIT 10
    `);

    if (companies.length > 0) {
      console.log('\n\n🏢 Top Companies (by contact count):');
      console.log('─────────────────────────────────────────');
      companies.forEach((row, index) => {
        console.log(`${index + 1}. ${row.company}: ${row.count} contact(s)`);
      });
    }

    // Query 4: Recent enrollments
    const [recent] = await connection.execute(`
      SELECT 
        c.name,
        c.email,
        c.company,
        e.currentStep,
        e.status,
        e.email1SentAt,
        e.email2SentAt,
        e.email3SentAt,
        e.respondedAt
      FROM fagorCampaignEnrollments e
      JOIN fagorContacts c ON e.contactId = c.id
      ORDER BY e.enrolledAt DESC
      LIMIT 5
    `);

    if (recent.length > 0) {
      console.log('\n\n📝 Recent Enrollments (Last 5):');
      console.log('─────────────────────────────────────────');
      recent.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.name} (${row.email})`);
        console.log(`   Company: ${row.company || 'N/A'}`);
        console.log(`   Status: ${row.status} | Step: ${row.currentStep}`);
        console.log(`   Email 1: ${row.email1SentAt ? '✅ Sent' : '⏳ Pending'}`);
        console.log(`   Email 2: ${row.email2SentAt ? '✅ Sent' : '⏳ Pending'}`);
        console.log(`   Email 3: ${row.email3SentAt ? '✅ Sent' : '⏳ Pending'}`);
        if (row.respondedAt) {
          console.log(`   ⭐ Responded: ${new Date(row.respondedAt).toLocaleDateString()}`);
        }
      });
    }

    // Query 5: Drip schedule status
    const [schedule] = await connection.execute(`
      SELECT 
        SUM(CASE 
          WHEN email1SentAt IS NULL THEN 1 
          ELSE 0 
        END) as pending_email_1,
        SUM(CASE 
          WHEN email1SentAt IS NOT NULL 
          AND email2SentAt IS NULL 
          AND DATEDIFF(NOW(), email1SentAt) >= 3 
          THEN 1 
          ELSE 0 
        END) as eligible_email_2,
        SUM(CASE 
          WHEN email2SentAt IS NOT NULL 
          AND email3SentAt IS NULL 
          AND DATEDIFF(NOW(), email2SentAt) >= 4 
          THEN 1 
          ELSE 0 
        END) as eligible_email_3
      FROM fagorCampaignEnrollments
      WHERE status = 'active'
    `);

    const scheduleStatus = schedule[0];

    console.log('\n\n⏰ Drip Schedule Status:');
    console.log('─────────────────────────────────────────');
    console.log(`Pending Email 1:   ${scheduleStatus.pending_email_1} contact(s)`);
    console.log(`Eligible Email 2:  ${scheduleStatus.eligible_email_2} contact(s) (Day 3+)`);
    console.log(`Eligible Email 3:  ${scheduleStatus.eligible_email_3} contact(s) (Day 7+)`);

    console.log('\n\n✅ Metrics retrieved successfully!');
    console.log('\n💡 Next steps:');
    console.log('   • Configure SendGrid webhook to track opens/clicks');
    console.log('   • Monitor drip scheduler logs in Railway');
    console.log('   • Review SendGrid Dashboard for delivery issues\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
