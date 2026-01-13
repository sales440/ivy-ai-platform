import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  predictCampaignSuccess,
  trainModel,
  getModelStatus,
  analyzeCampaign,
  type CampaignFeatures,
  type TrainingData,
} from "./predictive-analytics";
import { getDb } from "./db";
import { salesCampaigns } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Predictive Analytics Router
 * ML-powered campaign success prediction
 */

const campaignFeaturesSchema = z.object({
  channelType: z.enum(["email", "phone", "sms", "social_media"]),
  targetAudienceSize: z.number(),
  industryType: z.string(),
  timeOfDay: z.number().min(0).max(23),
  dayOfWeek: z.number().min(0).max(6),
  seasonality: z.number().min(1).max(4),
  previousCampaignSuccessRate: z.number().optional(),
  companyEngagementHistory: z.number().optional(),
  subjectLineLength: z.number().optional(),
  hasPersonalization: z.boolean(),
  hasUrgency: z.boolean(),
  hasCallToAction: z.boolean(),
  contentSentimentScore: z.number().optional(),
});

export const predictiveAnalyticsRouter = router({
  /**
   * Predict campaign success
   */
  predict: protectedProcedure
    .input(campaignFeaturesSchema)
    .mutation(async ({ input }) => {
      const features: CampaignFeatures = input;
      const prediction = predictCampaignSuccess(features);
      return prediction;
    }),

  /**
   * Analyze campaign and get optimization suggestions
   */
  analyze: protectedProcedure
    .input(campaignFeaturesSchema)
    .mutation(async ({ input }) => {
      const features: CampaignFeatures = input;
      const analysis = analyzeCampaign(features);
      return analysis;
    }),

  /**
   * Train model with historical data
   */
  train: protectedProcedure
    .input(
      z.object({
        data: z.array(
          z.object({
            features: campaignFeaturesSchema,
            outcome: z.object({
              conversions: z.number(),
              impressions: z.number(),
              revenue: z.number(),
            }),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const trainingData: TrainingData[] = input.data;
      const result = trainModel(trainingData);
      return result;
    }),

  /**
   * Auto-train model from existing campaigns
   */
  autoTrain: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Fetch completed campaigns with metrics
    const campaigns = await db
      .select()
      .from(salesCampaigns)
      .where(eq(salesCampaigns.status, "completed"));

    // Convert to training data
    const trainingData: TrainingData[] = campaigns
      .filter((c) => c.status === "completed")
      .map((campaign) => {
        // Parse campaign data to extract features
        const now = new Date();
        const features: CampaignFeatures = {
          channelType: (campaign.type as any) || "email",
          targetAudienceSize: 100, // Default since we don't have totalLeads field
          industryType: "general",
          timeOfDay: now.getHours(),
          dayOfWeek: now.getDay(),
          seasonality: Math.ceil((now.getMonth() + 1) / 3),
          hasPersonalization: true,
          hasUrgency: false,
          hasCallToAction: true,
        };

        const outcome = {
          conversions: 0, // Metrics not stored in current schema
          impressions: 1,
          revenue: 0,
        };

        return { features, outcome };
      });

    if (trainingData.length === 0) {
      return {
        success: false,
        message: "No completed campaigns found for training",
        dataPoints: 0,
      };
    }

    const result = trainModel(trainingData);
    return {
      message: `Model trained with ${result.dataPoints} campaigns`,
      ...result,
    };
  }),

  /**
   * Get model status
   */
  status: protectedProcedure.query(async () => {
    return getModelStatus();
  }),

  /**
   * Predict for existing campaign
   */
  predictForCampaign: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [campaign] = await db
        .select()
        .from(salesCampaigns)
        .where(eq(salesCampaigns.id, input.campaignId))
        .limit(1);

      if (!campaign) throw new Error("Campaign not found");

      // Extract features from campaign
      const now = new Date();
      const features: CampaignFeatures = {
        channelType: (campaign.type as any) || "email",
        targetAudienceSize: 100, // Default since we don't have totalLeads field
        industryType: "general",
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        seasonality: Math.ceil((now.getMonth() + 1) / 3),
        hasPersonalization: true,
        hasUrgency: false,
        hasCallToAction: true,
      };

      const prediction = predictCampaignSuccess(features);
      return {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
        },
        prediction,
      };
    }),

  /**
   * Batch predict for multiple campaigns
   */
  batchPredict: protectedProcedure
    .input(z.object({ campaignIds: z.array(z.number()) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const predictions = [];

      for (const campaignId of input.campaignIds) {
        const [campaign] = await db
          .select()
          .from(salesCampaigns)
          .where(eq(salesCampaigns.id, campaignId))
          .limit(1);

        if (campaign) {
          const now = new Date();
          const features: CampaignFeatures = {
            channelType: (campaign.type as any) || "email",
            targetAudienceSize: 100, // Default since we don't have totalLeads field
            industryType: "general",
            timeOfDay: now.getHours(),
            dayOfWeek: now.getDay(),
            seasonality: Math.ceil((now.getMonth() + 1) / 3),
            hasPersonalization: true,
            hasUrgency: false,
            hasCallToAction: true,
          };

          const prediction = predictCampaignSuccess(features);
          predictions.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            prediction,
          });
        }
      }

      return predictions;
    }),
});
