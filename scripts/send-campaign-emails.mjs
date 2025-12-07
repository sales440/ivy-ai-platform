#!/usr/bin/env node
import mysql from 'mysql2/promise';
import sgMail from '@sendgrid/mail';

const DATABASE_URL = process.env.DATABASE_URL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// Initialize SendGrid
sgMail.setApiKey(SENDGRID_API_KEY);

const EMAIL_TEMPLATES = {
  email1: {
    subject: '🎓 FAGOR CNC Training 2026 - Exclusive Invitation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">FAGOR CNC Training 2026</h2>
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
        <p>Best regards,<br>FAGOR Training Team</p>
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
  },
  email3: {
    subject: '⏰ Last Chance: FAGOR Training Registration Closes Soon!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Final Reminder - Registration Closing!</h2>
        <p>Dear {{contact_name}},</p>
        <p>This is your last chance to register for the FAGOR CNC Training 2026!</p>
        
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <strong>⚠️ Registration closes December 15, 2025</strong>
        </div>
        
        <h3>Why You Should Attend:</h3>
        <ul>
          <li>✅ Maximize your {{machine_model}} performance</li>
          <li>✅ Reduce downtime and maintenance costs</li>
          <li>✅ Get certified by FAGOR experts</li>
          <li>✅ Network with industry professionals</li>
        </ul>
        
        <p><strong>Special Offer:</strong> Register by December 10th and get 15% off!</p>
        
        <div style="margin: 30px 0;">
          <a href="https://fagor-training.com/register?promo=LAST15" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 18px;">
            Register Now - Save 15%
          </a>
        </div>
        
        <p>Don't miss this opportunity to enhance your team's skills!</p>
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

async function sendEmail(emailNumber, enrollmentId) {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get enrollment and contact details
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
      WHERE e.id = ? AND e.status = 'active'
    `, [enrollmentId]);

    if (enrollments.length === 0) {
      console.log(`⏭️  Enrollment ${enrollmentId} not found or inactive`);
      return { success: false, reason: 'not_found' };
    }

    const enrollment = enrollments[0];
    const customFields = JSON.parse(enrollment.customFields || '{}');
    
    // Check if email already sent
    const stepField = `email${emailNumber}SentAt`;
    if (enrollment[stepField]) {
      console.log(`⏭️  Email ${emailNumber} already sent to ${enrollment.company}`);
      return { success: false, reason: 'already_sent' };
    }

    // Get template
    const template = EMAIL_TEMPLATES[`email${emailNumber}`];
    if (!template) {
      throw new Error(`Template for email ${emailNumber} not found`);
    }

    // Replace template variables
    const htmlContent = replaceTemplateVars(template.html, enrollment, customFields);

    // Send email via SendGrid
    const msg = {
      to: enrollment.email,
      from: 'training@fagor-automation.com',
      subject: template.subject,
      html: htmlContent,
    };

    await sgMail.send(msg);

    // Update enrollment
    await connection.execute(`
      UPDATE fagorCampaignEnrollments 
      SET currentStep = ?, ${stepField} = NOW()
      WHERE id = ?
    `, [emailNumber, enrollmentId]);

    // Log event
    await connection.execute(`
      INSERT INTO fagorEmailEvents (enrollmentId, contactId, emailNumber, eventType, createdAt)
      VALUES (?, ?, ?, 'sent', NOW())
    `, [enrollmentId, enrollment.contactId, emailNumber]);

    console.log(`✅ Email ${emailNumber} sent to ${enrollment.company} (${enrollment.email})`);
    return { success: true };

  } catch (error) {
    console.error(`❌ Error sending email ${emailNumber} to enrollment ${enrollmentId}:`, error.message);
    return { success: false, error: error.message };
  } finally {
    await connection.end();
  }
}

async function sendBulkEmails(emailNumber) {
  console.log(`\n📧 Sending Email ${emailNumber} to all enrolled contacts`);
  console.log('=' .repeat(80));

  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Get all active enrollments that haven't received this email yet
    const [enrollments] = await connection.execute(`
      SELECT id, contactId
      FROM fagorCampaignEnrollments
      WHERE campaignName = 'CNC Training 2026'
        AND status = 'active'
        AND currentStep < ?
        AND email${emailNumber}SentAt IS NULL
    `, [emailNumber]);

    console.log(`📊 Found ${enrollments.length} contacts to receive Email ${emailNumber}`);

    let sent = 0;
    let failed = 0;

    for (const enrollment of enrollments) {
      const result = await sendEmail(emailNumber, enrollment.id);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }

      // Rate limiting - wait 100ms between emails
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 SENDING SUMMARY');
    console.log('=' .repeat(80));
    console.log(`✅ Sent: ${sent} emails`);
    console.log(`❌ Failed: ${failed} emails`);

  } finally {
    await connection.end();
  }
}

// Main execution
const emailNumber = parseInt(process.argv[2]);

if (!emailNumber || emailNumber < 1 || emailNumber > 3) {
  console.error('Usage: node send-campaign-emails.mjs <email_number>');
  console.error('Example: node send-campaign-emails.mjs 1');
  process.exit(1);
}

sendBulkEmails(emailNumber).catch(console.error);
