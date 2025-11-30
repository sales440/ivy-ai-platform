/**
 * Meta-Agent tRPC Router
 * 
 * API endpoints for Meta-Agent functionality
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { metaAgent } from "./meta-agent";
import { platformMaintenance } from "./meta-agent/capabilities/platform-maintenance";
import { detectTypeScriptErrors, getErrorStatistics, fixTypeScriptErrors } from "./meta-agent/capabilities/typescript-fixer";
import { checkPlatformHealth, healPlatform } from "./meta-agent/capabilities/platform-healer";
import { analyzeAllAgentsPerformance, trainAgent } from "./meta-agent/capabilities/agent-trainer";
import { analyzeCodeQuality, checkDependencies, checkSchema, migrateSchema } from "./meta-agent/capabilities/code-tools";

export const metaAgentRouter = router({
  /**
   * Get Meta-Agent status
   */
  getStatus: protectedProcedure.query(async () => {
    const status = metaAgent.getStatus();
    const maintenanceStats = platformMaintenance.getStatistics();

    return {
      ...status,
      maintenance: maintenanceStats,
    };
  }),

  /**
   * Start Meta-Agent
   */
  start: protectedProcedure.mutation(async () => {
    await metaAgent.start();
    await platformMaintenance.start();

    return {
      success: true,
      message: "Meta-Agent started successfully",
    };
  }),

  /**
   * Stop Meta-Agent
   */
  stop: protectedProcedure.mutation(async () => {
    metaAgent.stop();
    platformMaintenance.stop();

    return {
      success: true,
      message: "Meta-Agent stopped successfully",
    };
  }),

  /**
   * Run audit
   */
  runAudit: protectedProcedure.mutation(async () => {
    const result = await metaAgent.runAudit();
    return result;
  }),

  /**
   * Get tasks
   */
  getTasks: protectedProcedure.query(() => {
    return metaAgent.getTasks();
  }),

  /**
   * Get chat history
   */
  getChatHistory: protectedProcedure.query(() => {
    return metaAgent.getChatHistory();
  }),

  /**
   * Send chat message
   */
  sendChatMessage: protectedProcedure
    .input(
      z.object({
        message: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const response = await metaAgent.handleChatMessage(input.message, ctx.user.id.toString());
      return response;
    }),

  /**
   * Get TypeScript errors
   */
  getTypeScriptErrors: protectedProcedure.query(async () => {
    const errors = await detectTypeScriptErrors();
    const stats = await getErrorStatistics();

    return {
      errors: errors.slice(0, 50), // Return first 50 errors
      stats,
    };
  }),

  /**
   * Fix TypeScript errors
   */
  fixTypeScriptErrors: protectedProcedure.mutation(async () => {
    const result = await fixTypeScriptErrors();
    return result;
  }),

  /**
   * Get platform health
   */
  getPlatformHealth: protectedProcedure.query(async () => {
    return await checkPlatformHealth();
  }),

  /**
   * Heal platform
   */
  healPlatform: protectedProcedure.mutation(async () => {
    return await healPlatform();
  }),

  /**
   * Get agent performance
   */
  getAgentPerformance: protectedProcedure.query(async () => {
    return await analyzeAllAgentsPerformance();
  }),

  /**
   * Train agent
   */
  trainAgent: protectedProcedure
    .input(
      z.object({
        agentId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return await trainAgent(input.agentId);
    }),

  /**
   * Auto-train all agents
   */
  autoTrainAgents: protectedProcedure.mutation(async () => {
    await metaAgent.autoTrainAgents();
    return {
      success: true,
      message: "Auto-training started",
    };
  }),

  /**
   * Get code quality
   */
  getCodeQuality: protectedProcedure.query(async () => {
    const opportunities = await analyzeCodeQuality();
    return {
      opportunities: opportunities.slice(0, 20), // Return first 20
      total: opportunities.length,
    };
  }),

  /**
   * Get dependencies
   */
  getDependencies: protectedProcedure.query(async () => {
    return await checkDependencies();
  }),

  /**
   * Get schema issues
   */
  getSchemaIssues: protectedProcedure.query(async () => {
    return await checkSchema();
  }),

  /**
   * Migrate schema
   */
  migrateSchema: protectedProcedure.mutation(async () => {
    return await migrateSchema();
  }),

  /**
   * Execute custom task
   */
  executeTask: protectedProcedure
    .input(
      z.object({
        type: z.enum([
          "fix_typescript_errors",
          "refactor_code",
          "train_agent",
          "auto_train",
          "migrate_schema",
          "manage_dependencies",
          "audit_platform",
          "heal_system",
        ]),
        priority: z.enum(["low", "medium", "high", "critical"]),
        description: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const taskId = await metaAgent.createTask(input);
      return {
        success: true,
        taskId,
      };
    }),

  /**
   * Get dashboard stats
   */
  getDashboardStats: protectedProcedure.query(async () => {
    const status = metaAgent.getStatus();
    const health = await checkPlatformHealth();
    const tsStats = await getErrorStatistics();
    const performances = await analyzeAllAgentsPerformance();

    return {
      metaAgent: {
        status: status.status,
        isRunning: status.isRunning,
        activeTasks: status.activeTasks,
        completedTasks: status.completedTasks,
        failedTasks: status.failedTasks,
      },
      platform: {
        health: health.status,
        issues: health.issues.length,
        criticalIssues: health.issues.filter(i => i.severity === "critical").length,
      },
      code: {
        typeScriptErrors: tsStats.total,
        errorFiles: Object.keys(tsStats.byFile).length,
      },
      agents: {
        total: performances.length,
        avgSuccessRate: performances.length > 0
          ? performances.reduce((sum, p) => sum + p.metrics.successRate, 0) / performances.length
          : 0,
      },
      lastAudit: status.lastAudit,
    };
  }),
});
