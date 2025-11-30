#!/usr/bin/env node
import sgMail from '@sendgrid/mail';

const API_KEY = "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";

console.log('🔍 Testing SendGrid API');
console.log('API Key length:', API_KEY.length);
console.log('API Key prefix:', API_KEY.substring(0, 20) + '...');
console.log('');

sgMail.setApiKey(API_KEY);

const msg = {
  to: 'info@dongheekautex.com',
  from: 'service@fagor-automation.com',
  subject: 'FAGOR CNC Training Test',
  text: 'This is a test email',
  html: '<strong>Test email from FAGOR</strong>',
};

console.log('📧 Attempting to send email...');
console.log('To:', msg.to);
console.log('From:', msg.from);
console.log('');

try {
  const response = await sgMail.send(msg);
  console.log('✅ SUCCESS!');
  console.log('Response:', JSON.stringify(response, null, 2));
} catch (error) {
  console.log('❌ FAILED');
  console.log('Error code:', error.code);
  console.log('Error message:', error.message);
  console.log('');
  if (error.response) {
    console.log('Response status:', error.response.statusCode);
    console.log('Response body:', JSON.stringify(error.response.body, null, 2));
  }
}
