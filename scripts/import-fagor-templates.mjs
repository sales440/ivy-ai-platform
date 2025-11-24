import { drizzle } from 'drizzle-orm/mysql2';
import { emailCampaigns } from '../drizzle/schema.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = drizzle(process.env.DATABASE_URL);

async function importFAGORTemplates() {
  console.log('📧 Importing FAGOR CNC Training email templates...\n');

  try {
    // Read the 3 HTML templates
    const email1Html = fs.readFileSync(
      path.join(__dirname, '../campaigns/fagor-training-email-1-the-problem.html'),
      'utf-8'
    );
    
    const email2Html = fs.readFileSync(
      path.join(__dirname, '../campaigns/fagor-training-email-2-the-solution.html'),
      'utf-8'
    );
    
    const email3Html = fs.readFileSync(
      path.join(__dirname, '../campaigns/fagor-training-email-3-urgency-cta.html'),
      'utf-8'
    );

    // Template 1: The Problem
    const template1 = await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 1: The Problem',
      type: 'awareness',
      subject: 'The Hidden Cost of Untrained CNC Operators',
      body: email1Html,
      companyId: 1, // Demo Company
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 1 created: "The Problem" (Awareness)');

    // Template 2: The Solution
    const template2 = await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 2: The Solution',
      type: 'consideration',
      subject: 'How to Turn CNC Features Into Competitive Advantages',
      body: email2Html,
      companyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 2 created: "The Solution" (Consideration)');

    // Template 3: The Urgency/CTA
    const template3 = await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 3: Urgency & CTA',
      type: 'decision',
      subject: 'Your 2026 Training Opportunity: Secure Your Spot',
      body: email3Html,
      companyId: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 3 created: "Urgency & CTA" (Decision)');

    console.log('\n🎉 All 3 FAGOR email templates imported successfully!');
    console.log('\n📋 Template Summary:');
    console.log('   Email 1 (Day 0): The Problem - Awareness stage');
    console.log('   Email 2 (Day 3): The Solution - Consideration stage');
    console.log('   Email 3 (Day 7): Urgency & CTA - Decision stage');
    console.log('\n💡 Next steps:');
    console.log('   1. Go to /email-templates in Ivy.AI dashboard');
    console.log('   2. View and test the templates');
    console.log('   3. Use Campaign Control to send emails');

  } catch (error) {
    console.error('❌ Error importing templates:', error);
    throw error;
  }
}

importFAGORTemplates()
  .then(() => {
    console.log('\n✅ Import completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  });
