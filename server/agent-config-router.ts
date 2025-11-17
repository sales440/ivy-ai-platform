import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

const agentTypeEnum = z.enum(["prospect", "closer", "solve", "logic", "talent", "insight"]);

export const agentConfigRouter = router({
  // Get configuration for a specific agent type in a company
  get: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      agentType: agentTypeEnum
    }))
    .query(async ({ input }) => {
      const config = await db.getAgentConfiguration(input.companyId, input.agentType);
      return { config };
    }),

  // Get all agent configurations for a company
  listByCompany: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const configurations = await db.getAllAgentConfigurations(input.companyId);
      return { configurations };
    }),

  // Create or update agent configuration
  upsert: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      agentType: agentTypeEnum,
      temperature: z.number().min(0).max(100).default(70),
      maxTokens: z.number().min(100).max(10000).default(2000),
      systemPrompt: z.string().optional(),
      customInstructions: z.string().optional(),
      isActive: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admins or users with admin role in the company can configure agents
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }

      await db.upsertAgentConfiguration(input);
      return { success: true };
    }),

  // Delete agent configuration (revert to defaults)
  delete: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      agentType: agentTypeEnum
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }

      await db.deleteAgentConfiguration(input.companyId, input.agentType);
      return { success: true };
    }),
});
