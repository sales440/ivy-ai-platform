import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { sendEmail, getEmailTemplate } from "./_core/email";
import { getDb } from "./db";
import { emailLogs, leads } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const emailsRouter = router({
  /**
   * Send follow-up email based on call outcome
   */
  sendFollowUp: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      callId: z.number(),
      outcome: z.enum(["callback", "interested", "notInterested", "voicemail"]),
      customSubject: z.string().optional(),
      customBody: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get lead details
      const leadResult = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      const lead = leadResult[0];
      
      if (!lead) {
        throw new Error("Lead not found");
      }

      if (!lead.email) {
        throw new Error("Lead has no email address");
      }

      // Get email template or use custom
      let subject: string;
      let body: string;

      if (input.customSubject && input.customBody) {
        subject = input.customSubject;
        body = input.customBody;
      } else {
        const template = getEmailTemplate(input.outcome, lead.name, lead.company);
        if (!template) {
          throw new Error(`No template found for outcome: ${input.outcome}`);
        }
        subject = template.subject;
        body = template.body;
      }

      // Send email
      const success = await sendEmail({
        to: lead.email,
        subject,
        body,
        leadName: lead.name,
        companyName: lead.company,
      });

      // Log email
      await db.insert(emailLogs).values({
        leadId: input.leadId as number | null,
        campaignId: null,
        companyId: lead.companyId,
        userId: ctx.user.id,
        to: lead.email,
        subject,
        body,
        status: success ? "sent" : "failed",
        error: success ? null : "Failed to send email",
        metadata: { callId: input.callId, outcome: input.outcome },
      });

      return { success, subject, body };
    }),

  /**
   * List email logs for a lead
   */
  listByLead: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { emails: [] };

      const emails = await db.select().from(emailLogs).where(eq(emailLogs.leadId, input.leadId));
      
      return { emails };
    }),

  /**
   * List all email logs for company
   */
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { emails: [] };

      const emails = await db.select().from(emailLogs).where(eq(emailLogs.companyId, input.companyId));
      
      return { emails };
    }),
});
