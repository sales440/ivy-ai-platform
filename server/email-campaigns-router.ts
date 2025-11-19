import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { emailCampaigns } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const emailCampaignsRouter = router({
  /**
   * List all email campaign templates for a company
   */
  list: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.companyId, input.companyId));

      return templates;
    }),

  /**
   * Get a specific email campaign template by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(emailCampaigns)
        .where(eq(emailCampaigns.id, input.id))
        .limit(1);

      return result[0] || null;
    }),

  /**
   * Create a new email campaign template
   */
  create: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      name: z.string(),
      subject: z.string(),
      body: z.string(),
      type: z.enum(["callback", "interested", "notInterested", "voicemail"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(emailCampaigns).values({
        companyId: input.companyId,
        name: input.name,
        subject: input.subject,
        body: input.body,
        type: input.type,
        createdBy: ctx.user.id,
      });

      return {
        id: Number(result.insertId),
        success: true,
      };
    }),

  /**
   * Update an existing email campaign template
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string(),
      subject: z.string(),
      body: z.string(),
      type: z.enum(["callback", "interested", "notInterested", "voicemail"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(emailCampaigns)
        .set({
          name: input.name,
          subject: input.subject,
          body: input.body,
          type: input.type,
          updatedAt: new Date(),
        })
        .where(eq(emailCampaigns.id, input.id));

      return { success: true };
    }),

  /**
   * Delete an email campaign template
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(emailCampaigns)
        .where(eq(emailCampaigns.id, input.id));

      return { success: true };
    }),

  /**
   * Get templates by type (outcome)
   */
  getByType: protectedProcedure
    .input(z.object({
      companyId: z.number(),
      type: z.enum(["callback", "interested", "notInterested", "voicemail"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const templates = await db
        .select()
        .from(emailCampaigns)
        .where(
          and(
            eq(emailCampaigns.companyId, input.companyId),
            eq(emailCampaigns.type, input.type)
          )
        );

      return templates;
    }),
});
