import { eq, desc, and, gte } from "drizzle-orm";
import { z } from "zod";
import { agents, tasks } from "../drizzle/schema";
import { getDb } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";

/**
 * tRPC router for agent monitoring and management
 */

export const agentsRouter = router({
  /**
   * List all marketing agents
   */
  listMarketingAgents: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const marketingAgents = await db
      .select()
      .from(agents)
      .where(
        and(
          eq(agents.department, "marketing"),
          // Get agents with IDs starting with "ivy-"
        )
      )
      .orderBy(agents.name);

    return marketingAgents;
  }),

  /**
   * Get recent tasks for monitoring
   */
  getRecentTasks: publicProcedure
    .input(
      z.object({
        limit: z.number().optional().default(20),
        agentId: z.number().optional(),
        status: z.enum(["pending", "running", "completed", "failed"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(input.limit);

      if (input.agentId) {
        query = query.where(eq(tasks.agentId, input.agentId)) as any;
      }

      if (input.status) {
        query = query.where(eq(tasks.status, input.status)) as any;
      }

      const recentTasks = await query;

      return recentTasks;
    }),

  /**
   * Get workflow statistics
   */
  getWorkflowStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all marketing agents
    const marketingAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.department, "marketing"));

    // Calculate aggregate stats
    let totalEmailsSent = 0;
    let totalPostsPublished = 0;
    let totalLeadsQualified = 0;
    let totalDemosScheduled = 0;
    let totalExecutionTime = 0;
    let taskCount = 0;

    for (const agent of marketingAgents) {
      const kpis = agent.kpis as Record<string, number>;

      if (agent.agentId === "ivy-nurture-001") {
        totalEmailsSent = kpis.emails_sent || 0;
      }

      if (agent.agentId === "ivy-linkedin-001") {
        totalPostsPublished = kpis.posts_published || 0;
      }

      if (agent.agentId === "ivy-qualifier-001") {
        totalLeadsQualified = kpis.leads_qualified || 0;
      }

      if (agent.agentId === "ivy-scheduler-001") {
        totalDemosScheduled = kpis.demos_scheduled || 0;
      }
    }

    // Get average execution time from completed tasks
    const completedTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.status, "completed"))
      .limit(100);

    for (const task of completedTasks) {
      if (task.executionTime) {
        totalExecutionTime += task.executionTime;
        taskCount++;
      }
    }

    const avgResponseTime = taskCount > 0 ? Math.round(totalExecutionTime / taskCount / 1000) : 0;

    return {
      totalEmailsSent,
      totalPostsPublished,
      totalLeadsQualified,
      totalDemosScheduled,
      avgResponseTime,
    };
  }),

  /**
   * Get agent details by ID
   */
  getAgentDetails: publicProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.agentId, input.agentId))
        .limit(1);

      if (!agent || agent.length === 0) {
        throw new Error(`Agent ${input.agentId} not found`);
      }

      // Get agent's recent tasks
      const agentTasks = await db
        .select()
        .from(tasks)
        .where(eq(tasks.agentId, agent[0].id))
        .orderBy(desc(tasks.createdAt))
        .limit(10);

      return {
        agent: agent[0],
        recentTasks: agentTasks,
      };
    }),

  /**
   * Update agent status (admin only)
   */
  updateAgentStatus: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
        status: z.enum(["idle", "active", "training", "error"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Only admins can update agent status
      if (ctx.user.role !== "admin") {
        throw new Error("Unauthorized: Only admins can update agent status");
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(agents)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(agents.agentId, input.agentId));

      return { success: true };
    }),

  /**
   * Get agent performance metrics
   */
  getAgentPerformance: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        timeRange: z.enum(["24h", "7d", "30d"]).optional().default("7d"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const agent = await db
        .select()
        .from(agents)
        .where(eq(agents.agentId, input.agentId))
        .limit(1);

      if (!agent || agent.length === 0) {
        throw new Error(`Agent ${input.agentId} not found`);
      }

      // Calculate time range
      const now = new Date();
      const timeRangeMap = {
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
      };

      const startTime = new Date(now.getTime() - timeRangeMap[input.timeRange]);

      // Get tasks in time range
      const tasksInRange = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.agentId, agent[0].id), gte(tasks.createdAt, startTime)))
        .orderBy(desc(tasks.createdAt));

      // Calculate metrics
      const totalTasks = tasksInRange.length;
      const completedTasks = tasksInRange.filter((t) => t.status === "completed").length;
      const failedTasks = tasksInRange.filter((t) => t.status === "failed").length;
      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const executionTimes = tasksInRange
        .filter((t) => t.executionTime)
        .map((t) => t.executionTime!);

      const avgExecutionTime =
        executionTimes.length > 0
          ? executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length
          : 0;

      return {
        agent: agent[0],
        timeRange: input.timeRange,
        metrics: {
          totalTasks,
          completedTasks,
          failedTasks,
          successRate: Math.round(successRate),
          avgExecutionTime: Math.round(avgExecutionTime),
        },
        recentTasks: tasksInRange.slice(0, 10),
      };
    }),
});
