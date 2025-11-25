/**
 * Integration layer between Ivy.AI agents and FAGOR campaigns
 * Maps agent actions to campaign execution
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { sendEmail } from "./services/sendgrid";
import { getDb } from "./db";
import { fagorContacts, fagorCampaignEnrollments, fagorEmailEvents } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { readFileSync } from "fs";
import { join } from "path";

// Agent-Campaign mapping
export const AGENT_CAMPAIGNS = {
  "ivy-prospect": {
    name: "CNC Training 2026",
    folder: "training",
    emails: [
      { file: "fagor-training-email-1-the-problem.html", subject: "The Hidden Cost of Untrained CNC Operators" },
      { file: "fagor-training-email-2-the-solution.html", subject: "How to Turn CNC Features Into Competitive Advantages" },
      { file: "fagor-training-email-3-urgency-cta.html", subject: "Your 2026 Training Opportunity: Secure Your Spot" }
    ]
  },
  "ivy-closer": {
    name: "Warranty Extension",
    folder: "warranty",
    emails: [
      { file: "email-1-expiration-warning.html", subject: "Your FAGOR Warranty is Expiring - Don't Risk Unprotected Equipment" },
      { file: "email-2-cost-comparison.html", subject: "Warranty Extension vs. Out-of-Warranty Repair: The Real Cost" },
      { file: "email-3-limited-time.html", subject: "Final Reminder: Extend Your Warranty Before It's Too Late" }
    ]
  },
  "ivy-solve": {
    name: "Equipment Repair",
    folder: "repair",
    emails: [
      { file: "email-1-fast-expert-repair.html", subject: "Fast, Expert Repair for Your FAGOR Equipment" },
      { file: "email-2-genuine-parts.html", subject: "Why Genuine FAGOR Parts Matter" },
      { file: "email-3-preventive-diagnostic.html", subject: "Prevent Failures Before They Happen" }
    ]
  },
  "ivy-logic": {
    name: "EOL Parts & Preventive Maintenance",
    folder: "eol-parts",
    emails: [
      { file: "email-1-last-chance.html", subject: "Critical Parts Being Discontinued - Secure Yours Now" },
      { file: "email-2-inventory-strategy.html", subject: "Smart Spare Parts Strategy for Aging Equipment" },
      { file: "email-3-bulk-pricing.html", subject: "Special Bulk Pricing on EOL Parts - Limited Time" }
    ]
  },
  "ivy-talent": {
    name: "CNC Upgrades",
    folder: "cnc-upgrades",
    emails: [
      { file: "email-1-windows-security.html", subject: "Your CNC is Running on Unsupported Windows - Security Risk Alert" },
      { file: "email-2-performance-benefits.html", subject: "Upgrade Your CNC: Better Performance, Lower Cost Than Replacement" },
      { file: "email-3-upgrade-process.html", subject: "How the CNC Upgrade Process Works" }
    ]
  },
  "ivy-insight": {
    name: "Digital Suite & Modernization",
    folder: "digital-suite",
    emails: [
      { file: "email-1-data-visibility.html", subject: "Are You Flying Blind? Get Real-Time Production Visibility" },
      { file: "email-2-predictive-maintenance.html", subject: "Predict Failures Before They Happen" },
      { file: "email-3-competitive-advantage.html", subject: "Digital Transformation: Your Competitive Advantage" }
    ]
  }
} as const;

export type AgentId = keyof typeof AGENT_CAMPAIGNS;

export const agentCampaignRouter = router({
  // Get campaign info for an agent
  getCampaignInfo: protectedProcedure
    .input(z.object({
      agentId: z.enum(["ivy-prospect", "ivy-closer", "ivy-solve", "ivy-logic", "ivy-talent", "ivy-insight"])
    }))
    .query(({ input }) => {
      const campaign = AGENT_CAMPAIGNS[input.agentId];
      return {
        agentId: input.agentId,
        campaignName: campaign.name,
        emailCount: campaign.emails.length,
        emails: campaign.emails.map((e, idx) => ({
          sequence: idx + 1,
          subject: e.subject
        }))
      };
    }),

  // Send campaign email for an agent
  sendCampaignEmail: protectedProcedure
    .input(z.object({
      agentId: z.enum(["ivy-prospect", "ivy-closer", "ivy-solve", "ivy-logic", "ivy-talent", "ivy-insight"]),
      emailSequence: z.number().min(1).max(3),
      recipientEmail: z.string().email(),
      recipientName: z.string().optional(),
      bccEmail: z.string().email().optional()
    }))
    .mutation(async ({ input }) => {
      const campaign = AGENT_CAMPAIGNS[input.agentId];
      const emailConfig = campaign.emails[input.emailSequence - 1];
      
      if (!emailConfig) {
        throw new Error(`Email sequence ${input.emailSequence} not found for agent ${input.agentId}`);
      }

      // Load email template
      const templatePath = join(process.cwd(), 'campaigns', campaign.folder, emailConfig.file);
      const htmlContent = readFileSync(templatePath, 'utf-8');

      // Send email
      const result = await sendEmail({
        to: input.recipientEmail,
        from: 'service@fagor-automation.com',
        subject: emailConfig.subject,
        html: htmlContent,
        bcc: input.bccEmail
      });

      // Log event
      const db = await getDb();
      if (db) {
        await db.insert(fagorEmailEvents).values({
          contactEmail: input.recipientEmail,
          eventType: 'sent',
          campaignName: campaign.name,
          emailSequence: input.emailSequence,
          messageId: result.messageId || null,
          metadata: JSON.stringify({ agentId: input.agentId })
        });
      }

      return {
        success: true,
        messageId: result.messageId,
        campaign: campaign.name,
        emailSequence: input.emailSequence
      };
    }),

  // Enroll contact in agent's campaign
  enrollInCampaign: protectedProcedure
    .input(z.object({
      agentId: z.enum(["ivy-prospect", "ivy-closer", "ivy-solve", "ivy-logic", "ivy-talent", "ivy-insight"]),
      contactEmail: z.string().email(),
      contactName: z.string(),
      company: z.string().optional(),
      sendImmediately: z.boolean().default(true)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const campaign = AGENT_CAMPAIGNS[input.agentId];

      // Create or update contact
      await db.insert(fagorContacts).values({
        email: input.contactEmail,
        name: input.contactName,
        company: input.company || null,
        status: 'active'
      }).onDuplicateKeyUpdate({
        set: {
          name: input.contactName,
          company: input.company || null
        }
      });

      // Enroll in campaign
      await db.insert(fagorCampaignEnrollments).values({
        contactEmail: input.contactEmail,
        campaignName: campaign.name,
        status: 'active',
        currentStep: 0
      });

      // Send first email immediately if requested
      if (input.sendImmediately) {
        const templatePath = join(process.cwd(), 'campaigns', campaign.folder, campaign.emails[0].file);
        const htmlContent = readFileSync(templatePath, 'utf-8');

        await sendEmail({
          to: input.contactEmail,
          from: 'service@fagor-automation.com',
          subject: campaign.emails[0].subject,
          html: htmlContent
        });

        // Update enrollment
        await db.update(fagorCampaignEnrollments)
          .set({
            currentStep: 1,
            lastEmailSent: new Date()
          })
          .where(
            and(
              eq(fagorCampaignEnrollments.contactEmail, input.contactEmail),
              eq(fagorCampaignEnrollments.campaignName, campaign.name)
            )
          );
      }

      return {
        success: true,
        campaign: campaign.name,
        emailSent: input.sendImmediately
      };
    }),

  // Get campaign statistics for an agent
  getCampaignStats: protectedProcedure
    .input(z.object({
      agentId: z.enum(["ivy-prospect", "ivy-closer", "ivy-solve", "ivy-logic", "ivy-talent", "ivy-insight"])
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const campaign = AGENT_CAMPAIGNS[input.agentId];

      // Get enrollment stats
      const enrollments = await db.select()
        .from(fagorCampaignEnrollments)
        .where(eq(fagorCampaignEnrollments.campaignName, campaign.name));

      // Get email events
      const events = await db.select()
        .from(fagorEmailEvents)
        .where(eq(fagorEmailEvents.campaignName, campaign.name));

      const totalEnrolled = enrollments.length;
      const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
      const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;

      const totalSent = events.filter(e => e.eventType === 'sent').length;
      const totalOpens = events.filter(e => e.eventType === 'open').length;
      const totalClicks = events.filter(e => e.eventType === 'click').length;

      return {
        agentId: input.agentId,
        campaignName: campaign.name,
        enrollments: {
          total: totalEnrolled,
          active: activeEnrollments,
          completed: completedEnrollments
        },
        emails: {
          sent: totalSent,
          opens: totalOpens,
          clicks: totalClicks,
          openRate: totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) + '%' : '0%',
          clickRate: totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) + '%' : '0%'
        }
      };
    })
});
