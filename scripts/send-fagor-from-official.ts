import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY not found in environment');
}
sgMail.setApiKey(SENDGRID_API_KEY);

async function sendFAGORTestEmails() {
  console.log('📧 Sending FAGOR CNC Training test emails\n');
  console.log('   From: service@fagor-automation.com (FAGOR Automation Corp.)');
  console.log('   To: jcrobledolopez@gmail.com\n');

  const recipient = 'jcrobledolopez@gmail.com';
  const fromEmail = 'service@fagor-automation.com';
  const fromName = 'FAGOR Automation Corp.';

  try {
    // Read the 3 HTML templates (now with embedded logo)
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
    const msg1 = {
      to: recipient,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'The Hidden Cost of Untrained CNC Operators',
      html: email1Html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '1',
        email_type: 'awareness',
      },
    };

    const [response1] = await sgMail.send(msg1);
    console.log(`✅ Email 1 sent! Message ID: ${response1.headers['x-message-id']}\n`);

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📤 Sending Email 2: The Solution...');
    const msg2 = {
      to: recipient,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'How to Turn CNC Features Into Competitive Advantages',
      html: email2Html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '2',
        email_type: 'consideration',
      },
    };

    const [response2] = await sgMail.send(msg2);
    console.log(`✅ Email 2 sent! Message ID: ${response2.headers['x-message-id']}\n`);

    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📤 Sending Email 3: Urgency & CTA...');
    const msg3 = {
      to: recipient,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: 'Your 2026 Training Opportunity: Secure Your Spot',
      html: email3Html,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        email_sequence: '3',
        email_type: 'decision',
      },
    };

    const [response3] = await sgMail.send(msg3);
    console.log(`✅ Email 3 sent! Message ID: ${response3.headers['x-message-id']}\n`);

    console.log('🎉 All 3 FAGOR test emails sent successfully!');
    console.log('\n📋 Email Summary:');
    console.log(`   From: ${fromEmail} (${fromName})`);
    console.log(`   To: ${recipient}`);
    console.log('   Email 1: "The Hidden Cost of Untrained CNC Operators"');
    console.log('   Email 2: "How to Turn CNC Features Into Competitive Advantages"');
    console.log('   Email 3: "Your 2026 Training Opportunity: Secure Your Spot"');
    console.log('\n✉️ Check your inbox at jcrobledolopez@gmail.com!');
    console.log('\n✅ All emails include:');
    console.log('   - Embedded FAGOR logo (displays in all email clients)');
    console.log('   - FAGOR corporate red color (#E30613)');
    console.log('   - Complete FAGOR contact information');
    console.log('   - 2026 training information');

  } catch (error: any) {
    console.error('❌ Error sending emails:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
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
