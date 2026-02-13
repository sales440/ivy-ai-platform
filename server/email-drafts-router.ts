import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  createEmailDraft,
  getEmailDrafts,
  getEmailDraftById,
  updateEmailDraftStatus,
  updateEmailDraftContent,
  deleteEmailDraft,
  getApprovedEmailDrafts,
  createCampaignFromApprovedDraft,
} from "./db";
import { sendApprovedEmailsViaN8n, processEmailCallback, createCampaignFromDrafts } from "./email-send-service";
import { getBrandProfile, generateBrandedEmailHtml } from "./brand-firewall";

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

  // Get all approved emails ready to send
  getApproved: publicProcedure.query(async () => {
    const drafts = await getApprovedEmailDrafts();
    return { success: true, drafts, count: drafts.length };
  }),

  // SEND APPROVED EMAILS via n8n/Outlook
  // This is the "Confirmar Envío" endpoint - requires owner explicit action
  sendApproved: protectedProcedure
    .input(z.object({
      draftIds: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      console.log(`[Email Send] Owner confirmed sending ${input.draftIds.length} emails via n8n/Outlook`);
      
      const result = await sendApprovedEmailsViaN8n(input.draftIds);
      
      // If emails were sent successfully, create a campaign in the DB
      if (result.sentCount > 0) {
        const sentDrafts = await getApprovedEmailDrafts();
        // Get the drafts that were just sent
        const justSent = sentDrafts.filter(d => input.draftIds.includes(d.draftId));
        if (justSent.length > 0) {
          const campaignId = await createCampaignFromDrafts(justSent);
          console.log(`[Email Send] Campaign created: ${campaignId}`);
          return { ...result, campaignId };
        }
      }
      
      return result;
    }),

  // Cancel pending send (revert to approved status)
  cancelSend: protectedProcedure
    .input(z.object({ draftIds: z.array(z.string()) }))
    .mutation(async ({ input }) => {
      console.log(`[Email Send] Owner cancelled sending ${input.draftIds.length} emails`);
      let count = 0;
      for (const draftId of input.draftIds) {
        const success = await updateEmailDraftStatus(draftId, 'approved');
        if (success) count++;
      }
      return { success: true, cancelledCount: count };
    }),

  // Get brand profile for a company (used by frontend to render dynamic previews)
  getBrandProfile: publicProcedure
    .input(z.object({ companyName: z.string() }))
    .query(async ({ input }) => {
      const profile = await getBrandProfile(input.companyName);
      return {
        companyName: profile.companyName,
        sector: profile.sector,
        logoUrl: profile.logoUrl,
        primaryColor: profile.primaryColor,
        secondaryColor: profile.secondaryColor,
        accentColor: profile.accentColor,
        backgroundColor: profile.backgroundColor,
        headerBackground: profile.headerBackground,
        textColor: profile.textColor,
        fontFamily: profile.fontFamily,
        headerFontSize: profile.headerFontSize,
        bodyFontSize: profile.bodyFontSize,
        borderRadius: profile.borderRadius,
        headerStyle: profile.headerStyle,
        layoutStyle: profile.layoutStyle,
        toneVisual: profile.toneVisual,
        address: profile.address,
        phone: profile.phone,
        email: profile.email,
        website: profile.website,
        socialLinks: profile.socialLinks,
        legalNotice: profile.legalNotice,
        unsubscribeText: profile.unsubscribeText,
        ctaText: profile.ctaText,
        ctaStyle: profile.ctaStyle,
        footerBackground: profile.footerBackground,
        footerTextColor: profile.footerTextColor,
        dividerStyle: profile.dividerStyle,
      };
    }),

  // Regenerate HTML content for a draft using Brand Firewall
  regenerateHtml: publicProcedure
    .input(z.object({
      companyName: z.string(),
      subject: z.string(),
      body: z.string(),
      recipientName: z.string().optional(),
      ctaText: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateBrandedEmailHtml({
        companyName: input.companyName,
        subject: input.subject,
        body: input.body,
        recipientName: input.recipientName,
        ctaText: input.ctaText,
      });
      return { html: result.html, coherenceCheck: result.coherenceCheck };
    }),

  // Approve draft AND create campaign in DB
  approveAndCreateCampaign: protectedProcedure
    .input(z.object({
      draftId: z.string(),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // 1. Approve the draft
      const approved = await updateEmailDraftStatus(
        input.draftId,
        'approved',
        ctx.user?.openId
      );
      
      if (!approved) return { success: false, error: 'Failed to approve draft' };
      
      // 2. Get the draft details
      const draft = await getEmailDraftById(input.draftId);
      if (!draft) return { success: false, error: 'Draft not found' };
      
      // 3. Create campaign in DB as "active" (En Progreso)
      const campaignId = await createCampaignFromApprovedDraft({
        name: `${draft.campaign || 'Email Campaign'} - ${draft.company}`,
        company: draft.company,
        type: 'email',
        draftCount: 1,
      });
      
      return { success: true, campaignId, draftId: input.draftId };
    }),
});

export type EmailDraftsRouter = typeof emailDraftsRouter;
