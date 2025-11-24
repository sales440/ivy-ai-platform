/**
 * FAGOR Drip Campaign Scheduler
 * 
 * Automatically sends follow-up emails based on:
 * - Day 0: Email 1 (immediate upon enrollment)
 * - Day 3: Email 2 (if Email 1 was sent)
 * - Day 7: Email 3 (if Email 2 was sent)
 * 
 * Runs every hour to check for pending emails
 */

import { getDb } from "./db";
import { fagorCampaignEnrollments, fagorContacts, fagorEmailEvents } from "../drizzle/schema";
import { eq, and, isNull, lt, sql } from "drizzle-orm";
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FAGOR_FROM_EMAIL = 'service@fagor-automation.com';
const FAGOR_FROM_NAME = 'FAGOR Automation Corp.';

const EMAIL_TEMPLATES = {
  1: path.join(process.cwd(), 'campaigns/fagor-training-email-1-the-problem.html'),
  2: path.join(process.cwd(), 'campaigns/fagor-training-email-2-the-solution.html'),
  3: path.join(process.cwd(), 'campaigns/fagor-training-email-3-urgency-cta.html'),
};

const EMAIL_SUBJECTS = {
  1: 'The Hidden Cost of Untrained CNC Operators',
  2: 'How to Turn CNC Features Into Competitive Advantages',
  3: 'Your 2026 Training Opportunity: Secure Your Spot',
};

interface PendingEmail {
  enrollmentId: number;
  contactId: number;
  contactEmail: string;
  contactName: string;
  emailNumber: 1 | 2 | 3;
}

async function findPendingEmails(): Promise<PendingEmail[]> {
  const db = await getDb();
  if (!db) {
    console.error('[FAGOR Drip] Database not available');
    return [];
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const pending: PendingEmail[] = [];

  try {
    // Find enrollments needing Email 1 (just enrolled, no email sent yet)
    const needEmail1 = await db
      .select({
        enrollmentId: fagorCampaignEnrollments.id,
        contactId: fagorContacts.id,
        contactEmail: fagorContacts.email,
        contactName: fagorContacts.name,
      })
      .from(fagorCampaignEnrollments)
      .innerJoin(fagorContacts, eq(fagorCampaignEnrollments.contactId, fagorContacts.id))
      .where(
        and(
          eq(fagorCampaignEnrollments.status, 'active'),
          isNull(fagorCampaignEnrollments.email1SentAt)
        )
      );

    pending.push(...needEmail1.map(e => ({ ...e, emailNumber: 1 as const })));

    // Find enrollments needing Email 2 (Email 1 sent 3+ days ago, Email 2 not sent)
    const needEmail2 = await db
      .select({
        enrollmentId: fagorCampaignEnrollments.id,
        contactId: fagorContacts.id,
        contactEmail: fagorContacts.email,
        contactName: fagorContacts.name,
      })
      .from(fagorCampaignEnrollments)
      .innerJoin(fagorContacts, eq(fagorCampaignEnrollments.contactId, fagorContacts.id))
      .where(
        and(
          eq(fagorCampaignEnrollments.status, 'active'),
          lt(fagorCampaignEnrollments.email1SentAt, threeDaysAgo),
          isNull(fagorCampaignEnrollments.email2SentAt)
        )
      );

    pending.push(...needEmail2.map(e => ({ ...e, emailNumber: 2 as const })));

    // Find enrollments needing Email 3 (Email 2 sent 7+ days ago, Email 3 not sent)
    const needEmail3 = await db
      .select({
        enrollmentId: fagorCampaignEnrollments.id,
        contactId: fagorContacts.id,
        contactEmail: fagorContacts.email,
        contactName: fagorContacts.name,
      })
      .from(fagorCampaignEnrollments)
      .innerJoin(fagorContacts, eq(fagorCampaignEnrollments.contactId, fagorContacts.id))
      .where(
        and(
          eq(fagorCampaignEnrollments.status, 'active'),
          lt(fagorCampaignEnrollments.email2SentAt, sevenDaysAgo),
          isNull(fagorCampaignEnrollments.email3SentAt)
        )
      );

    pending.push(...needEmail3.map(e => ({ ...e, emailNumber: 3 as const })));

    console.log(`[FAGOR Drip] Found ${pending.length} pending emails (Email 1: ${needEmail1.length}, Email 2: ${needEmail2.length}, Email 3: ${needEmail3.length})`);

    return pending;
  } catch (error) {
    console.error('[FAGOR Drip] Error finding pending emails:', error);
    return [];
  }
}

async function sendEmail(pending: PendingEmail): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  if (!SENDGRID_API_KEY) {
    console.error('[FAGOR Drip] SendGrid API key not configured');
    return false;
  }

  try {
    // Read email template
    const templatePath = EMAIL_TEMPLATES[pending.emailNumber];
    const emailHtml = fs.readFileSync(templatePath, 'utf-8');
    const subject = EMAIL_SUBJECTS[pending.emailNumber];

    // Send via SendGrid
    const msg = {
      to: pending.contactEmail,
      from: {
        email: FAGOR_FROM_EMAIL,
        name: FAGOR_FROM_NAME,
      },
      subject,
      html: emailHtml,
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true },
      },
      customArgs: {
        campaign: 'FAGOR_CNC_Training_2026',
        enrollmentId: pending.enrollmentId.toString(),
        emailNumber: pending.emailNumber.toString(),
        contactId: pending.contactId.toString(),
        automated: 'true',
      },
    };

    const [response] = await sgMail.send(msg);
    const messageId = response.headers['x-message-id'] as string;

    // Update enrollment
    const updateField = `email${pending.emailNumber}SentAt` as 'email1SentAt' | 'email2SentAt' | 'email3SentAt';
    await db
      .update(fagorCampaignEnrollments)
      .set({
        [updateField]: new Date(),
        currentStep: pending.emailNumber,
        ...(pending.emailNumber === 3 ? { status: 'completed', completedAt: new Date() } : {}),
      })
      .where(eq(fagorCampaignEnrollments.id, pending.enrollmentId));

    // Log event
    await db.insert(fagorEmailEvents).values({
      enrollmentId: pending.enrollmentId,
      contactId: pending.contactId,
      emailNumber: pending.emailNumber,
      eventType: 'sent',
      messageId,
      metadata: { automated: true },
      eventAt: new Date(),
    });

    console.log(`[FAGOR Drip] ✅ Sent Email ${pending.emailNumber} to ${pending.contactEmail} (enrollment ${pending.enrollmentId})`);
    return true;
  } catch (error: any) {
    console.error(`[FAGOR Drip] ❌ Failed to send Email ${pending.emailNumber} to ${pending.contactEmail}:`, error.message);
    return false;
  }
}

export async function processFagorDripCampaign(): Promise<{ sent: number; failed: number }> {
  console.log('[FAGOR Drip] Starting drip campaign processing...');

  const pending = await findPendingEmails();

  if (pending.length === 0) {
    console.log('[FAGOR Drip] No pending emails to send');
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  // Send emails with delay to avoid rate limiting
  for (const email of pending) {
    const success = await sendEmail(email);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    // Wait 1 second between sends to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[FAGOR Drip] Completed: ${sent} sent, ${failed} failed`);
  return { sent, failed };
}

// Run every hour
export function startFagorDripScheduler() {
  console.log('[FAGOR Drip] Scheduler started (runs every hour)');

  // Run immediately on startup
  processFagorDripCampaign().catch(error => {
    console.error('[FAGOR Drip] Error in initial run:', error);
  });

  // Then run every hour
  setInterval(() => {
    processFagorDripCampaign().catch(error => {
      console.error('[FAGOR Drip] Error in scheduled run:', error);
    });
  }, 60 * 60 * 1000); // 1 hour
}
