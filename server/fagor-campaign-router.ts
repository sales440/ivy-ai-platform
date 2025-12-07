import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { fagorContacts, fagorCampaignEnrollments, fagorEmailEvents } from "../drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import sgMail from '@sendgrid/mail';
import fs from 'fs';
import path from 'path';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const FAGOR_FROM_EMAIL = 'service@fagor-automation.com';
const FAGOR_FROM_NAME = 'FAGOR Automation Corp.';

// Email templates paths
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

export const fagorCampaignRouter = router({
  // Import contacts from CSV data
  importContacts: protectedProcedure
    .input(z.object({
      contacts: z.array(z.object({
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        role: z.string().optional(),
        phone: z.string().optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const contact of input.contacts) {
        try {
          await db.insert(fagorContacts).values({
            name: contact.name,
            email: contact.email,
            company: contact.company || null,
            role: contact.role || null,
            phone: contact.phone || null,
            source: 'csv_import',
          });
          results.imported++;
        } catch (error: any) {
          if (error.code === 'ER_DUP_ENTRY') {
            results.skipped++;
          } else {
            results.errors.push(`${contact.email}: ${error.message}`);
          }
        }
      }

      return results;
    }),

  // Get all contacts
  getContacts: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const contacts = await db.select().from(fagorContacts).orderBy(desc(fagorContacts.createdAt));
      return contacts;
    }),

  // Enroll contacts in campaign
  enrollInCampaign: protectedProcedure
    .input(z.object({
      contactIds: z.array(z.number()),
      campaignName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const enrolled = [];
      const skipped = [];

      for (const contactId of input.contactIds) {
        try {
          const [enrollment] = await db.insert(fagorCampaignEnrollments).values({
            contactId,
            campaignName: input.campaignName,
            currentStep: 0,
            status: 'active',
          });
          enrolled.push(contactId);
        } catch (error: any) {
          skipped.push(contactId);
        }
      }

      return { enrolled: enrolled.length, skipped: skipped.length };
    }),

  // Send email to enrolled contacts
  sendCampaignEmail: protectedProcedure
    .input(z.object({
      enrollmentIds: z.array(z.number()),
      emailNumber: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      if (!SENDGRID_API_KEY) {
        throw new Error('SendGrid API key not configured');
      }

      // Read email template
      const templatePath = EMAIL_TEMPLATES[input.emailNumber];
      const emailHtml = fs.readFileSync(templatePath, 'utf-8');
      const subject = EMAIL_SUBJECTS[input.emailNumber];

      const results = {
        sent: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const enrollmentId of input.enrollmentIds) {
        try {
          // Get enrollment and contact info
          const [enrollment] = await db
            .select({
              enrollment: fagorCampaignEnrollments,
              contact: fagorContacts,
            })
            .from(fagorCampaignEnrollments)
            .innerJoin(fagorContacts, eq(fagorCampaignEnrollments.contactId, fagorContacts.id))
            .where(eq(fagorCampaignEnrollments.id, enrollmentId))
            .limit(1);

          if (!enrollment) {
            results.errors.push(`Enrollment ${enrollmentId} not found`);
            results.failed++;
            continue;
          }

          // Send email via SendGrid
          const msg = {
            to: enrollment.contact.email,
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
              enrollmentId: enrollmentId.toString(),
              emailNumber: input.emailNumber.toString(),
              contactId: enrollment.contact.id.toString(),
            },
          };

          const [response] = await sgMail.send(msg);
          const messageId = response.headers['x-message-id'] as string;

          // Update enrollment
          const updateField = `email${input.emailNumber}SentAt` as 'email1SentAt' | 'email2SentAt' | 'email3SentAt';
          await db
            .update(fagorCampaignEnrollments)
            .set({
              [updateField]: new Date(),
              currentStep: input.emailNumber,
            })
            .where(eq(fagorCampaignEnrollments.id, enrollmentId));

          // Log event
          await db.insert(fagorEmailEvents).values({
            enrollmentId,
            contactId: enrollment.contact.id,
            emailNumber: input.emailNumber,
            eventType: 'sent',
            messageId,
            eventAt: new Date(),
          });

          results.sent++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Enrollment ${enrollmentId}: ${error.message}`);
        }
      }

      return results;
    }),

  // Get campaign stats
  getCampaignStats: protectedProcedure
    .input(z.object({
      campaignName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Get enrollment counts
      const enrollments = await db
        .select({
          total: sql<number>`COUNT(*)`,
          active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
          completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)`,
        })
        .from(fagorCampaignEnrollments)
        .where(eq(fagorCampaignEnrollments.campaignName, input.campaignName));

      // Get email stats
      const emailStats = await db
        .select({
          email1Sent: sql<number>`SUM(CASE WHEN email1SentAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email1Opened: sql<number>`SUM(CASE WHEN email1OpenedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email1Clicked: sql<number>`SUM(CASE WHEN email1ClickedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email2Sent: sql<number>`SUM(CASE WHEN email2SentAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email2Opened: sql<number>`SUM(CASE WHEN email2OpenedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email2Clicked: sql<number>`SUM(CASE WHEN email2ClickedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email3Sent: sql<number>`SUM(CASE WHEN email3SentAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email3Opened: sql<number>`SUM(CASE WHEN email3OpenedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          email3Clicked: sql<number>`SUM(CASE WHEN email3ClickedAt IS NOT NULL THEN 1 ELSE 0 END)`,
          responded: sql<number>`SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END)`,
        })
        .from(fagorCampaignEnrollments)
        .where(eq(fagorCampaignEnrollments.campaignName, input.campaignName));

      return {
        enrollments: enrollments[0],
        emailStats: emailStats[0],
      };
    }),

  // Get enrollments with contact details
  getEnrollments: protectedProcedure
    .input(z.object({
      campaignName: z.string(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const enrollments = await db
        .select({
          enrollment: fagorCampaignEnrollments,
          contact: fagorContacts,
        })
        .from(fagorCampaignEnrollments)
        .innerJoin(fagorContacts, eq(fagorCampaignEnrollments.contactId, fagorContacts.id))
        .where(eq(fagorCampaignEnrollments.campaignName, input.campaignName))
        .orderBy(desc(fagorCampaignEnrollments.enrolledAt));

      return enrollments;
    }),
});
