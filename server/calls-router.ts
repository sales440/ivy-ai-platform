import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as telnyx from "./_core/telnyx";
import { invokeLLM } from "./_core/llm";

export const callsRouter = router({
  /**
   * Initiate a call to a lead
   */
  initiate: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      phoneNumber: z.string(),
      script: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user) {
        throw new Error("User not authenticated");
      }

      // Get lead info
      const lead = await db.getLeadById(input.leadId);
      if (!lead) {
        throw new Error("Lead not found");
      }

      // Create call record
      const call = await db.createCall({
        leadId: input.leadId,
        companyId: lead.companyId,
        userId: ctx.user.id,
        phoneNumber: input.phoneNumber,
        status: "initiated",
        notes: input.script,
      });

      try {
        // Initiate call via Telnyx
        const telnyxResponse = await telnyx.initiateCall({
          to: input.phoneNumber,
          webhookUrl: `${process.env.VITE_FRONTEND_FORGE_API_URL || 'https://api.manus.im'}/api/calls/webhook`,
        });

        // Update call with Telnyx ID
        await db.updateCallStatus(call.id, "ringing");
        
        // If script provided, speak it when call is answered
        if (input.script && telnyxResponse.data.call_control_id) {
          // Note: This would be triggered by webhook when call is answered
          // For now, we just store the script in notes
        }

        return {
          success: true,
          callId: call.id,
          telnyxCallId: telnyxResponse.data.call_control_id,
        };
      } catch (error: any) {
        // Update call status to failed
        await db.updateCallStatus(call.id, "failed");
        throw new Error(`Failed to initiate call: ${error.message}`);
      }
    }),

  /**
   * List calls for a lead
   */
  listByLead: protectedProcedure
    .input(z.object({
      leadId: z.number(),
    }))
    .query(async ({ input }) => {
      const calls = await db.getCallsByLeadId(input.leadId);
      return { calls };
    }),

  /**
   * List all calls for a company
   */
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      const calls = await db.getCallsByCompanyId(input.companyId);
      return { calls };
    }),

  /**
   * Get call details
   */
  get: protectedProcedure
    .input(z.object({
      callId: z.number(),
    }))
    .query(async ({ input }) => {
      const call = await db.getCallById(input.callId);
      if (!call) {
        throw new Error("Call not found");
      }
      return { call };
    }),

  /**
   * Analyze call transcript with LLM
   */
  analyze: protectedProcedure
    .input(z.object({
      callId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const call = await db.getCallById(input.callId);
      if (!call || !call.transcript) {
        throw new Error("Call or transcript not found");
      }

      // Analyze with LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a sales call analyzer. Analyze the call transcript and provide: 1) Sentiment (positive/neutral/negative), 2) Outcome (interested/callback/not-interested/voicemail/no-answer/wrong-number), 3) Key points and next steps."
          },
          {
            role: "user",
            content: `Analyze this sales call transcript:\n\n${call.transcript}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "call_analysis",
            strict: true,
            schema: {
              type: "object",
              properties: {
                sentiment: {
                  type: "string",
                  enum: ["positive", "neutral", "negative"],
                  description: "Overall sentiment of the call"
                },
                outcome: {
                  type: "string",
                  enum: ["interested", "callback", "not-interested", "voicemail", "no-answer", "wrong-number"],
                  description: "Call outcome"
                },
                keyPoints: {
                  type: "array",
                  items: { type: "string" },
                  description: "Key points from the conversation"
                },
                nextSteps: {
                  type: "string",
                  description: "Recommended next steps"
                }
              },
              required: ["sentiment", "outcome", "keyPoints", "nextSteps"],
              additionalProperties: false
            }
          }
        }
      });

      const analysis = JSON.parse(response.choices[0].message.content || "{}");

      // Update call with analysis
      await db.updateCallTranscript(
        call.id,
        call.transcript,
        analysis.sentiment,
        analysis.outcome
      );

      return {
        success: true,
        analysis,
      };
    }),

  /**
   * Update call notes
   */
  updateNotes: protectedProcedure
    .input(z.object({
      callId: z.number(),
      notes: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db_instance = await db.getDb();
      if (!db_instance) throw new Error("Database not available");

      const { calls } = await import("../drizzle/schema");
      await db_instance.update(calls).set({ notes: input.notes }).where(db.eq(calls.id, input.callId));

      return { success: true };
    }),
});
