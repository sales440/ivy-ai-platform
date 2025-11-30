#!/usr/bin/env node
import mysql from 'mysql2/promise';
import sgMail from '@sendgrid/mail';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

// Load SendGrid API key from config file
let SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (!SENDGRID_API_KEY) {
  try {
    const envContent = readFileSync(join(__dirname, '.env.sendgrid'), 'utf8');
    const match = envContent.match(/SENDGRID_API_KEY=(.+)/);
    if (match) {
      SENDGRID_API_KEY = match[1].trim();
    }
  } catch (error) {
    console.error('❌ Could not load SendGrid API key from config file');
  }
}

if (!SENDGRID_API_KEY) {
  console.error('❌ SENDGRID_API_KEY not found in environment or config file!');
  process.exit(1);
}

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);
console.log(`✅ SendGrid initialized with API key (${SENDGRID_API_KEY.length} chars)\n`);

const EMAIL_TEMPLATES = {
  email1: {
    subject: '🎓 FAGOR CNC Training 2026 - Exclusive Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header with FAGOR Logo -->
        <div style="text-align: center; padding: 30px 20px; background-color: #f8f9fa; border-bottom: 3px solid #dc2626;">
          <img src="https://www.fagorautomation.com/wp-content/uploads/2021/03/logo-fagor-automation.png" alt="FAGOR Automation" style="max-width: 250px; height: auto;" />
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
        <h2 style="color: #dc2626; margin-top: 0;">CNC Training 2026 - Exclusive Invitation</h2>
        <p>Dear {{contact_name}},</p>
        <p>We're excited to invite <strong>{{company_name}}</strong> to our exclusive CNC Training Program for 2026!</p>
        
        <h3>What You'll Learn:</h3>
        <ul>
          <li>Advanced CNC Programming Techniques</li>
          <li>FAGOR Control System Optimization</li>
          <li>Maintenance Best Practices</li>
          <li>Troubleshooting & Problem Solving</li>
        </ul>
        
        <p><strong>Your Machine:</strong> {{machine_model}} ({{control_type}})</p>
        <p><strong>Location:</strong> {{city}}, {{state}}</p>
        
        <div style="margin: 30px 0;">
          <a href="https://fagor-training.com/register" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Register Now
          </a>
        </div>
        
        <p>Limited spots available. Register early to secure your place!</p>
        <p>Best regards,<br><strong>FAGOR Training Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">FAGOR Automation | CNC & Feedback Systems</p>
          <p style="margin: 5px 0;">📞 1-800-FAGOR-CNC | 📧 service@fagor-automation.com</p>
          <p style="margin: 5px 0;"><a href="https://www.fagorautomation.com" style="color: #dc2626; text-decoration: none;">www.fagorautomation.com</a></p>
        </div>
      </div>
    `
  },
  email2: {
    subject: '📚 FAGOR Training Materials & Schedule',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Training Materials Ready!</h2>
        <p>Hi {{contact_name}},</p>
        <p>Thank you for your interest in our CNC Training Program!</p>
        
        <h3>Training Schedule:</h3>
        <ul>
          <li><strong>Session 1:</strong> January 15-17, 2026</li>
          <li><strong>Session 2:</strong> February 12-14, 2026</li>
          <li><strong>Session 3:</strong> March 18-20, 2026</li>
        </ul>
        
        <h3>Pre-Training Materials:</h3>
        <p>Download your preparation materials:</p>
        <ul>
          <li>CNC Programming Basics Guide</li>
          <li>FAGOR Control System Overview</li>
          <li>Safety Procedures Manual</li>
        </ul>
        
        <div style="margin: 30px 0;">
          <a href="https://fagor-training.com/materials" style="background-color: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Download Materials
          </a>
        </div>
        
        <p>Questions? Reply to this email or call us at 1-800-FAGOR-CNC</p>
        <p>Best regards,<br>FAGOR Training Team</p>
      </div>
    `
  }
};

function replaceTemplateVars(html, contact, customFields) {
  return html
    .replace(/{{contact_name}}/g, contact.name || 'Valued Customer')
    .replace(/{{company_name}}/g, contact.company || 'Your Company')
    .replace(/{{machine_model}}/g, customFields.machine_model || 'FAGOR CNC')
    .replace(/{{control_type}}/g, customFields.control_type || 'Standard')
    .replace(/{{city}}/g, customFields.city || '')
    .replace(/{{state}}/g, customFields.state || '');
}

async function sendBatchEmails(emailNumber, batchSize = 99) {
  console.log(`\n📧 Sending Email ${emailNumber} - Batch of ${batchSize}`);
  console.log('=' .repeat(80));

  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get contacts that haven't received this email yet
    const stepField = `email${emailNumber}SentAt`;
    const [enrollments] = await connection.execute(`
      SELECT 
        e.id as enrollmentId,
        e.contactId,
        e.currentStep,
        c.name,
        c.email,
        c.company,
        c.customFields
      FROM fagorCampaignEnrollments e
      JOIN fagorContacts c ON e.contactId = c.id
      WHERE e.campaignName = 'CNC Training 2026'
        AND e.status = 'active'
        AND e.${stepField} IS NULL
      LIMIT ${batchSize}
    `);

    if (enrollments.length === 0) {
      console.log('✅ No pending emails to send. All contacts have received this email.');
      return { sent: 0, failed: 0, total: 0 };
    }

    console.log(`📊 Found ${enrollments.length} contacts to receive Email ${emailNumber}`);
    console.log('');

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Get template
    const template = EMAIL_TEMPLATES[`email${emailNumber}`];

    for (const enrollment of enrollments) {
      try {
        // Handle customFields - it might already be an object or a string
        let customFields = {};
        if (typeof enrollment.customFields === 'string') {
          customFields = JSON.parse(enrollment.customFields);
        } else if (typeof enrollment.customFields === 'object' && enrollment.customFields !== null) {
          customFields = enrollment.customFields;
        }
        
        // Replace template variables
        const htmlContent = replaceTemplateVars(template.html, enrollment, customFields);

        // Send email via SendGrid
        const msg = {
          to: enrollment.email,
          from: 'service@fagor-automation.com',
          subject: template.subject,
          html: htmlContent,
        };

        await sgMail.send(msg);

        // Update enrollment
        await connection.execute(`
          UPDATE fagorCampaignEnrollments 
          SET currentStep = ?, ${stepField} = NOW()
          WHERE id = ?
        `, [emailNumber, enrollment.enrollmentId]);

        // Log event
        await connection.execute(`
          INSERT INTO fagorEmailEvents (enrollmentId, contactId, emailNumber, eventType, createdAt)
          VALUES (?, ?, ?, 'sent', NOW())
        `, [enrollment.enrollmentId, enrollment.contactId, emailNumber]);

        sent++;
        console.log(`✅ [${sent}/${enrollments.length}] ${enrollment.company} (${enrollment.email})`);

        // Rate limiting - wait 150ms between emails (slower to be safe)
        await new Promise(resolve => setTimeout(resolve, 150));

      } catch (error) {
        failed++;
        errors.push({ company: enrollment.company, email: enrollment.email, error: error.message });
        console.error(`❌ [${sent + failed}/${enrollments.length}] ${enrollment.company}: ${error.message}`);
      }
    }

    console.log('\n📊 BATCH SENDING SUMMARY');
    console.log('=' .repeat(80));
    console.log(`✅ Successfully sent: ${sent} emails`);
    console.log(`❌ Failed: ${failed} emails`);
    console.log(`📊 Total processed: ${sent + failed} emails`);

    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.slice(0, 5).forEach(err => {
        console.log(`   - ${err.company} (${err.email}): ${err.error}`);
      });
      if (errors.length > 5) {
        console.log(`   ... and ${errors.length - 5} more errors`);
      }
    }

    // Check remaining contacts
    const [remaining] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM fagorCampaignEnrollments e
      WHERE e.campaignName = 'CNC Training 2026'
        AND e.status = 'active'
        AND e.${stepField} IS NULL
    `);

    const remainingCount = remaining[0].count;
    console.log(`\n📬 Remaining contacts for Email ${emailNumber}: ${remainingCount}`);

    if (remainingCount > 0) {
      console.log(`\n⏭️  To send the next batch, run:`);
      console.log(`   node scripts/send-campaign-batch.mjs ${emailNumber} ${batchSize}`);
    } else {
      console.log(`\n✅ All contacts have received Email ${emailNumber}!`);
      
      if (emailNumber === 1) {
        console.log(`\n📧 Next: Send Email 2`);
        console.log(`   node scripts/send-campaign-batch.mjs 2 ${batchSize}`);
      }
    }

    return { sent, failed, total: enrollments.length, remaining: remainingCount };

  } finally {
    await connection.end();
  }
}

// Main execution
const emailNumber = parseInt(process.argv[2]);
const batchSize = parseInt(process.argv[3]) || 99;

if (!emailNumber || emailNumber < 1 || emailNumber > 3) {
  console.error('Usage: node send-campaign-batch.mjs <email_number> [batch_size]');
  console.error('Example: node send-campaign-batch.mjs 1 99');
  process.exit(1);
}

if (batchSize > 100) {
  console.error('⚠️  Warning: Batch size exceeds SendGrid free tier limit (100/day)');
  console.error('   Recommended: 99 or less');
}

sendBatchEmails(emailNumber, batchSize).catch(console.error);
