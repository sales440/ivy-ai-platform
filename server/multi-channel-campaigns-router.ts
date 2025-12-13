import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { campaignExecutions, campaignSteps, multiChannelCampaigns } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import {
  startCampaignForLead,
  executeNextCampaignStep,
  processPendingCampaignExecutions,
} from "./services/campaign-orchestrator";
import { generateCampaignFromIntent } from "./services/autonomous-campaign-manager";

export const multiChannelCampaignsRouter = router({
  /**
   * List all campaigns
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const campaigns = await db
      .select()
      .from(multiChannelCampaigns)
      .where(eq(multiChannelCampaigns.companyId, ctx.user.companyId || 1))
      .orderBy(desc(multiChannelCampaigns.createdAt));

    return campaigns;
  }),

  /**
   * Get campaign details with steps
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const [campaign] = await db
        .select()
        .from(multiChannelCampaigns)
        .where(eq(multiChannelCampaigns.id, input.id))
        .limit(1);

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      const steps = await db
        .select()
        .from(campaignSteps)
        .where(eq(campaignSteps.campaignId, input.id))
        .orderBy(campaignSteps.stepNumber);

      return { campaign, steps };
    }),

  /**
   * Generate a campaign from intent (Autonomous)
   */
  generate: protectedProcedure
    .input(z.object({ intent: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await generateCampaignFromIntent(
        input.intent,
        ctx.user.companyId || 1,
        ctx.user.id
      );

      if (!result.success) {
        throw new Error(result.message || "Failed to generate campaign");
      }

      return { success: true, campaignId: result.campaignId };
    }),

  /**
   * Create a new campaign (Manual)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        targetAudience: z.enum(["awareness", "consideration", "decision"]),
        steps: z.array(
          z.object({
            stepNumber: z.number(),
            delayDays: z.number(),
            channelType: z.enum(["email", "linkedin"]),
            actionType: z.string(),
            actionConfig: z.object({
              emailSequenceId: z.number().optional(),
              linkedInPostType: z.string().optional(),
              customMessage: z.string().optional(),
            }),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Create campaign
      const [result] = await db.insert(multiChannelCampaigns).values({
        companyId: ctx.user.companyId || 1, // Default to 1 if not present
        name: input.name,
        description: input.description,
        targetAudience: input.targetAudience,
        status: "draft",
        createdBy: ctx.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const campaignId = result.insertId;

      // Create steps
      for (const step of input.steps) {
        await db.insert(campaignSteps).values({
          campaignId,
          stepNumber: step.stepNumber,
          delayDays: step.delayDays,
          channelType: step.channelType,
          actionType: step.actionType,
          actionConfig: JSON.stringify(step.actionConfig),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return { success: true, campaignId };
    }),

  /**
   * Start campaign for a lead
   */
  startForLead: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        leadId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      return await startCampaignForLead(input.campaignId, input.leadId);
    }),

  /**
   * Get campaign executions
   */
  getExecutions: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const executions = await db
        .select()
        .from(campaignExecutions)
        .where(eq(campaignExecutions.campaignId, input.campaignId))
        .orderBy(desc(campaignExecutions.createdAt));

      return executions;
    }),

  /**
   * Get campaign stats
   */
  getStats: protectedProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const executions = await db
        .select()
        .from(campaignExecutions)
        .where(eq(campaignExecutions.campaignId, input.campaignId));

      const total = executions.length;
      const completed = executions.filter((e) => e.status === "completed").length;
      const inProgress = executions.filter((e) => e.status === "in_progress").length;
      const failed = executions.filter((e) => e.status === "failed").length;
      const pending = executions.filter((e) => e.status === "pending").length;

      return {
        total,
        completed,
        inProgress,
        failed,
        pending,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
      };
    }),

  /**
   * Update campaign status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "active", "paused", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db
        .update(multiChannelCampaigns)
        .set({
          status: input.status,
          updatedAt: new Date(),
        })
        .where(eq(multiChannelCampaigns.id, input.id));

      return { success: true };
    }),

  /**
   * Process pending executions (called by scheduler)
   */
  processPending: protectedProcedure.mutation(async () => {
    await processPendingCampaignExecutions();
    return { success: true, message: "Pending executions processed" };
  }),
});
