#!/usr/bin/env node

/**
 * Database seeding script for Railway deployment
 * Populates demo data for Ivy.AI Platform
 */

import mysql from 'mysql2/promise';
import { randomUUID } from 'crypto';

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
      ['John Smith', 'john.smith@techcorp.com', 'TechCorp', 'CTO', 'Technology', 'San Francisco, CA', 'Enterprise', 85, 'A', 'qualified', 'Website'],
      ['Sarah Johnson', 'sarah.j@innovate.io', 'Innovate.io', 'CEO', 'SaaS', 'Austin, TX', 'Mid-Market', 78, 'B', 'contacted', 'Referral'],
      ['Michael Chen', 'mchen@dataflow.com', 'DataFlow Inc', 'VP Engineering', 'Data Analytics', 'New York, NY', 'Enterprise', 92, 'A', 'qualified', 'Conference'],
      ['Emily Rodriguez', 'emily.r@cloudnine.com', 'CloudNine', 'Product Manager', 'Cloud Services', 'Seattle, WA', 'Startup', 65, 'B', 'new', 'LinkedIn'],
      ['David Kim', 'dkim@smartai.co', 'SmartAI Co', 'Head of AI', 'AI/ML', 'Boston, MA', 'Mid-Market', 88, 'A', 'nurture', 'Partner'],
      ['Lisa Wang', 'lwang@fintech.io', 'FinTech Solutions', 'CFO', 'Financial Services', 'Chicago, IL', 'Enterprise', 80, 'A', 'qualified', 'Webinar'],
      ['James Brown', 'jbrown@retailpro.com', 'RetailPro', 'COO', 'Retail', 'Los Angeles, CA', 'Mid-Market', 70, 'B', 'contacted', 'Email Campaign'],
      ['Maria Garcia', 'mgarcia@healthtech.com', 'HealthTech', 'Director', 'Healthcare', 'Miami, FL', 'Startup', 60, 'C', 'new', 'Website'],
      ['Robert Taylor', 'rtaylor@edutech.org', 'EduTech', 'CTO', 'Education', 'Portland, OR', 'Mid-Market', 75, 'B', 'nurture', 'Content Download'],
      ['Jennifer Lee', 'jlee@marketing.ai', 'Marketing.AI', 'CMO', 'Marketing Tech', 'Denver, CO', 'Startup', 68, 'B', 'contacted', 'Social Media']
    ];
    
    for (const lead of leads) {
      const leadId = randomUUID();
      await connection.execute(
        `INSERT INTO leads (leadId, name, email, company, title, industry, location, companySize, qualificationScore, qualificationLevel, status, source, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE name=VALUES(name)`,
        [leadId, ...lead]
      );
    }
    console.log(`✅ Seeded ${leads.length} leads\n`);
    
    // 2. Create a demo multi-channel campaign
    console.log('🎯 Creating demo multi-channel campaign...');
    
    const [campaignResult] = await connection.execute(
      `INSERT INTO multiChannelCampaigns (name, description, targetAudience, status, createdAt) 
       VALUES (?, ?, ?, ?, NOW())`,
      ['Q1 2025 Nurture Campaign', 'Automated email + LinkedIn campaign for qualified leads', 'Enterprise decision-makers', 'active']
    );
    
    const campaignId = campaignResult.insertId;
    console.log(`✅ Created campaign ID: ${campaignId}`);
    
    // 3. Add campaign steps
    console.log('📝 Adding campaign steps...');
    const steps = [
      [campaignId, 1, 'email', 1, null, 0],
      [campaignId, 2, 'linkedin', null, 'thought_leadership', 2],
      [campaignId, 3, 'email', 2, null, 3],
      [campaignId, 4, 'linkedin', null, 'case_study', 5],
      [campaignId, 5, 'email', 3, null, 7]
    ];
    
    for (const step of steps) {
      await connection.execute(
        `INSERT INTO campaignSteps (campaignId, stepOrder, stepType, emailSequenceId, linkedInPostType, delayDays, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        step
      );
    }
    console.log(`✅ Added ${steps.length} campaign steps\n`);
    
    // 4. Get counts
    console.log('📊 Database Summary:');
    const tables = ['leads', 'multiChannelCampaigns', 'campaignSteps', 'campaignExecutions'];
    
    for (const table of tables) {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table}: ${rows[0].count} records`);
    }
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Campaign Created:');
    console.log(`   Name: Q1 2025 Nurture Campaign`);
    console.log(`   ID: ${campaignId}`);
    console.log(`   Steps: 5 (Email → LinkedIn → Email → LinkedIn → Email)`);
    console.log(`   Status: Active`);
    console.log('\n📋 Next steps:');
    console.log('1. Login to: https://ivy-ai-platform-production.up.railway.app');
    console.log('2. Navigate to: /multi-channel-campaigns');
    console.log('3. View the demo campaign');
    console.log('4. Execute it with one of the 10 demo leads');
    
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
