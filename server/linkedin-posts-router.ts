import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";
import { publishToLinkedInViaZapier } from "./services/zapier-linkedin";

/**
 * LinkedIn Posts Router
 * Handles LinkedIn content generation and management
 */

export const linkedInPostsRouter = router({
  /**
   * List all LinkedIn posts
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["pending", "scheduled", "published", "all"]).default("all"),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      let query = `
        SELECT 
          id,
          content,
          status,
          scheduledFor,
          publishedAt,
          postType,
          metadata,
          createdAt
        FROM linkedinPosts
      `;

      const params: any[] = [];

      if (input.status !== "all") {
        query += ` WHERE status = ?`;
        params.push(input.status);
      }

      query += ` ORDER BY createdAt DESC LIMIT ?`;
      params.push(input.limit);

      const result = await db.execute(query, params);
      const rows = result[0] as any[];

      return rows.map((row: any) => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    }),

  /**
   * Generate a new LinkedIn post using LLM
   */
  generate: protectedProcedure
    .input(
      z.object({
        postType: z.enum([
          "thought_leadership",
          "case_study",
          "product_update",
          "industry_insight",
          "customer_success",
        ]),
        topic: z.string().optional(),
        tone: z.enum(["professional", "casual", "inspirational"]).default("professional"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Generate content using LLM
      const systemPrompt = `Eres un experto en marketing B2B y creación de contenido para LinkedIn. Tu tarea es generar posts profesionales y atractivos para Ivy.AI, una plataforma de agentes de IA para automatización empresarial.

Contexto de Ivy.AI:
- Plataforma de agentes de IA especializados (ventas, soporte, marketing, operaciones)
- Email unificado: sales@ivybai.com
- Dirigido a empresas B2B que buscan automatizar procesos
- Casos de uso: generación de leads, calificación automática, soporte 24/7, análisis predictivo

Genera un post de LinkedIn que:
1. Sea conciso (máximo 1300 caracteres)
2. Incluya un hook atractivo en las primeras 2 líneas
3. Use emojis estratégicamente (2-3 máximo)
4. Incluya un call-to-action claro al final
5. Sea relevante para tomadores de decisiones B2B
6. Refleje el tono: ${input.tone}

Tipo de post solicitado: ${input.postType}
${input.topic ? `Tema específico: ${input.topic}` : ""}

Responde SOLO con el texto del post, sin comillas ni formato adicional.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Genera un post de LinkedIn tipo "${input.postType}" ${input.topic ? `sobre "${input.topic}"` : ""} con tono ${input.tone}.`,
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "";

      // Save to database
      const insertQuery = `
        INSERT INTO linkedinPosts (content, status, postType, metadata, createdAt)
        VALUES (?, 'pending', ?, ?, NOW())
      `;

      const metadata = JSON.stringify({
        tone: input.tone,
        topic: input.topic || null,
        generatedBy: "Ivy-Content",
        generatedAt: new Date().toISOString(),
      });

      const result = await db.execute(insertQuery, [content, input.postType, metadata]);
      const insertId = (result[0] as any).insertId;

      return {
        id: insertId,
        content,
        status: "pending",
        postType: input.postType,
        metadata: JSON.parse(metadata),
      };
    }),

  /**
   * Update a LinkedIn post
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().optional(),
        status: z.enum(["pending", "scheduled", "published"]).optional(),
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

        // If status is "published", set publishedAt
        if (input.status === "published") {
          updates.push("publishedAt = NOW()");
        }
      }

      if (input.scheduledFor !== undefined) {
        updates.push("scheduledFor = ?");
        params.push(input.scheduledFor);
      }

      if (updates.length === 0) {
        throw new Error("No fields to update");
      }

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
   * Delete a LinkedIn post
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db.execute("DELETE FROM linkedinPosts WHERE id = ?", [input.id]);

      return { success: true };
    }),

  /**
   * Publish a LinkedIn post
   */
  publish: protectedProcedure
    .input(z.object({ postId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get post from database
      const query = `SELECT * FROM linkedInPosts WHERE id = ? LIMIT 1`;
      const result = await db.execute(query, [input.postId]);
      const rows = result[0] as any[];

      if (rows.length === 0) {
        throw new Error("Post not found");
      }

      const post = rows[0];

      // Get Zapier webhook URL from environment
      const zapierWebhookUrl = process.env.ZAPIER_LINKEDIN_WEBHOOK_URL;
      
      if (!zapierWebhookUrl) {
        throw new Error("ZAPIER_LINKEDIN_WEBHOOK_URL not configured. Please add it in Settings → Secrets.");
      }

      // Publish to LinkedIn via Zapier
      const publishResult = await publishToLinkedInViaZapier(zapierWebhookUrl, {
        content: post.content,
        postId: input.postId,
        postType: post.postType,
        author: "Juan Carlos Robledo",
      });

      if (!publishResult.success) {
        // Update post status to failed
        await db.execute(
          `UPDATE linkedInPosts SET status = 'failed', error = ?, updatedAt = NOW() WHERE id = ?`,
          [publishResult.error, input.postId]
        );

        throw new Error(publishResult.error || "Failed to publish post");
      }

      // Update post status to published
      await db.execute(
        `UPDATE linkedInPosts 
         SET status = 'published', 
             publishedAt = NOW(), 
             linkedInPostId = ?, 
             publishedUrl = ?,
             updatedAt = NOW() 
         WHERE id = ?`,
        [publishResult.linkedInPostId, publishResult.publishedUrl, input.postId]
      );

      return {
        success: true,
        postId: publishResult.linkedInPostId,
        postUrl: publishResult.publishedUrl,
      };
    }),

  /**
   * Get statistics about LinkedIn posts
   */
  getStats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const query = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published
      FROM linkedinPosts
    `;

    const result = await db.execute(query);
    const rows = result[0] as any[];
    const stats = rows[0];

    return {
      total: Number(stats.total) || 0,
      pending: Number(stats.pending) || 0,
      scheduled: Number(stats.scheduled) || 0,
      published: Number(stats.published) || 0,
    };
  }),
});
