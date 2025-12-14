
import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { sendSMS, sendWhatsApp, sendTemplate } from "../meta-agent/capabilities/omni-channel";

export const communicationsRouter = router({
    // Send simple text SMS
    sendSMS: protectedProcedure
        .input(z.object({
            to: z.string(),
            body: z.string(),
        }))
        .mutation(async ({ input }) => {
            return await sendSMS(input.to, input.body);
        }),

    // Send simple WhatsApp text
    sendWhatsApp: protectedProcedure
        .input(z.object({
            to: z.string(),
            body: z.string(),
        }))
        .mutation(async ({ input }) => {
            // Logic to auto-format number if needed could go here
            return await sendWhatsApp(input.to, input.body);
        }),

    // Send WhatsApp Template (HSM)
    sendTemplate: protectedProcedure
        .input(z.object({
            to: z.string(),
            templateSid: z.string(),
            variables: z.record(z.string()),
        }))
        .mutation(async ({ input }) => {
            return await sendTemplate(input.to, input.templateSid, input.variables);
        }),

    // Bulk Send Template
    sendBulkTemplate: protectedProcedure
        .input(z.object({
            recipients: z.array(z.string()),
            templateSid: z.string(),
            variables: z.record(z.string()).optional(),
        }))
        .mutation(async ({ input }) => {
            const results = [];
            for (const recipient of input.recipients) {
                const result = await sendTemplate(recipient, input.templateSid, input.variables || {});
                results.push({ recipient, ...result });
            }
            return { results, total: results.length, successCount: results.filter(r => r.success).length };
        }),

    // Get history (Mock for now, would likely query DB)
    getHistory: protectedProcedure
        .input(z.object({
            limit: z.number().default(20)
        }))
        .query(async () => {
            // Future: Fetch from 'communication_logs' table
            return { logs: [] };
        })
});
