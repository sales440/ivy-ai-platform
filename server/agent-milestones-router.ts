/**
 * Agent Milestones Router
 * 
 * Provides endpoints to check and trigger agent milestone notifications
 */

import { router, publicProcedure } from "./_core/trpc";
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
    return {
      conversions: [10, 25, 50, 100, 200],
      conversion_rate: [15, 20, 30, 40, 50],
      roi: [200, 300, 500, 750, 1000],
      emails_sent: [50, 100, 250, 500, 1000],
      open_rate: [25, 35, 45, 55, 65],
    };
  }),
});
