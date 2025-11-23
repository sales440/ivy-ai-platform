import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  getAggregatedStats,
  getDailyStats,
  getRecentStats,
} from "./services/sendgrid-stats";

/**
 * Email Analytics Router
 * Provides email performance metrics from SendGrid
 */
export const emailAnalyticsRouter = router({
  /**
   * Get aggregated stats for a date range
   */
  getStats: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string().optional(), // YYYY-MM-DD
      })
    )
    .query(async ({ input }) => {
      const stats = await getAggregatedStats({
        startDate: input.startDate,
        endDate: input.endDate,
      });

      return {
        success: true,
        data: stats,
      };
    }),

  /**
   * Get recent stats (last N days)
   */
  getRecentStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const stats = await getRecentStats(input.days);

      return {
        success: true,
        data: stats,
      };
    }),

  /**
   * Get daily stats for charting
   */
  getDailyStats: protectedProcedure
    .input(
      z.object({
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const dailyStats = await getDailyStats(input.days);

      return {
        success: true,
        data: dailyStats,
      };
    }),
});
