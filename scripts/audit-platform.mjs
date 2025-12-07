#!/usr/bin/env node
/**
 * Platform Audit Script
 * Comprehensive testing of all Ivy.AI functionality
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function pass(test) {
  results.passed.push(test);
  console.log(`✅ ${test}`);
}

function fail(test, error) {
  results.failed.push({ test, error });
  console.log(`❌ ${test}: ${error}`);
}

function warn(test, message) {
  results.warnings.push({ test, message });
  console.log(`⚠️  ${test}: ${message}`);
}

async function auditPlatform() {
  console.log('🔍 Starting Ivy.AI Platform Audit...\n');
  console.log('═'.repeat(60));
  
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    // ============ DATABASE TESTS ============
    console.log('\n📊 DATABASE AUDIT\n');
    
    // Test 1: Check all required tables exist
    const requiredTables = [
      'users', 'companies', 'agents', 'leads', 'tickets', 
      'workflows', 'tasks', 'knowledgeBase', 'agentCommunications',
      'calls', 'emailCampaigns', 'scheduledTasks'
    ];
    
    for (const table of requiredTables) {
      try {
        await connection.query(`SELECT 1 FROM ${table} LIMIT 1`);
        pass(`Table exists: ${table}`);
      } catch (error) {
        fail(`Table missing: ${table}`, error.message);
      }
    }
    
    // Test 2: Check Demo Company exists
    const [companies] = await connection.query('SELECT * FROM companies WHERE name LIKE "%Demo%"');
    if (companies.length > 0) {
      pass(`Demo Company exists (ID: ${companies[0].id})`);
    } else {
      fail('Demo Company missing', 'No company found with "Demo" in name');
    }
    
    // Test 3: Check seed data
    const [leads] = await connection.query('SELECT COUNT(*) as count FROM leads');
    if (leads[0].count > 0) {
      pass(`Leads data populated: ${leads[0].count} leads`);
    } else {
      warn('No leads data', 'Run seed script to populate demo data');
    }
    
    const [tickets] = await connection.query('SELECT COUNT(*) as count FROM tickets');
    if (tickets[0].count > 0) {
      pass(`Tickets data populated: ${tickets[0].count} tickets`);
    } else {
      warn('No tickets data', 'Run seed script to populate demo data');
    }
    
    const [emailTemplates] = await connection.query('SELECT COUNT(*) as count FROM emailCampaigns');
    if (emailTemplates[0].count > 0) {
      pass(`Email templates created: ${emailTemplates[0].count} templates`);
    } else {
      warn('No email templates', 'Run seed-email-templates.mjs script');
    }
    
    // Test 4: Check agents exist
    const [agents] = await connection.query('SELECT * FROM agents');
    if (agents.length === 6) {
      pass(`All 6 agents exist: ${agents.map(a => a.name).join(', ')}`);
    } else if (agents.length > 0) {
      warn(`Only ${agents.length} agents found`, 'Expected 6 agents');
    } else {
      fail('No agents found', 'Agents table is empty');
    }
    
    // ============ ENVIRONMENT VARIABLES TESTS ============
    console.log('\n🔐 ENVIRONMENT VARIABLES AUDIT\n');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'VITE_APP_ID',
      'OAUTH_SERVER_URL',
      'BUILT_IN_FORGE_API_KEY',
      'BUILT_IN_FORGE_API_URL'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        pass(`Environment variable set: ${envVar}`);
      } else {
        fail(`Environment variable missing: ${envVar}`, 'Not configured');
      }
    }
    
    // Optional but recommended
    const optionalEnvVars = [
      'TELNYX_API_KEY',
      'TELNYX_PHONE_NUMBER',
      'TELNYX_CONNECTION_ID'
    ];
    
    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        pass(`Optional environment variable set: ${envVar}`);
      } else {
        warn(`Optional environment variable missing: ${envVar}`, 'Required for Telnyx integration');
      }
    }
    
    // ============ DATA INTEGRITY TESTS ============
    console.log('\n🔍 DATA INTEGRITY AUDIT\n');
    
    // Test: Leads have valid companyId
    const [orphanLeads] = await connection.query(`
      SELECT COUNT(*) as count FROM leads 
      WHERE companyId NOT IN (SELECT id FROM companies)
    `);
    if (orphanLeads[0].count === 0) {
      pass('All leads have valid companyId');
    } else {
      fail('Orphan leads found', `${orphanLeads[0].count} leads with invalid companyId`);
    }
    
    // Test: Tickets have valid companyId
    const [orphanTickets] = await connection.query(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE companyId NOT IN (SELECT id FROM companies)
    `);
    if (orphanTickets[0].count === 0) {
      pass('All tickets have valid companyId');
    } else {
      fail('Orphan tickets found', `${orphanTickets[0].count} tickets with invalid companyId`);
    }
    
    // Test: Email campaigns have valid companyId
    const [orphanCampaigns] = await connection.query(`
      SELECT COUNT(*) as count FROM emailCampaigns 
      WHERE companyId NOT IN (SELECT id FROM companies)
    `);
    if (orphanCampaigns[0].count === 0) {
      pass('All email campaigns have valid companyId');
    } else {
      fail('Orphan email campaigns found', `${orphanCampaigns[0].count} campaigns with invalid companyId`);
    }
    
    // ============ SUMMARY ============
    console.log('\n' + '═'.repeat(60));
    console.log('\n📊 AUDIT SUMMARY\n');
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.failed.forEach(({ test, error }) => {
        console.log(`  - ${test}: ${error}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      results.warnings.forEach(({ test, message }) => {
        console.log(`  - ${test}: ${message}`);
      });
    }
    
    // ============ READINESS ASSESSMENT ============
    console.log('\n' + '═'.repeat(60));
    console.log('\n🎯 PLATFORM READINESS ASSESSMENT\n');
    
    const criticalFailures = results.failed.filter(f => 
      f.test.includes('Table missing') || 
      f.test.includes('Demo Company missing') ||
      f.test.includes('Environment variable missing')
    );
    
    if (criticalFailures.length === 0 && results.failed.length === 0) {
      console.log('✅ READY FOR PRODUCTION');
      console.log('   All critical tests passed. Platform is ready for client demos.');
    } else if (criticalFailures.length === 0) {
      console.log('⚠️  READY WITH MINOR ISSUES');
      console.log('   Core functionality works, but some non-critical tests failed.');
    } else {
      console.log('❌ NOT READY FOR PRODUCTION');
      console.log('   Critical issues found. Fix these before launching:');
      criticalFailures.forEach(({ test, error }) => {
        console.log(`   - ${test}: ${error}`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Audit failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

auditPlatform();
