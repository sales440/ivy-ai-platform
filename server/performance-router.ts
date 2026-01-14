import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
  getLatestMetrics,
  getMetricsHistory,
  collectMetrics,
  detectAnomalies,
} from "./performance-monitor";

/**
 * Performance Monitoring tRPC Router
 */
export const performanceRouter = router({
  /**
   * Get latest performance metrics
   */
  getLatest: publicProcedure.query(async () => {
    const metrics = getLatestMetrics();
    if (!metrics) {
      // If no metrics yet, collect now
      const freshMetrics = await collectMetrics();
      const anomalies = detectAnomalies(freshMetrics);
      return {
        metrics: freshMetrics,
        anomalies,
      };
    }
    
    const anomalies = detectAnomalies(metrics);
    return {
      metrics,
      anomalies,
    };
  }),

  /**
   * Get metrics history
   */
  getHistory: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(({ input }) => {
      const history = getMetricsHistory();
      const limit = input?.limit || 50;
      return history.slice(-limit);
    }),

  /**
   * Force metrics collection (for testing)
   */
  collectNow: publicProcedure.mutation(async () => {
    const metrics = await collectMetrics();
    const anomalies = detectAnomalies(metrics);
    return {
      metrics,
      anomalies,
      collected: true,
    };
  }),

  /**
   * Get system health status
   */
  getHealthStatus: publicProcedure.query(async () => {
    const metrics = getLatestMetrics() || await collectMetrics();
    const anomalies = detectAnomalies(metrics);
    
    // Determine overall health
    const criticalAnomalies = anomalies.filter(a => a.severity === "critical");
    const warningAnomalies = anomalies.filter(a => a.severity === "warning");
    
    let status: "healthy" | "degraded" | "critical";
    if (criticalAnomalies.length > 0) {
      status = "critical";
    } else if (warningAnomalies.length > 0) {
      status = "degraded";
    } else {
      status = "healthy";
    }
    
    return {
      status,
      metrics: {
        cpu: metrics.cpu.usage,
        memory: metrics.memory.usagePercent,
        database: metrics.database.responseTime,
        uptime: metrics.server.uptime,
      },
      anomalies: {
        critical: criticalAnomalies.length,
        warning: warningAnomalies.length,
        total: anomalies.length,
      },
      timestamp: metrics.timestamp,
    };
  }),
});
