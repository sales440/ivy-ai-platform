#!/usr/bin/env node

/**
 * Email Test Script
 * Sends test emails using the email workflow system
 */

import { executeEmailWorkflow } from './server/email-workflow-executor.js';

async function main() {
  console.log('🚀 Starting email workflow test...\n');

  // Test data for a sample lead
  const testLead = {
    email: 'jcrobledolopez@gmail.com', // Juan Carlos's email for testing
    name: 'Juan Carlos Robledo',
    company: 'RP Commerce Group LLC',
    industry: 'Technology',
    painPoint: 'Manual lead qualification process',
  };

  console.log('📧 Test Lead Data:');
  console.log(JSON.stringify(testLead, null, 2));
  console.log('\n---\n');

  // Test Sequence 1: Welcome & Introduction
  console.log('📨 Sending Email Sequence 1: welcome_intro');
  try {
    const result1 = await executeEmailWorkflow('welcome_intro', testLead);
    console.log('✅ Result:', result1);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Wait 2 seconds before next email
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Sequence 2: Product Demo
  console.log('📨 Sending Email Sequence 2: product_demo');
  try {
    const result2 = await executeEmailWorkflow('product_demo', testLead);
    console.log('✅ Result:', result2);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Wait 2 seconds before next email
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test Sequence 3: Case Study
  console.log('📨 Sending Email Sequence 3: case_study');
  try {
    const result3 = await executeEmailWorkflow('case_study', testLead);
    console.log('✅ Result:', result3);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  console.log('\n---\n');
  console.log('✅ Email test completed!');
  console.log('\n📬 Check your inbox at jcrobledolopez@gmail.com for the test emails.');
}

main().catch(console.error);
