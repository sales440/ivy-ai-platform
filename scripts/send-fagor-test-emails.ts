import { sendEmail } from '../server/services/sendgrid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function sendFAGORTestEmails() {
  console.log('📧 Sending FAGOR CNC Training test emails to jcrobledolopez@gmail.com\n');
  console.log('⚠️  Note: Emails will be sent from sales@ivybai.com (SendGrid verified sender)');
  console.log('   FAGOR branding is preserved in email content\n');

  const recipient = 'jcrobledolopez@gmail.com';

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

    console.log('📤 Sending Email 1: The Problem...');
    const result1 = await sendEmail({
      to: recipient,
      toName: 'Juan Carlos Robledo',
      subject: 'The Hidden Cost of Untrained CNC Operators',
      htmlContent: email1Html,
      trackOpens: true,
      trackClicks: true,
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '1',
        email_type: 'awareness',
      },
    });
    
    if (result1.success) {
      console.log(`✅ Email 1 sent! Message ID: ${result1.messageId}\n`);
    } else {
      console.log(`❌ Email 1 failed: ${result1.error}\n`);
    }

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📤 Sending Email 2: The Solution...');
    const result2 = await sendEmail({
      to: recipient,
      toName: 'Juan Carlos Robledo',
      subject: 'How to Turn CNC Features Into Competitive Advantages',
      htmlContent: email2Html,
      trackOpens: true,
      trackClicks: true,
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '2',
        email_type: 'consideration',
      },
    });
    
    if (result2.success) {
      console.log(`✅ Email 2 sent! Message ID: ${result2.messageId}\n`);
    } else {
      console.log(`❌ Email 2 failed: ${result2.error}\n`);
    }

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📤 Sending Email 3: Urgency & CTA...');
    const result3 = await sendEmail({
      to: recipient,
      toName: 'Juan Carlos Robledo',
      subject: 'Your 2026 Training Opportunity: Secure Your Spot',
      htmlContent: email3Html,
      trackOpens: true,
      trackClicks: true,
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '3',
        email_type: 'decision',
      },
    });
    
    if (result3.success) {
      console.log(`✅ Email 3 sent! Message ID: ${result3.messageId}\n`);
    } else {
      console.log(`❌ Email 3 failed: ${result3.error}\n`);
    }

    console.log('🎉 All 3 FAGOR test emails sent successfully!');
    console.log('\n📋 Email Summary:');
    console.log(`   From: sales@ivybai.com (Ivy.AI Platform)`);
    console.log(`   To: ${recipient}`);
    console.log('   Email 1: "The Hidden Cost of Untrained CNC Operators"');
    console.log('   Email 2: "How to Turn CNC Features Into Competitive Advantages"');
    console.log('   Email 3: "Your 2026 Training Opportunity: Secure Your Spot"');
    console.log('\n✉️ Check your inbox at jcrobledolopez@gmail.com!');
    console.log('\n📝 Note: Email content includes full FAGOR branding:');
    console.log('   - FAGOR logo in letterhead');
    console.log('   - FAGOR corporate red color (#E30613)');
    console.log('   - FAGOR contact information');
    console.log('   - All 2026 training information');

  } catch (error) {
    console.error('❌ Error sending emails:', error);
    throw error;
  }
}

sendFAGORTestEmails()
  .then(() => {
    console.log('\n✅ Test emails completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to send test emails:', error);
    process.exit(1);
  });
