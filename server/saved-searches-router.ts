import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const savedSearchesRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        name: z.string().min(1).max(200),
        filters: z.object({
          query: z.string(),
          industry: z.string().optional(),
          location: z.string().optional(),
          companySize: z.string().optional(),
          seniority: z.string().optional(),
          skills: z.array(z.string()).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const searchId = await db.createSavedSearch({
        userId: ctx.user.id,
        companyId: input.companyId || null,
        name: input.name,
        filters: input.filters,
      });

      return { success: true, searchId };
    }),

  list: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const searches = await db.getSavedSearches(
        ctx.user.id,
        input.companyId
      );

      return { searches };
    }),

  execute: protectedProcedure
    .input(z.object({ searchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Increment usage count
      await db.updateSavedSearchUsage(input.searchId);

      // Get the search to return its filters
      const searches = await db.getSavedSearches(ctx.user.id);
      const search = searches.find((s) => s.id === input.searchId);

      if (!search) {
        throw new Error("Saved search not found");
      }

      return { filters: search.filters };
    }),

  delete: protectedProcedure
    .input(z.object({ searchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.deleteSavedSearch(input.searchId, ctx.user.id);
      return { success: true };
    }),
});
