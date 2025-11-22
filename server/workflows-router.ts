import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { triggerWorkflow } from "./workflows/marketing-automation";
import { getDb } from "./db";

/**
 * Workflows Router
 * Handles workflow execution and monitoring
 */

export const workflowsRouter = router({
  /**
   * Trigger a marketing workflow
   */
  trigger: protectedProcedure
    .input(
      z.object({
        workflowType: z.enum([
          "email_nurturing",
          "linkedin_post",
          "lead_qualification",
          "demo_scheduling",
        ]),
        params: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const result = await triggerWorkflow(input.workflowType, input.params || {});
      return result;
    }),

  /**
   * Get recent workflow executions
   */
  getRecentExecutions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        workflowType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = `
        SELECT 
          t.id,
          t.agentId,
          t.type,
          t.status,
          t.input,
          t.output,
          t.createdAt,
          t.completedAt,
          a.name as agentName
        FROM tasks t
        LEFT JOIN agents a ON t.agentId = a.id
        WHERE t.type LIKE 'workflow:%'
      `;

      const params: any[] = [];

      if (input.workflowType) {
        query += ` AND t.type = ?`;
        params.push(`workflow:${input.workflowType}`);
      }

      query += ` ORDER BY t.createdAt DESC LIMIT ?`;
      params.push(input.limit);

      const result = await db.execute(query, params);
      const rows = result[0];

      return rows as Array<{
        id: number;
        agentId: number;
        type: string;
        status: string;
        input: any;
        output: any;
        createdAt: Date;
        completedAt: Date | null;
        agentName: string;
      }>;
    }),

  /**
   * Get workflow statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running
      FROM tasks
      WHERE type LIKE 'workflow:%'
        AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `;

    const result = await db.execute(query);
    const rows = result[0] as any[];
    const stats = rows[0];

    return {
      total: Number(stats.total) || 0,
      completed: Number(stats.completed) || 0,
      failed: Number(stats.failed) || 0,
      running: Number(stats.running) || 0,
    };
  }),
});
