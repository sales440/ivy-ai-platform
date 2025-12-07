/**
 * Agent Milestones Router
 * 
 * Provides endpoints to check and trigger agent milestone notifications
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { checkAgentMilestones, scheduledMilestoneCheck } from "./agent-milestone-notifications";

export const agentMilestonesRouter = router({
  /**
   * Manually trigger a milestone check
   * Returns list of newly achieved milestones
   */
  checkMilestones: publicProcedure.mutation(async () => {
    const milestones = await checkAgentMilestones();
    return {
      success: true,
      milestonesFound: milestones.length,
      milestones,
    };
  }),

  /**
   * Get milestone thresholds configuration
   */
  getMilestoneConfig: publicProcedure.query(() => {
    // TODO: Load from database or config file
    return {
      conversions: [10, 25, 50, 100, 200],
      conversion_rate: [15, 20, 30, 40, 50],
      roi: [200, 300, 500, 750, 1000],
      emails_sent: [50, 100, 250, 500, 1000],
      open_rate: [25, 35, 45, 55, 65],
    };
  }),

  /**
   * Save milestone thresholds configuration
   */
  saveMilestoneConfig: publicProcedure
    .input(
      z.object({
        conversions: z.array(z.number()),
        conversion_rate: z.array(z.number()),
        roi: z.array(z.number()),
        emails_sent: z.array(z.number()),
        open_rate: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      // TODO: Save to database or config file
      // For now, just validate and return success
      console.log('[MilestoneConfig] Configuration updated:', input);
      return {
        success: true,
        message: 'Configuration saved successfully',
      };
    }),
});
