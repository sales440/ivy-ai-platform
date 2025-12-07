import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { recommendAgentsForCampaign, trackAssignmentEffectiveness } from "./campaign-agent-matcher";

export const campaignAgentMatcherRouter = router({
  /**
   * Get agent recommendations for a campaign
   */
  getRecommendations: publicProcedure
    .input(
      z.object({
        type: z.enum(['cold_outreach', 'nurture', 'conversion', 'reactivation', 'upsell']),
        industry: z.string().optional(),
        targetAudience: z.string().optional(),
        expectedVolume: z.number().optional(),
        priority: z.enum(['low', 'medium', 'high']).optional(),
      })
    )
    .query(async ({ input }) => {
      const recommendations = await recommendAgentsForCampaign(input);
      return { recommendations };
    }),

  /**
   * Track assignment effectiveness
   */
  trackEffectiveness: publicProcedure
    .input(
      z.object({
        agentId: z.number(),
        campaignId: z.number(),
        actualMetrics: z.object({
          conversionRate: z.number(),
          roi: z.number(),
          openRate: z.number(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      await trackAssignmentEffectiveness(
        input.agentId,
        input.campaignId,
        input.actualMetrics
      );
      return { success: true };
    }),
});
