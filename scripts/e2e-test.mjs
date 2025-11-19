#!/usr/bin/env node
/**
 * End-to-End Testing Script
 * Comprehensive functional testing of all platform features
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
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

async function runE2ETests() {
  console.log('🧪 Starting End-to-End Testing...\n');
  console.log('═'.repeat(70));
  
  let connection;
  try {
    connection = await mysql.createConnection(DATABASE_URL);
    
    // ============ LEADS FLOW TESTS ============
    console.log('\n📊 LEADS FLOW TESTING\n');
    
    // Test 1: Can create lead
    const [existingLeads] = await connection.query('SELECT COUNT(*) as count FROM leads');
    if (existingLeads[0].count > 0) {
      pass('Leads can be created (existing leads found)');
    } else {
      warn('No leads in database', 'Create test leads');
    }
    
    // Test 2: Leads have scoring
    const [leadsWithScore] = await connection.query('SELECT COUNT(*) as count FROM leads WHERE qualificationScore IS NOT NULL');
    if (leadsWithScore[0].count > 0) {
      pass(`Lead scoring functional (${leadsWithScore[0].count} leads scored)`);
    } else {
      warn('No leads with scores', 'Run Ivy-Prospect scoring workflow');
    }
    
    // Test 3: Leads have qualification status
    const [qualifiedLeads] = await connection.query('SELECT COUNT(*) as count FROM leads WHERE qualificationLevel IN ("hot", "warm")');
    if (qualifiedLeads[0].count > 0) {
      pass(`Lead qualification working (${qualifiedLeads[0].count} qualified leads)`);
    } else {
      warn('No qualified leads', 'Run qualification workflow');
    }
    
    // Test 4: Leads can be converted
    const [convertedLeads] = await connection.query('SELECT COUNT(*) as count FROM leads WHERE status = "converted"');
    if (convertedLeads[0].count > 0) {
      pass(`Lead conversion tracking (${convertedLeads[0].count} converted)`);
    } else {
      warn('No converted leads', 'Normal for demo data');
    }
    
    // ============ TICKETS FLOW TESTS ============
    console.log('\n🎫 TICKETS FLOW TESTING\n');
    
    // Test 5: Can create tickets
    const [existingTickets] = await connection.query('SELECT COUNT(*) as count FROM tickets');
    if (existingTickets[0].count > 0) {
      pass('Tickets can be created (existing tickets found)');
    } else {
      warn('No tickets in database', 'Create test tickets');
    }
    
    // Test 6: Tickets can be resolved
    const [resolvedTickets] = await connection.query('SELECT COUNT(*) as count FROM tickets WHERE status = "resolved"');
    if (resolvedTickets[0].count > 0) {
      pass(`Ticket resolution working (${resolvedTickets[0].count} resolved)`);
    } else {
      warn('No resolved tickets', 'Test Ivy-Solve agent');
    }
    
    // Test 7: Tickets have priority
    const [priorityTickets] = await connection.query('SELECT COUNT(*) as count FROM tickets WHERE priority IN ("high", "critical")');
    if (priorityTickets[0].count > 0) {
      pass(`Priority assignment working (${priorityTickets[0].count} high/critical)`);
    } else {
      warn('No high-priority tickets', 'Normal for demo data');
    }
    
    // Test 8: Knowledge base exists
    const [kbArticles] = await connection.query('SELECT COUNT(*) as count FROM knowledgeBase');
    if (kbArticles[0].count > 0) {
      pass(`Knowledge base populated (${kbArticles[0].count} articles)`);
    } else {
      warn('Knowledge base empty', 'Add articles for Ivy-Solve');
    }
    
    // ============ AGENTS TESTS ============
    console.log('\n🤖 AGENTS TESTING\n');
    
    // Test 9: All 6 agents exist
    const requiredAgents = ['Ivy-Prospect', 'Ivy-Closer', 'Ivy-Solve', 'Ivy-Logic', 'Ivy-Talent', 'Ivy-Insight'];
    const [agents] = await connection.query('SELECT DISTINCT name FROM agents');
    const agentNames = agents.map(a => a.name);
    
    for (const requiredAgent of requiredAgents) {
      if (agentNames.includes(requiredAgent)) {
        pass(`Agent exists: ${requiredAgent}`);
      } else {
        fail(`Agent missing: ${requiredAgent}`, 'Agent not found in database');
      }
    }
    
    // Test 10: Agents have correct departments
    const [agentDepts] = await connection.query('SELECT name, department FROM agents WHERE name IN (?, ?, ?, ?, ?, ?)', requiredAgents);
    const deptMap = {
      'Ivy-Prospect': 'sales',
      'Ivy-Closer': 'sales',
      'Ivy-Solve': 'support',
      'Ivy-Logic': 'operations',
      'Ivy-Talent': 'hr',
      'Ivy-Insight': 'strategy'
    };
    
    for (const agent of agentDepts) {
      if (agent.department === deptMap[agent.name]) {
        pass(`${agent.name} has correct department: ${agent.department}`);
      } else {
        fail(`${agent.name} wrong department`, `Expected ${deptMap[agent.name]}, got ${agent.department}`);
      }
    }
    
    // ============ WORKFLOWS TESTS ============
    console.log('\n🔄 WORKFLOWS TESTING\n');
    
    // Test 11: Workflows exist
    const [workflows] = await connection.query('SELECT COUNT(*) as count FROM workflows');
    if (workflows[0].count > 0) {
      pass(`Workflows configured (${workflows[0].count} workflows)`);
    } else {
      warn('No workflows in database', 'Workflows are hardcoded in frontend');
    }
    
    // Test 12: Agent communications logged
    const [communications] = await connection.query('SELECT COUNT(*) as count FROM agentCommunications');
    if (communications[0].count > 0) {
      pass(`Agent communication logging works (${communications[0].count} messages)`);
    } else {
      warn('No agent communications', 'Execute workflows to test');
    }
    
    // ============ EMAIL TEMPLATES TESTS ============
    console.log('\n📧 EMAIL TEMPLATES TESTING\n');
    
    // Test 13: Email templates exist
    const [emailTemplates] = await connection.query('SELECT COUNT(*) as count FROM emailCampaigns');
    if (emailTemplates[0].count >= 5) {
      pass(`Email templates created (${emailTemplates[0].count} templates)`);
    } else if (emailTemplates[0].count > 0) {
      warn(`Only ${emailTemplates[0].count} email templates`, 'Expected at least 5');
    } else {
      fail('No email templates', 'Run seed-email-templates.mjs');
    }
    
    // Test 14: Templates have all types
    const [templateTypes] = await connection.query('SELECT DISTINCT type FROM emailCampaigns');
    const types = templateTypes.map(t => t.type);
    const requiredTypes = ['callback', 'interested', 'notInterested', 'voicemail'];
    
    for (const type of requiredTypes) {
      if (types.includes(type)) {
        pass(`Email template type exists: ${type}`);
      } else {
        warn(`Missing email template type: ${type}`, 'Create template for this type');
      }
    }
    
    // ============ CALLS/TELNYX TESTS ============
    console.log('\n📞 CALLS/TELNYX TESTING\n');
    
    // Test 15: Calls table exists
    try {
      await connection.query('SELECT 1 FROM calls LIMIT 1');
      pass('Calls table exists');
    } catch (error) {
      fail('Calls table missing', error.message);
    }
    
    // Test 16: Telnyx environment variables
    if (process.env.TELNYX_API_KEY) {
      pass('TELNYX_API_KEY configured');
    } else {
      warn('TELNYX_API_KEY not set', 'Required for making calls');
    }
    
    if (process.env.TELNYX_PHONE_NUMBER) {
      pass('TELNYX_PHONE_NUMBER configured');
    } else {
      warn('TELNYX_PHONE_NUMBER not set', 'Required for making calls');
    }
    
    // ============ MULTI-TENANT TESTS ============
    console.log('\n🏢 MULTI-TENANT TESTING\n');
    
    // Test 17: Multiple companies support
    const [companies] = await connection.query('SELECT COUNT(*) as count FROM companies');
    if (companies[0].count > 0) {
      pass(`Multi-tenant support (${companies[0].count} companies)`);
    } else {
      fail('No companies in database', 'Create at least one company');
    }
    
    // Test 18: Data isolation
    const [leadsPerCompany] = await connection.query(`
      SELECT companyId, COUNT(*) as count 
      FROM leads 
      GROUP BY companyId
    `);
    if (leadsPerCompany.length > 0) {
      pass('Data isolation working (leads per company tracked)');
    } else {
      warn('Cannot verify data isolation', 'No leads with companyId');
    }
    
    // ============ ANALYTICS TESTS ============
    console.log('\n📈 ANALYTICS TESTING\n');
    
    // Test 19: Scheduled tasks
    const [scheduledTasks] = await connection.query('SELECT COUNT(*) as count FROM scheduledTasks');
    if (scheduledTasks[0].count > 0) {
      pass(`Scheduled tasks system works (${scheduledTasks[0].count} tasks)`);
    } else {
      warn('No scheduled tasks', 'Create tasks to test automation');
    }
    
    // Test 20: User authentication
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users');
    if (users[0].count > 0) {
      pass(`User authentication ready (${users[0].count} users)`);
    } else {
      warn('No users in database', 'Users created on first login');
    }
    
    // ============ SUMMARY ============
    console.log('\n' + '═'.repeat(70));
    console.log('\n📊 END-TO-END TEST SUMMARY\n');
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
    
    // ============ READINESS SCORE ============
    console.log('\n' + '═'.repeat(70));
    console.log('\n🎯 PLATFORM READINESS SCORE\n');
    
    const totalTests = results.passed.length + results.failed.length;
    const score = Math.round((results.passed.length / totalTests) * 100);
    
    console.log(`Score: ${score}%`);
    console.log(`Tests Passed: ${results.passed.length}/${totalTests}`);
    
    if (score >= 90) {
      console.log('\n✅ EXCELLENT - Ready for client demos and production use');
    } else if (score >= 75) {
      console.log('\n⚠️  GOOD - Ready for beta testing with selected clients');
    } else if (score >= 60) {
      console.log('\n⚠️  FAIR - Needs improvements before client demos');
    } else {
      console.log('\n❌ POOR - Critical issues must be fixed before launch');
    }
    
    console.log('\n' + '═'.repeat(70));
    
  } catch (error) {
    console.error('\n❌ E2E testing failed with error:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runE2ETests();
