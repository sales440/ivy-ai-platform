import fs from 'fs';
import path from 'path';
import { getDb } from '../server/db';
import { fagorContacts, fagorCampaignEnrollments } from '../drizzle/schema';
import { sendEmail } from '../server/services/sendgrid';

const BCC_EMAIL = 'jcrobledo@fagor-automation.com';
const FROM_EMAIL = 'service@fagor-automation.com';
const FROM_NAME = 'FAGOR Automation Corp.';

async function importAndSendCampaign() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Read contacts from JSON
  const contactsPath = path.join(process.cwd(), '../fagor-contacts-final.json');
  const contactsData = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));

  console.log(`📥 Importing ${contactsData.length} contacts...`);

  // Read email templates
  const email1Path = path.join(process.cwd(), 'campaigns/fagor-training-email-1-the-problem.html');
  const email1Html = fs.readFileSync(email1Path, 'utf-8');

  let successCount = 0;
  let failCount = 0;

  for (const contact of contactsData) {
    try {
      // Insert contact into database
      const [insertedContact] = await db.insert(fagorContacts).values({
        name: contact.contactPerson || 'Decision Maker',
        email: contact.email,
        company: contact.company,
        role: contact.contactPerson || 'Contact',
        phone: contact.phone || null,
        source: 'manual_import',
        status: 'active'
      });

      const contactId = insertedContact.insertId;

      // Enroll in campaign
      await db.insert(fagorCampaignEnrollments).values({
        contactId: contactId,
        campaignName: 'FAGOR CNC Training 2026',
        currentStep: 1,
        status: 'active',
        email1SentAt: new Date(),
        enrolledAt: new Date()
      });

      // Personalize email
      const personalizedHtml = email1Html
        .replace(/\{\{name\}\}/g, contact.contactPerson || 'Decision Maker')
        .replace(/\{\{company\}\}/g, contact.company);

      // Send Email 1 with BCC to jcrobledo@fagor-automation.com
      await sendEmail({
        to: contact.email,
        bcc: BCC_EMAIL,
        from: FROM_EMAIL,
        fromName: FROM_NAME,
        subject: 'The Hidden Cost of Untrained CNC Operators',
        html: personalizedHtml,
        trackOpens: true,
        trackClicks: true
      });

      console.log(`✅ Sent to ${contact.email} (${contact.company}) + BCC to ${BCC_EMAIL}`);
      successCount++;

      // Wait 2 seconds between sends to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed for ${contact.email}:`, error);
      failCount++;
    }
  }

  console.log(`\n📊 Campaign Summary:`);
  console.log(`   ✅ Successfully sent: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 BCC copies sent to: ${BCC_EMAIL}`);
}

importAndSendCampaign()
  .then(() => {
    console.log('\n✅ Campaign import and send completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Campaign failed:', error);
    process.exit(1);
  });
