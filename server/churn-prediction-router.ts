/**
 * Churn Prediction Router
 * 
 * Provides endpoints for contact churn prediction and reactivation
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  predictCampaignChurn, 
  getChurnStatistics,
  triggerReactivationSequence 
} from "./churn-prediction";

export const churnPredictionRouter = router({
  /**
   * Get churn predictions for all contacts
   */
  getPredictions: publicProcedure
    .input(
      z.object({
        campaignName: z.string().optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const predictions = await predictCampaignChurn(input?.campaignName || 'all');
      return predictions;
    }),

  /**
   * Get churn statistics for dashboard
   */
  getStatistics: publicProcedure.query(async () => {
    const stats = await getChurnStatistics();
    return stats;
  }),

  /**
   * Trigger reactivation sequence for a contact
   */
  triggerReactivation: publicProcedure
    .input(
      z.object({
        contactId: z.string(),
        email: z.string(),
        name: z.string(),
        churnRiskScore: z.number(),
        churnRiskLevel: z.enum(['low', 'medium', 'high', 'critical']),
        primaryReason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await triggerReactivationSequence(input.contactId, {
        contactId: input.contactId,
        email: input.email,
        name: input.name,
        companyName: '',
        churnRiskScore: input.churnRiskScore,
        churnRiskLevel: input.churnRiskLevel,
        primaryReason: input.primaryReason,
        contributingFactors: [],
        recommendedActions: [],
        shouldTriggerReactivation: true,
        predictedAt: new Date(),
      });
      
      return {
        success: true,
        message: `Reactivation sequence triggered for ${input.email}`,
      };
    }),
});
