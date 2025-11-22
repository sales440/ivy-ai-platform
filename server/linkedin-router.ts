import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { agents } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { executeLinkedInPostWorkflow } from "./workflows/marketing-automation";

/**
 * LinkedIn Router
 * Handles LinkedIn post generation and management for Juan Carlos Robledo's account
 */

export const linkedInRouter = router({
  /**
   * List LinkedIn posts
   */
  listPosts: protectedProcedure
    .input(
      z.object({
        status: z.enum(["draft", "scheduled", "published"]).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = `
        SELECT 
          lp.id,
          lp.agentId,
          lp.postType,
          lp.content,
          lp.status,
          lp.scheduledFor,
          lp.publishedAt,
          lp.linkedinUrl,
          lp.engagement,
          lp.createdAt,
          lp.updatedAt,
          a.name as agentName
        FROM linkedinPosts lp
        LEFT JOIN agents a ON lp.agentId = a.id
      `;

      const params: any[] = [];

      if (input.status) {
        query += ` WHERE lp.status = ?`;
        params.push(input.status);
      }

      query += ` ORDER BY lp.createdAt DESC LIMIT ?`;
      params.push(input.limit);

      const [rows] = await db.execute(query, params);

      return rows as Array<{
        id: number;
        agentId: number;
        postType: string;
        content: string;
        status: string;
        scheduledFor: Date | null;
        publishedAt: Date | null;
        linkedinUrl: string | null;
        engagement: any;
        createdAt: Date;
        updatedAt: Date;
        agentName: string;
      }>;
    }),

  /**
   * Generate new LinkedIn post
   */
  generatePost: protectedProcedure
    .input(
      z.object({
        postType: z.enum([
          "hook_controversial",
          "case_study",
          "data_viz",
          "storytelling",
          "myth_busting",
        ]),
        targetAudience: z.array(z.string()),
        scheduledFor: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Execute LinkedIn post workflow
      const result = await executeLinkedInPostWorkflow({
        postType: input.postType,
        scheduledTime: input.scheduledFor || new Date(),
        targetAudience: input.targetAudience,
      });

      if (!result.success) {
        throw new Error("Failed to generate LinkedIn post");
      }

      // Get the LinkedIn agent
      const linkedInAgent = await db
        .select()
        .from(agents)
        .where(eq(agents.agentId, "ivy-linkedin-001"))
        .limit(1);

      if (!linkedInAgent || linkedInAgent.length === 0) {
        throw new Error("LinkedIn agent not found");
      }

      // Insert post into database
      const insertQuery = `
        INSERT INTO linkedinPosts (agentId, postType, content, status, scheduledFor, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await db.execute(insertQuery, [
        linkedInAgent[0].id,
        input.postType,
        result.postContent,
        input.scheduledFor ? "scheduled" : "draft",
        input.scheduledFor || null,
      ]);

      return {
        success: true,
        postContent: result.postContent,
        postType: input.postType,
      };
    }),

  /**
   * Update LinkedIn post
   */
  updatePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().optional(),
        status: z.enum(["draft", "scheduled", "published"]).optional(),
        scheduledFor: z.date().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (input.content !== undefined) {
        updates.push("content = ?");
        params.push(input.content);
      }

      if (input.status !== undefined) {
        updates.push("status = ?");
        params.push(input.status);
      }

      if (input.scheduledFor !== undefined) {
        updates.push("scheduledFor = ?");
        params.push(input.scheduledFor);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

      updates.push("updatedAt = NOW()");
      params.push(input.id);

      const query = `
        UPDATE linkedinPosts
        SET ${updates.join(", ")}
        WHERE id = ?
      `;

      await db.execute(query, params);

      return { success: true };
    }),

  /**
   * Delete LinkedIn post
   */
  deletePost: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const query = `DELETE FROM linkedinPosts WHERE id = ?`;
      await db.execute(query, [input.id]);

      return { success: true };
    }),

  /**
   * Mark post as published
   */
  markAsPublished: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        linkedinUrl: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const query = `
        UPDATE linkedinPosts
        SET status = 'published', publishedAt = NOW(), linkedinUrl = ?, updatedAt = NOW()
        WHERE id = ?
      `;

      await db.execute(query, [input.linkedinUrl, input.id]);

      return { success: true };
    }),

  /**
   * Get LinkedIn post statistics
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
      FROM linkedinPosts
    `;

    const [rows] = await db.execute(query);
    const stats = (rows as any[])[0];

    return {
      total: Number(stats.total) || 0,
      drafts: Number(stats.drafts) || 0,
      scheduled: Number(stats.scheduled) || 0,
      published: Number(stats.published) || 0,
    };
  }),
});
