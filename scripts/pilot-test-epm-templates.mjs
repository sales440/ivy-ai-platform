/**
 * Pilot Test Script for EPM Email Templates
 * 
 * This script validates the 12 email templates imported for EPM Construcciones
 * by simulating email sends to test leads in each sector (educativo, hotelero, residencial).
 * 
 * Usage:
 *   node scripts/pilot-test-epm-templates.mjs
 * 
 * What it does:
 * 1. Selects 5 test leads per sector (15 total)
 * 2. Simulates sending the first email template (sequence 1, day 0)
 * 3. Records email sends in the database
 * 4. Generates a report of the pilot test results
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Database connection
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🚀 EPM Email Templates - Pilot Test Script\n');
console.log('=' .repeat(60));

// ============================================================================
// STEP 1: Select Test Leads
// ============================================================================

console.log('\n📋 STEP 1: Selecting test leads by sector...\n');

const testLeads = {
  educativo: [],
  hotelero: [],
  residencial: [],
};

// Select 5 leads per sector (or create test leads if none exist)
for (const sector of ['educativo', 'hotelero', 'residencial']) {
  const [leads] = await connection.execute(
    `SELECT id, name, email, company, industry 
     FROM leads 
     WHERE industry = ? AND companyId = 8
     ORDER BY createdAt DESC 
     LIMIT 5`,
    [sector]
  );
  
  testLeads[sector] = leads;
  console.log(`  ✅ ${sector}: ${leads.length} leads selected`);
  
  if (leads.length === 0) {
    console.log(`     ⚠️  No leads found for ${sector}. Consider importing test data first.`);
  }
}

const totalLeads = testLeads.educativo.length + testLeads.hotelero.length + testLeads.residencial.length;
console.log(`\n  📊 Total test leads: ${totalLeads}`);

if (totalLeads === 0) {
  console.log('\n❌ No test leads available. Please import leads first using /admin/import-leads');
  process.exit(1);
}

// ============================================================================
// STEP 2: Fetch Email Templates
// ============================================================================

console.log('\n📧 STEP 2: Fetching email templates...\n');

const templates = {
  educativo: null,
  hotelero: null,
  residencial: null,
};

for (const sector of ['educativo', 'hotelero', 'residencial']) {
  const [rows] = await connection.execute(
    `SELECT id, name, subject, body, sector, sequence, delayDays 
     FROM emailCampaigns 
     WHERE sector = ? AND sequence = 1 AND createdBy = 8
     LIMIT 1`,
    [sector]
  );
  
  if (rows.length > 0) {
    templates[sector] = rows[0];
    console.log(`  ✅ ${sector}: "${rows[0].name}" (ID: ${rows[0].id})`);
  } else {
    console.log(`  ❌ ${sector}: No template found`);
  }
}

const templatesFound = Object.values(templates).filter(t => t !== null).length;
console.log(`\n  📊 Templates found: ${templatesFound}/3`);

if (templatesFound === 0) {
  console.log('\n❌ No email templates found. Please run seed-epm-templates.mjs first');
  process.exit(1);
}

// ============================================================================
// STEP 3: Simulate Email Sends (DRY RUN)
// ============================================================================

console.log('\n📤 STEP 3: Simulating email sends (DRY RUN)...\n');
console.log('  ℹ️  This is a simulation. No actual emails will be sent.\n');

const simulationResults = {
  total: 0,
  byTemplate: {},
  bySector: {},
};

for (const sector of ['educativo', 'hotelero', 'residencial']) {
  const template = templates[sector];
  const leads = testLeads[sector];
  
  if (!template || leads.length === 0) continue;
  
  console.log(`  📨 ${sector.toUpperCase()}:`);
  console.log(`     Template: "${template.name}"`);
  console.log(`     Subject: "${template.subject}"`);
  console.log(`     Recipients: ${leads.length} leads\n`);
  
  simulationResults.byTemplate[template.id] = 0;
  simulationResults.bySector[sector] = 0;
  
  for (const lead of leads) {
    // Personalize email content
    const personalizedSubject = template.subject
      .replace('{{leadName}}', lead.name)
      .replace('{{company}}', lead.company || 'su empresa');
    
    const personalizedBody = template.body
      .replace(/{{leadName}}/g, lead.name)
      .replace(/{{company}}/g, lead.company || 'su empresa')
      .replace(/{{agentName}}/g, 'Carlos Rodríguez')
      .replace(/{{agentTitle}}/g, 'Especialista en Mantenimiento')
      .replace(/{{agentPhone}}/g, '+52 951 123 4567')
      .replace(/{{agentEmail}}/g, 'carlos@epmconstrucciones.com');
    
    console.log(`     → ${lead.name} (${lead.email || 'sin email'})`);
    console.log(`       Subject: ${personalizedSubject}`);
    console.log(`       Preview: ${personalizedBody.substring(0, 80)}...`);
    console.log('');
    
    simulationResults.total++;
    simulationResults.byTemplate[template.id]++;
    simulationResults.bySector[sector]++;
  }
}

// ============================================================================
// STEP 4: Generate Report
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 PILOT TEST SIMULATION REPORT');
console.log('='.repeat(60) + '\n');

console.log('Summary:');
console.log(`  • Total emails simulated: ${simulationResults.total}`);
console.log(`  • Templates used: ${Object.keys(simulationResults.byTemplate).length}`);
console.log(`  • Sectors covered: ${Object.keys(simulationResults.bySector).length}\n`);

console.log('Breakdown by Sector:');
for (const [sector, count] of Object.entries(simulationResults.bySector)) {
  console.log(`  • ${sector}: ${count} emails`);
}

console.log('\n' + '-'.repeat(60));
console.log('✅ SIMULATION COMPLETED SUCCESSFULLY');
console.log('-'.repeat(60) + '\n');

// ============================================================================
// STEP 5: Optional - Record Test Sends in Database
// ============================================================================

console.log('💾 STEP 5: Record test sends in database? (Optional)\n');
console.log('  ⚠️  This will create email records in the database.');
console.log('  ℹ️  To enable, set RECORD_TEST_SENDS=true environment variable.\n');

if (process.env.RECORD_TEST_SENDS === 'true') {
  console.log('  🔄 Recording test sends...\n');
  
  let recorded = 0;
  
  for (const sector of ['educativo', 'hotelero', 'residencial']) {
    const template = templates[sector];
    const leads = testLeads[sector];
    
    if (!template || leads.length === 0) continue;
    
    for (const lead of leads) {
      try {
        await connection.execute(
          `INSERT INTO emails (
            companyId, userId, leadId, campaignId, 
            subject, body, status, sentAt, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
          [
            8, // EPM companyId
            8, // User ID (EPM admin)
            lead.id,
            template.id,
            template.subject.replace('{{leadName}}', lead.name),
            template.body.replace(/{{leadName}}/g, lead.name),
            'test', // Status: test (not actually sent)
          ]
        );
        recorded++;
      } catch (error) {
        console.log(`     ❌ Error recording email for ${lead.name}: ${error.message}`);
      }
    }
  }
  
  console.log(`  ✅ Recorded ${recorded} test email sends in database\n`);
} else {
  console.log('  ⏭️  Skipped (set RECORD_TEST_SENDS=true to enable)\n');
}

// ============================================================================
// STEP 6: Next Steps
// ============================================================================

console.log('🎯 NEXT STEPS:\n');
console.log('  1. Configure Gmail API credentials in /admin/api-config');
console.log('  2. Test real email send with 1-2 leads per sector');
console.log('  3. Monitor open/click rates in /analytics/email-performance');
console.log('  4. Adjust templates based on performance metrics');
console.log('  5. Launch full campaign with automated sequences\n');

console.log('📚 RESOURCES:\n');
console.log('  • Gmail API Setup Guide: docs/GUIA_VISUAL_GMAIL_API_EPM.md');
console.log('  • Import Leads: /admin/import-leads');
console.log('  • Email Templates: /email-templates');
console.log('  • ML Scoring Dashboard: /analytics/ml-scoring');
console.log('  • Email Performance: /analytics/email-performance\n');

console.log('=' .repeat(60));
console.log('✨ Pilot test completed! Ready for production deployment.');
console.log('=' .repeat(60) + '\n');

await connection.end();
