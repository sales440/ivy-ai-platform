#!/usr/bin/env node
import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

console.log('🔍 Testing SendGrid Configuration');
console.log('=' .repeat(80));

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY environment variable is not set!');
  process.exit(1);
}

console.log(`✅ API Key found (length: ${SENDGRID_API_KEY.length})`);
console.log(`   First 10 chars: ${SENDGRID_API_KEY.substring(0, 10)}...`);

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

console.log('\n📧 Attempting to send test email...');

const msg = {
  to: 'test@example.com', // This will fail but shows if API key works
  from: 'training@fagor-automation.com',
  subject: 'SendGrid Test',
  text: 'This is a test email',
  html: '<strong>This is a test email</strong>',
};

try {
  await sgMail.send(msg);
  console.log('✅ Email sent successfully!');
} catch (error) {
  console.error('\n❌ SendGrid Error:');
  console.error('   Status:', error.code);
  console.error('   Message:', error.message);
  
  if (error.response) {
    console.error('   Response body:', JSON.stringify(error.response.body, null, 2));
  }
  
  if (error.code === 401 || error.code === 403) {
    console.error('\n⚠️  Authentication failed. Possible reasons:');
    console.error('   1. API key is invalid or expired');
    console.error('   2. API key doesn\'t have "Mail Send" permissions');
    console.error('   3. SendGrid account is not verified');
  }
}
