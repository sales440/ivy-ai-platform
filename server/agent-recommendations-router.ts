/**
 * Agent Recommendations Router
 * 
 * Provides endpoints for AI-powered optimization recommendations
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { generateAgentRecommendations, generateAllAgentRecommendations } from "./agent-optimization-recommendations";

export const agentRecommendationsRouter = router({
  /**
   * Get recommendations for a specific agent
   */
  getAgentRecommendations: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        agentName: z.string(),
        campaignName: z.string(),
        metrics: z.object({
          emailsSent: z.number(),
          openRate: z.number(),
          clickRate: z.number(),
          conversionRate: z.number(),
          roi: z.number(),
          avgResponseTime: z.number(),
        }),
        recentTrends: z.object({
          conversionRateChange: z.number(),
          openRateChange: z.number(),
          roiChange: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const recommendations = await generateAgentRecommendations(input);
      return recommendations;
    }),

  /**
   * Get recommendations for all agents (mock data for now)
   */
  getAllRecommendations: publicProcedure.query(async () => {
    // Mock data for demonstration
    const mockAgentsData = [
      {
        agentId: 'ivy-prospect',
        agentName: 'Ivy-Prospect',
        campaignName: 'CNC Training 2026',
        metrics: {
          emailsSent: 150,
          openRate: 28.5,
          clickRate: 12.3,
          conversionRate: 18.2,
          roi: 450,
          avgResponseTime: 4.2,
        },
        recentTrends: {
          conversionRateChange: 5.3,
          openRateChange: 2.1,
          roiChange: 8.5,
        },
      },
      {
        agentId: 'ivy-closer',
        agentName: 'Ivy-Closer',
        campaignName: 'Warranty Extension',
        metrics: {
          emailsSent: 120,
          openRate: 32.1,
          clickRate: 15.7,
          conversionRate: 22.4,
          roi: 520,
          avgResponseTime: 3.8,
        },
        recentTrends: {
          conversionRateChange: 3.2,
          openRateChange: 4.5,
          roiChange: 12.3,
        },
      },
      {
        agentId: 'ivy-solve',
        agentName: 'Ivy-Solve',
        campaignName: 'Equipment Repair',
        metrics: {
          emailsSent: 95,
          openRate: 22.3,
          clickRate: 8.9,
          conversionRate: 15.7,
          roi: 380,
          avgResponseTime: 5.1,
        },
        recentTrends: {
          conversionRateChange: -3.5,
          openRateChange: -2.8,
          roiChange: -4.2,
        },
      },
    ];

    const recommendations = await generateAllAgentRecommendations(mockAgentsData);
    return recommendations;
  }),
});
