import { drizzle } from 'drizzle-orm/mysql2';
import { emailCampaigns } from '../drizzle/schema';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = drizzle(process.env.DATABASE_URL!);

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

    // Template 1: The Problem (Day 0)
    await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 1: The Problem',
      subject: 'The Hidden Cost of Untrained CNC Operators',
      body: email1Html,
      companyId: 1, // Demo Company
      triggerType: 'manual',
      sector: 'manufacturing',
      sequence: 1,
      delayDays: 0,
      active: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 1 created: "The Problem" (Day 0 - Awareness)');

    // Template 2: The Solution (Day 3)
    await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 2: The Solution',
      subject: 'How to Turn CNC Features Into Competitive Advantages',
      body: email2Html,
      companyId: 1,
      triggerType: 'manual',
      sector: 'manufacturing',
      sequence: 2,
      delayDays: 3,
      active: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 2 created: "The Solution" (Day 3 - Consideration)');

    // Template 3: The Urgency/CTA (Day 7)
    await db.insert(emailCampaigns).values({
      name: 'FAGOR Training - Email 3: Urgency & CTA',
      subject: 'Your 2026 Training Opportunity: Secure Your Spot',
      body: email3Html,
      companyId: 1,
      triggerType: 'manual',
      sector: 'manufacturing',
      sequence: 3,
      delayDays: 7,
      active: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Template 3 created: "Urgency & CTA" (Day 7 - Decision)');

    console.log('\n🎉 All 3 FAGOR email templates imported successfully!');
    console.log('\n📋 Template Summary:');
    console.log('   Email 1 (Day 0): The Problem - Awareness stage');
    console.log('   Email 2 (Day 3): The Solution - Consideration stage');
    console.log('   Email 3 (Day 7): Urgency & CTA - Decision stage');
    console.log('\n💡 How to send these emails:');
    console.log('   1. Go to https://ivyai-hoxbpybq.manus.space/email-templates');
    console.log('   2. View the 3 FAGOR templates');
    console.log('   3. Use the email sending interface to send to your contacts');
    console.log('\n📧 Ready to send to the email addresses you provide!');

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
