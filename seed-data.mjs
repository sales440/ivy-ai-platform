import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

// Simple seed data script - run with: node seed-data.mjs
// Make sure DATABASE_URL is set in environment

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const connection = await mysql.createConnection(DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Starting seed data generation...\n');

// Get the first company ID (assuming demo company exists)
const [companies] = await connection.query('SELECT id FROM companies LIMIT 1');
if (companies.length === 0) {
  console.error('❌ No companies found. Please create a company first.');
  process.exit(1);
}
const companyId = companies[0].id;
console.log(`✓ Using company ID: ${companyId}`);

// Get first user ID
const [users] = await connection.query('SELECT id FROM users LIMIT 1');
if (users.length === 0) {
  console.error('❌ No users found. Please create a user first.');
  process.exit(1);
}
const userId = users[0].id;
console.log(`✓ Using user ID: ${userId}\n`);

// Sample data
const sampleLeads = [
  { name: 'Sarah Johnson', email: 'sarah.johnson@techcorp.com', company: 'TechCorp Solutions', title: 'VP of Engineering', industry: 'Technology', location: 'San Francisco, CA', companySize: '500-1000', qualificationScore: 85, status: 'qualified' },
  { name: 'Michael Chen', email: 'mchen@innovate.io', company: 'Innovate Labs', title: 'CTO', industry: 'Software', location: 'Austin, TX', companySize: '100-500', qualificationScore: 92, status: 'converted' },
  { name: 'Emily Rodriguez', email: 'emily.r@dataflow.com', company: 'DataFlow Inc', title: 'Director of Operations', industry: 'Data Analytics', location: 'New York, NY', companySize: '1000+', qualificationScore: 78, status: 'qualified' },
  { name: 'David Kim', email: 'david@cloudscale.io', company: 'CloudScale Systems', title: 'Head of Infrastructure', industry: 'Cloud Services', location: 'Seattle, WA', companySize: '500-1000', qualificationScore: 88, status: 'new' },
  { name: 'Jessica Martinez', email: 'jmartinez@fintech.co', company: 'FinTech Solutions', title: 'Chief Product Officer', industry: 'Financial Technology', location: 'Boston, MA', companySize: '100-500', qualificationScore: 95, status: 'qualified' },
  { name: 'Robert Taylor', email: 'rtaylor@healthtech.com', company: 'HealthTech Partners', title: 'VP of Technology', industry: 'Healthcare', location: 'Chicago, IL', companySize: '500-1000', qualificationScore: 72, status: 'contacted' },
  { name: 'Amanda White', email: 'awhite@ecommerce.net', company: 'E-Commerce Hub', title: 'Director of Engineering', industry: 'E-commerce', location: 'Los Angeles, CA', companySize: '100-500', qualificationScore: 81, status: 'new' },
  { name: 'James Anderson', email: 'janderson@ai-startup.io', company: 'AI Startup Co', title: 'Founder & CEO', industry: 'Artificial Intelligence', location: 'San Francisco, CA', companySize: '10-50', qualificationScore: 90, status: 'qualified' },
  { name: 'Lisa Brown', email: 'lbrown@enterprise.com', company: 'Enterprise Systems', title: 'IT Director', industry: 'Enterprise Software', location: 'Dallas, TX', companySize: '1000+', qualificationScore: 65, status: 'contacted' },
  { name: 'Christopher Lee', email: 'clee@mobile-apps.io', company: 'Mobile Apps Inc', title: 'Head of Development', industry: 'Mobile Technology', location: 'Miami, FL', companySize: '50-100', qualificationScore: 76, status: 'new' },
  { name: 'Maria Garcia', email: 'mgarcia@saas-platform.com', company: 'SaaS Platform Co', title: 'VP of Product', industry: 'SaaS', location: 'Denver, CO', companySize: '100-500', qualificationScore: 87, status: 'qualified' },
  { name: 'Daniel Wilson', email: 'dwilson@cybersec.io', company: 'CyberSec Solutions', title: 'Chief Security Officer', industry: 'Cybersecurity', location: 'Washington, DC', companySize: '500-1000', qualificationScore: 93, status: 'qualified' },
  { name: 'Jennifer Moore', email: 'jmoore@marketing-tech.com', company: 'Marketing Tech Ltd', title: 'Director of Technology', industry: 'Marketing Technology', location: 'Portland, OR', companySize: '100-500', qualificationScore: 70, status: 'contacted' },
  { name: 'Kevin Davis', email: 'kdavis@logistics.net', company: 'Logistics Pro', title: 'VP of Operations', industry: 'Logistics', location: 'Atlanta, GA', companySize: '1000+', qualificationScore: 68, status: 'new' },
  { name: 'Rachel Thompson', email: 'rthompson@edtech.io', company: 'EdTech Innovations', title: 'Head of Engineering', industry: 'Education Technology', location: 'Philadelphia, PA', companySize: '50-100', qualificationScore: 84, status: 'qualified' },
];

// Insert leads
console.log('📝 Inserting leads...');
const leadIds = [];
for (const lead of sampleLeads) {
  const [result] = await connection.query(
    `INSERT INTO leads (companyId, name, email, company, title, industry, location, companySize, qualificationScore, status, source, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, NOW(), NOW())`,
    [companyId, lead.name, lead.email, lead.company, lead.title, lead.industry, lead.location, lead.companySize, lead.qualificationScore, lead.status, userId]
  );
  leadIds.push(result.insertId);
}
console.log(`✓ Inserted ${leadIds.length} leads\n`);

// Insert calls
console.log('📞 Inserting calls...');
const callOutcomes = ['callback', 'interested', 'notInterested', 'voicemail', 'noAnswer'];
const callStatuses = ['completed', 'completed', 'completed', 'failed', 'completed'];
for (let i = 0; i < 8; i++) {
  const leadId = leadIds[i % leadIds.length];
  const outcome = callOutcomes[i % callOutcomes.length];
  const status = callStatuses[i % callStatuses.length];
  const duration = status === 'completed' ? Math.floor(Math.random() * 600) + 60 : 0;
  
  await connection.query(
    `INSERT INTO calls (companyId, leadId, status, duration, outcome, transcript, sentiment, createdBy, createdAt, updatedAt, executedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ${i} DAY, NOW() - INTERVAL ${i} DAY, NOW() - INTERVAL ${i} DAY)`,
    [
      companyId,
      leadId,
      status,
      duration,
      outcome,
      `Sample transcript for ${outcome} call. Customer showed ${outcome === 'interested' ? 'high' : 'moderate'} interest.`,
      outcome === 'interested' ? 'positive' : outcome === 'notInterested' ? 'negative' : 'neutral',
      userId
    ]
  );
}
console.log('✓ Inserted 8 calls\n');

// Insert scheduled tasks
console.log('⏰ Inserting scheduled tasks...');
const taskTypes = ['send-email', 'update-lead-score', 'send-notification'];
const taskStatuses = ['pending', 'completed', 'failed', 'pending', 'completed'];
for (let i = 0; i < 15; i++) {
  const taskType = taskTypes[i % taskTypes.length];
  const status = taskStatuses[i % taskStatuses.length];
  const leadId = leadIds[i % leadIds.length];
  
  const scheduledFor = status === 'pending' 
    ? `NOW() + INTERVAL ${i} HOUR`
    : `NOW() - INTERVAL ${i} HOUR`;
  
  const executedAt = status === 'completed' 
    ? `NOW() - INTERVAL ${i} HOUR + INTERVAL 5 MINUTE`
    : 'NULL';
  
  const taskData = JSON.stringify({
    leadId,
    subject: 'Follow-up Email',
    body: 'Sample email body',
  });
  
  await connection.query(
    `INSERT INTO scheduledTasks (companyId, taskType, taskData, status, scheduledFor, executedAt, retryCount, maxRetries, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ${scheduledFor}, ${executedAt}, 0, 3, ?, NOW() - INTERVAL ${i} HOUR, NOW())`,
    [companyId, taskType, taskData, status, userId]
  );
}
console.log('✓ Inserted 15 scheduled tasks\n');

// Insert email logs
console.log('📧 Inserting email logs...');
for (let i = 0; i < 10; i++) {
  const leadId = leadIds[i % leadIds.length];
  const lead = sampleLeads[i % sampleLeads.length];
  const statuses = ['sent', 'opened', 'clicked', 'sent', 'opened'];
  const status = statuses[i % statuses.length];
  
  await connection.query(
    `INSERT INTO emailLogs (companyId, leadId, userId, \`to\`, subject, body, status, sentAt, openedAt, clickedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW() - INTERVAL ${i} DAY, ${status === 'opened' || status === 'clicked' ? `NOW() - INTERVAL ${i} DAY + INTERVAL 2 HOUR` : 'NULL'}, ${status === 'clicked' ? `NOW() - INTERVAL ${i} DAY + INTERVAL 3 HOUR` : 'NULL'})`,
    [
      companyId,
      leadId,
      userId,
      lead.email,
      'Follow-up: Great connecting with you',
      `Hi ${lead.name},\n\nThank you for taking the time to speak with us. We'd love to continue the conversation...\n\nBest regards,\nThe Team`,
      status
    ]
  );
}
console.log('✓ Inserted 10 email logs\n');

// Insert saved searches
console.log('🔖 Inserting saved searches...');
const savedSearches = [
  { name: 'High-Value Tech Leads', filters: { industry: 'Technology', qualificationScore: { min: 80 } } },
  { name: 'San Francisco Prospects', filters: { location: 'San Francisco, CA' } },
  { name: 'Enterprise Contacts', filters: { companySize: '1000+' } },
  { name: 'Qualified CTOs', filters: { title: 'CTO', status: 'qualified' } },
  { name: 'Recent Conversions', filters: { status: 'converted' } },
];

for (const search of savedSearches) {
  await connection.query(
    `INSERT INTO savedSearches (companyId, name, filters, usageCount, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [companyId, search.name, JSON.stringify(search.filters), Math.floor(Math.random() * 20), userId]
  );
}
console.log(`✓ Inserted ${savedSearches.length} saved searches\n`);

await connection.end();

console.log('✅ Seed data generation completed successfully!');
console.log('\nSummary:');
console.log(`  - ${sampleLeads.length} leads`);
console.log('  - 8 calls');
console.log('  - 15 scheduled tasks');
console.log('  - 10 email logs');
console.log(`  - ${savedSearches.length} saved searches`);
