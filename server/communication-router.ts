/**
 * Communication Router - tRPC endpoints for Ivy-Call
 * Handles Voice, SMS, and WhatsApp communications
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { IvyCall } from "./agents/call";

// Lazy load Telnyx services to avoid initialization errors when credentials are not configured
const getTelnyxVoice = () => import("./services/telnyx-voice");
const getTelnyxSMS = () => import("./services/telnyx-sms");
const getTelnyxWhatsApp = () => import("./services/telnyx-whatsapp");

// Initialize Ivy-Call agent
let ivyCallAgent: IvyCall | null = null;

async function getIvyCallAgent(): Promise<IvyCall> {
  if (!ivyCallAgent) {
    ivyCallAgent = new IvyCall();
    await ivyCallAgent.initialize();
  }
  return ivyCallAgent;
}

export const communicationRouter = router({
  // ============================================================================
  // VOICE CALLS
  // ============================================================================

  /**
   * Make an outbound call
   */
  makeCall: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      phoneNumber: z.string(),
      script: z.string().optional(),
      campaignId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const agent = await getIvyCallAgent();
      
      const result = await agent.executeTask({
        type: 'make_call',
        leadId: input.leadId,
        phoneNumber: input.phoneNumber,
        script: input.script,
        campaignId: input.campaignId
      });

      return result;
    }),

  /**
   * Get call history
   */
  getCallHistory: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return db.getCallsByCompanyId(input.companyId, input.limit);
    }),

  /**
   * Get call by ID
   */
  getCall: protectedProcedure
    .input(z.object({
      callId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getCallById(input.callId);
    }),

  /**
   * Get call transcripts
   */
  getCallTranscripts: protectedProcedure
    .input(z.object({
      callId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getTranscriptsByCallId(input.callId);
    }),

  /**
   * Get calls for a specific lead
   */
  getCallsByLead: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getCallsByLeadId(input.leadId);
    }),

  // ============================================================================
  // SMS MESSAGING
  // ============================================================================

  /**
   * Send SMS message
   */
  sendSMS: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      phoneNumber: z.string(),
      message: z.string().optional(),
      campaignId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await getIvyCallAgent();
      
      const result = await agent.executeTask({
        type: 'send_sms',
        leadId: input.leadId,
        phoneNumber: input.phoneNumber,
        message: input.message,
        campaignId: input.campaignId
      });

      return result;
    }),

  /**
   * Send bulk SMS
   */
  sendBulkSMS: protectedProcedure
    .input(z.object({
      phoneNumbers: z.array(z.string()),
      message: z.string(),
      from: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return telnyxSMS.sendBulkSMS(
        input.phoneNumbers,
        input.message,
        input.from
      );
    }),

  /**
   * Get SMS history
   */
  getSMSHistory: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ input }) => {
      return db.getSMSByCompanyId(input.companyId, input.limit);
    }),

  /**
   * Get SMS messages for a specific lead
   */
  getSMSByLead: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getSMSByLeadId(input.leadId);
    }),

  // ============================================================================
  // WHATSAPP MESSAGING
  // ============================================================================

  /**
   * Send WhatsApp message
   */
  sendWhatsApp: protectedProcedure
    .input(z.object({
      leadId: z.number().optional(),
      phoneNumber: z.string(),
      message: z.string().optional(),
      campaignId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const agent = await getIvyCallAgent();
      
      const result = await agent.executeTask({
        type: 'send_whatsapp',
        leadId: input.leadId,
        phoneNumber: input.phoneNumber,
        message: input.message,
        campaignId: input.campaignId
      });

      return result;
    }),

  /**
   * Send WhatsApp template
   */
  sendWhatsAppTemplate: protectedProcedure
    .input(z.object({
      phoneNumber: z.string(),
      templateName: z.string(),
      templateParams: z.array(z.string()).optional(),
      from: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return telnyxWhatsApp.sendWhatsAppTemplate(
        input.phoneNumber,
        input.templateName,
        input.templateParams,
        input.from
      );
    }),

  /**
   * Send WhatsApp image
   */
  sendWhatsAppImage: protectedProcedure
    .input(z.object({
      phoneNumber: z.string(),
      imageUrl: z.string(),
      caption: z.string().optional(),
      from: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      return telnyxWhatsApp.sendWhatsAppImage(
        input.phoneNumber,
        input.imageUrl,
        input.caption,
        input.from
      );
    }),

  /**
   * Get WhatsApp conversation
   */
  getWhatsAppConversation: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      phoneNumber: z.string(),
    }))
    .query(async ({ input }) => {
      return db.getWhatsAppConversationByPhone(
        input.companyId,
        input.phoneNumber
      );
    }),

  /**
   * Get WhatsApp messages
   */
  getWhatsAppMessages: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
    }))
    .query(async ({ input }) => {
      return db.getWhatsAppMessagesByConversationId(input.conversationId);
    }),

  // ============================================================================
  // ANALYTICS & REPORTING
  // ============================================================================

  /**
   * Get communication analytics
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ input }) => {
      return db.getCommunicationAnalytics(
        input.companyId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Get total communication costs
   */
  getCosts: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return db.getTotalCommunicationCosts(
        input.companyId,
        input.startDate,
        input.endDate
      );
    }),

  /**
   * Get Ivy-Call agent KPIs
   */
  getIvyCallKPIs: protectedProcedure
    .query(async () => {
      const agent = await getIvyCallAgent();
      return {
        name: agent.getName(),
        type: agent.getType(),
        status: agent.getStatus(),
        kpis: agent.getKPIs(),
        capabilities: agent.getCapabilities()
      };
    }),

  /**
   * Get communication dashboard stats
   */
  getDashboardStats: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [calls, sms, costs, analytics] = await Promise.all([
        db.getCallsByCompanyId(input.companyId, 100),
        db.getSMSByCompanyId(input.companyId, 100),
        db.getTotalCommunicationCosts(input.companyId, thirtyDaysAgo, today),
        db.getCommunicationAnalytics(input.companyId, thirtyDaysAgo, today)
      ]);

      const totalCalls = calls.length;
      const successfulCalls = calls.filter(c => c.status === 'completed').length;
      const totalSMS = sms.length;
      const deliveredSMS = sms.filter(s => s.status === 'delivered').length;

      return {
        calls: {
          total: totalCalls,
          successful: successfulCalls,
          successRate: totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0
        },
        sms: {
          total: totalSMS,
          delivered: deliveredSMS,
          deliveryRate: totalSMS > 0 ? (deliveredSMS / totalSMS) * 100 : 0
        },
        costs,
        recentCalls: calls.slice(0, 10),
        recentSMS: sms.slice(0, 10),
        analytics
      };
    }),
});
