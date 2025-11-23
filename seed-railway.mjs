#!/usr/bin/env node

/**
 * Database seeding script for Railway deployment
 * Populates demo data for Ivy.AI Platform
 */

import mysql from 'mysql2/promise';

// Database connection config
const DB_CONFIG = {
  host: 'interchange.proxy.rlwy.net',
  port: 29565,
  user: 'root',
  password: 'VYHCOzpWCQMJQFRbSiaLXEHeJhGRIINE',
  database: 'railway',
  multipleStatements: true
};

async function seedDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to Railway MySQL database...');
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected successfully\n');
    
    // 1. Seed Leads
    console.log('📊 Seeding leads...');
    const leads = [
      ['John Smith', 'john.smith@techcorp.com', '+1-555-0101', 'TechCorp', 'CTO', 'awareness', 'new', 'Enterprise software solutions'],
      ['Sarah Johnson', 'sarah.j@innovate.io', '+1-555-0102', 'Innovate.io', 'CEO', 'consideration', 'contacted', 'AI-powered analytics'],
      ['Michael Chen', 'mchen@dataflow.com', '+1-555-0103', 'DataFlow Inc', 'VP Engineering', 'decision', 'qualified', 'Data pipeline automation'],
      ['Emily Rodriguez', 'emily.r@cloudnine.com', '+1-555-0104', 'CloudNine', 'Product Manager', 'awareness', 'new', 'Cloud infrastructure'],
      ['David Kim', 'dkim@smartai.co', '+1-555-0105', 'SmartAI Co', 'Head of AI', 'consideration', 'nurturing', 'Machine learning platform'],
      ['Lisa Wang', 'lwang@fintech.io', '+1-555-0106', 'FinTech Solutions', 'CFO', 'decision', 'qualified', 'Financial automation'],
      ['James Brown', 'jbrown@retailpro.com', '+1-555-0107', 'RetailPro', 'COO', 'awareness', 'contacted', 'Retail analytics'],
      ['Maria Garcia', 'mgarcia@healthtech.com', '+1-555-0108', 'HealthTech', 'Director', 'consideration', 'nurturing', 'Healthcare AI'],
      ['Robert Taylor', 'rtaylor@edutech.org', '+1-555-0109', 'EduTech', 'CTO', 'decision', 'qualified', 'Education platform'],
      ['Jennifer Lee', 'jlee@marketing.ai', '+1-555-0110', 'Marketing.AI', 'CMO', 'awareness', 'new', 'Marketing automation']
    ];
    
    for (const lead of leads) {
      await connection.execute(
        `INSERT INTO leads (name, email, phone, company, jobTitle, stage, status, notes, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        lead
      );
    }
    console.log(`✅ Seeded ${leads.length} leads\n`);
    
    // 2. Seed Companies
    console.log('🏢 Seeding companies...');
    const companies = [
      ['TechCorp', 'Enterprise', 'Technology', 'https://techcorp.example.com', 'San Francisco, CA', 500],
      ['Innovate.io', 'Mid-Market', 'SaaS', 'https://innovate.io', 'Austin, TX', 150],
      ['DataFlow Inc', 'Enterprise', 'Data Analytics', 'https://dataflow.com', 'New York, NY', 300],
      ['CloudNine', 'Startup', 'Cloud Services', 'https://cloudnine.com', 'Seattle, WA', 50],
      ['SmartAI Co', 'Mid-Market', 'AI/ML', 'https://smartai.co', 'Boston, MA', 200]
    ];
    
    for (const company of companies) {
      await connection.execute(
        `INSERT INTO companies (name, size, industry, website, location, employeeCount, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        company
      );
    }
    console.log(`✅ Seeded ${companies.length} companies\n`);
    
    // 3. Seed Agents
    console.log('🤖 Seeding AI agents...');
    const agents = [
      ['Prospect Agent', 'prospect', 'Identifies and qualifies potential leads', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.7})],
      ['Closer Agent', 'closer', 'Handles final sales negotiations', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.5})],
      ['Insight Agent', 'insight', 'Analyzes customer data and trends', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.3})],
      ['Solve Agent', 'solve', 'Provides technical solutions', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.6})],
      ['Talent Agent', 'talent', 'Assists with HR and recruitment', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.7})],
      ['Logic Agent', 'logic', 'Handles complex decision-making', 'active', JSON.stringify({model: 'gpt-4', temperature: 0.4})]
    ];
    
    for (const agent of agents) {
      await connection.execute(
        `INSERT INTO agents (name, type, description, status, config, createdAt) 
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        agent
      );
    }
    console.log(`✅ Seeded ${agents.length} AI agents\n`);
    
    // 4. Seed Email Templates
    console.log('📧 Seeding email templates...');
    const templates = [
      ['Welcome Email', 'welcome', 'Hi {{name}},\n\nWelcome to Ivy.AI! We\'re excited to have you on board.\n\nBest regards,\nThe Ivy.AI Team', 'active'],
      ['Demo Request Follow-up', 'demo_followup', 'Hi {{name}},\n\nThank you for requesting a demo. We\'ll be in touch shortly.\n\nBest,\nSales Team', 'active'],
      ['Case Study Share', 'case_study', 'Hi {{name}},\n\nCheck out how {{company}} achieved 300% ROI with Ivy.AI.\n\nRead more: [link]\n\nBest,\nMarketing Team', 'active'],
      ['Product Update', 'product_update', 'Hi {{name}},\n\nWe\'ve just released exciting new features!\n\nLearn more: [link]\n\nBest,\nProduct Team', 'active']
    ];
    
    for (const template of templates) {
      await connection.execute(
        `INSERT INTO emailTemplates (name, type, content, status, createdAt) 
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        template
      );
    }
    console.log(`✅ Seeded ${templates.length} email templates\n`);
    
    // 5. Seed Support Tickets
    console.log('🎫 Seeding support tickets...');
    const tickets = [
      ['Integration Issue', 'Cannot connect to API', 'high', 'open', 1],
      ['Feature Request', 'Need bulk import functionality', 'medium', 'in_progress', 2],
      ['Bug Report', 'Dashboard not loading', 'high', 'open', 3],
      ['Question', 'How to set up webhooks?', 'low', 'resolved', 4],
      ['Performance Issue', 'Slow response times', 'high', 'in_progress', 5]
    ];
    
    for (const ticket of tickets) {
      await connection.execute(
        `INSERT INTO tickets (title, description, priority, status, leadId, createdAt) 
         VALUES (?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE title=VALUES(title)`,
        ticket
      );
    }
    console.log(`✅ Seeded ${tickets.length} support tickets\n`);
    
    // 6. Get counts
    console.log('📊 Database Summary:');
    const tables = ['leads', 'companies', 'agents', 'emailTemplates', 'tickets', 'multiChannelCampaigns'];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${rows[0].count} records`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Login to: https://ivy-ai-platform-production.up.railway.app');
    console.log('2. Navigate to: /multi-channel-campaigns');
    console.log('3. Create your first campaign');
    console.log('4. Execute it with one of the demo leads');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run seeding
seedDatabase();
