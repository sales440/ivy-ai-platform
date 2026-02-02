import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  createEmailDraft,
  getEmailDrafts,
  getEmailDraftById,
  updateEmailDraftStatus,
  updateEmailDraftContent,
  deleteEmailDraft,
} from "./db";

/**
 * Email Drafts Router
 * Handles CRUD operations for email drafts in Monitor section
 */
export const emailDraftsRouter = router({
  // Get all email drafts
  getAll: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const drafts = await getEmailDrafts(input?.limit || 100);
      return { success: true, drafts };
    }),

  // Get single email draft by ID
  getById: publicProcedure
    .input(z.object({ draftId: z.string() }))
    .query(async ({ input }) => {
      const draft = await getEmailDraftById(input.draftId);
      return { success: true, draft };
    }),

  // Create new email draft
  create: publicProcedure
    .input(z.object({
      draftId: z.string(),
      company: z.string(),
      campaign: z.string().optional(),
      subject: z.string(),
      body: z.string(),
      htmlContent: z.string().optional(),
      recipientEmail: z.string().optional(),
      recipientName: z.string().optional(),
      createdBy: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const draft = await createEmailDraft({
        draftId: input.draftId,
        company: input.company,
        campaign: input.campaign || null,
        subject: input.subject,
        body: input.body,
        htmlContent: input.htmlContent || null,
        recipientEmail: input.recipientEmail || null,
        recipientName: input.recipientName || null,
        createdBy: input.createdBy || 'ROPA',
        status: 'pending',
      });
      return { success: !!draft, draft };
    }),

  // Update email draft status (approve/reject)
  updateStatus: protectedProcedure
    .input(z.object({
      draftId: z.string(),
      status: z.enum(['pending', 'approved', 'rejected', 'sent']),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const success = await updateEmailDraftStatus(
        input.draftId,
        input.status,
        ctx.user?.openId,
        input.rejectionReason
      );
      return { success };
    }),

  // Update email draft content (subject and body)
  updateContent: protectedProcedure
    .input(z.object({
      draftId: z.string(),
      subject: z.string(),
      body: z.string(),
    }))
    .mutation(async ({ input }) => {
      const success = await updateEmailDraftContent(
        input.draftId,
        input.subject,
        input.body
      );
      return { success };
    }),

  // Delete email draft
  delete: protectedProcedure
    .input(z.object({ draftId: z.string() }))
    .mutation(async ({ input }) => {
      const success = await deleteEmailDraft(input.draftId);
      return { success };
    }),
});

export type EmailDraftsRouter = typeof emailDraftsRouter;
