import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  executeEmailWorkflow,
  getEmailSequences,
  testEmailWorkflow,
} from "./email-workflow-executor";
import { getDb } from "./db";

/**
 * Email Workflows Router
 * Handles email nurturing workflow execution and monitoring
 */

export const emailWorkflowsRouter = router({
  /**
   * Execute an email workflow for a lead
   */
  execute: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        sequenceName: z.string(),
        startFromDay: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const result = await executeEmailWorkflow(input);
      return result;
    }),

  /**
   * Get available email sequences
   */
  listSequences: protectedProcedure.query(async () => {
    const sequences = await getEmailSequences();
    return sequences;
  }),

  /**
   * Test email workflow with a specific lead email
   */
  test: protectedProcedure
    .input(z.object({ leadEmail: z.string().email() }))
    .mutation(async ({ input }) => {
      const result = await testEmailWorkflow(input.leadEmail);
      return result;
    }),

  /**
   * Get email workflow execution history
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        leadId: z.number().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = `
        SELECT 
          el.id,
          el.leadId,
          el.sequenceName,
          el.subject,
          el.status,
          el.sentAt,
          el.error,
          l.name as leadName,
          l.email as leadEmail,
          l.company as leadCompany
        FROM emailLogs el
        LEFT JOIN leads l ON el.leadId = l.id
      `;

      const params: any[] = [];

      if (input.leadId) {
        query += ` WHERE el.leadId = ?`;
        params.push(input.leadId);
      }

      query += ` ORDER BY el.sentAt DESC LIMIT ?`;
      params.push(input.limit);

      const result = await db.execute(query, params);
      const rows = result[0] as any[];

      return rows;
    }),

  /**
   * Get email workflow statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const query = `
      SELECT 
        COUNT(*) as totalSent,
        SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        COUNT(DISTINCT leadId) as uniqueLeads,
        COUNT(DISTINCT sequenceName) as activeSequences
      FROM emailLogs
      WHERE sentAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;

    const result = await db.execute(query);
    const rows = result[0] as any[];
    const stats = rows[0];

    return {
      totalSent: Number(stats.totalSent) || 0,
      successful: Number(stats.successful) || 0,
      failed: Number(stats.failed) || 0,
      uniqueLeads: Number(stats.uniqueLeads) || 0,
      activeSequences: Number(stats.activeSequences) || 0,
      successRate:
        stats.totalSent > 0
          ? ((stats.successful / stats.totalSent) * 100).toFixed(1)
          : "0.0",
    };
  }),

  /**
   * Bulk execute workflow for multiple leads
   */
  bulkExecute: protectedProcedure
    .input(
      z.object({
        leadIds: z.array(z.number()),
        sequenceName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const results = {
        total: input.leadIds.length,
        successful: 0,
        failed: 0,
        errors: [] as string[],
      };

      for (const leadId of input.leadIds) {
        try {
          const result = await executeEmailWorkflow({
            leadId,
            sequenceName: input.sequenceName,
          });

          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Lead ${leadId}: ${result.errors.join(", ")}`);
          }
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Lead ${leadId}: ${error.message}`);
        }
      }

      return results;
    }),
});
