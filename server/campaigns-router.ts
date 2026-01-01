import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { clientLeads, salesCampaigns, uploadedFiles } from "../drizzle/schema";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { eq, desc } from "drizzle-orm";

export const campaignsRouter = router({
  // Upload file with client data
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // base64 encoded
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Upload to S3
      const buffer = Buffer.from(input.fileData, "base64");
      const s3Key = `client-data/${ctx.user.id}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(s3Key, buffer, input.fileType);

      // Save file record
      const [file] = await db.insert(uploadedFiles).values({
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        s3Key,
        s3Url: url,
        uploadedBy: ctx.user.openId,
      });

      return { success: true, fileId: file.insertId, url };
    }),

  // Get uploaded files
  getFiles: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const files = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.uploadedBy, ctx.user.openId))
      .orderBy(desc(uploadedFiles.createdAt));

    return files;
  }),

  // Parse uploaded file and create leads
  parseFile: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get file
      const [file] = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.id, input.fileId));

      if (!file) throw new Error("File not found");

      // Use LLM to extract lead data from file content
      const prompt = `Extract client lead information from the uploaded file. 
      Return a JSON array of leads with fields: companyName, contactName, email, phone, industry, companySize.
      File: ${file.fileName}`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: "You are a data extraction assistant." },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "leads",
            strict: true,
            schema: {
              type: "object",
              properties: {
                leads: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      companyName: { type: "string" },
                      contactName: { type: "string" },
                      email: { type: "string" },
                      phone: { type: "string" },
                      industry: { type: "string" },
                      companySize: { type: "string" },
                    },
                    required: ["companyName"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["leads"],
              additionalProperties: false,
            },
          },
        },
      });

      const data = JSON.parse(response.choices[0].message.content || "{}");
      const leads = data.leads || [];

      // Insert leads
      for (const lead of leads) {
        await db.insert(clientLeads).values({
          ...lead,
          source: file.fileName,
          status: "new",
        });
      }

      // Update file processed count
      await db
        .update(uploadedFiles)
        .set({ processedLeads: leads.length })
        .where(eq(uploadedFiles.id, input.fileId));

      return { success: true, leadsCount: leads.length };
    }),

  // Get client leads
  getLeads: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const leads = await db.select().from(clientLeads).orderBy(desc(clientLeads.createdAt));
    return leads;
  }),

  // Generate campaign with ROPA
  generateCampaign: protectedProcedure
    .input(
      z.object({
        type: z.enum(["email", "phone", "social_media", "multi_channel"]),
        targetAudience: z.string(),
        socialPlatform: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get leads for target audience
      const leads = await db.select().from(clientLeads);

      const prompt = `As ROPA (meta-agent), create a ${input.type} sales campaign for Ivy.AI platform.
      
      Target Audience: ${input.targetAudience}
      ${input.socialPlatform ? `Social Platform: ${input.socialPlatform}` : ""}
      
      Available leads: ${leads.length} companies
      
      Generate:
      1. Campaign name
      2. Campaign content (email copy, call script, or social media post)
      3. Strategy and key messages
      4. Expected metrics and KPIs
      
      Return as JSON with fields: name, content, strategy, metrics`;

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content:
              "You are ROPA, an AI meta-agent specialized in sales campaign management for Ivy.AI.",
          },
          { role: "user", content: prompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "campaign",
            strict: true,
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                content: { type: "string" },
                strategy: { type: "string" },
                metrics: { type: "string" },
              },
              required: ["name", "content", "strategy", "metrics"],
              additionalProperties: false,
            },
          },
        },
      });

      const campaign = JSON.parse(response.choices[0].message.content || "{}");

      // Save campaign
      const [result] = await db.insert(salesCampaigns).values({
        name: campaign.name,
        type: input.type,
        status: "draft",
        targetAudience: input.targetAudience,
        content: campaign.content,
        socialPlatform: input.socialPlatform || null,
        metrics: JSON.stringify({ strategy: campaign.strategy, kpis: campaign.metrics }),
        createdBy: "ROPA",
      });

      return { success: true, campaignId: result.insertId, campaign };
    }),

  // Get campaigns
  getCampaigns: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const campaigns = await db
      .select()
      .from(salesCampaigns)
      .orderBy(desc(salesCampaigns.createdAt));
    return campaigns;
  }),

  // Update campaign status
  updateCampaignStatus: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        status: z.enum(["draft", "active", "paused", "completed"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(salesCampaigns)
        .set({ status: input.status })
        .where(eq(salesCampaigns.id, input.campaignId));

      return { success: true };
    }),
});
