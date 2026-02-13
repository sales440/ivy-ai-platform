import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { clientLeads, salesCampaigns, uploadedFiles, ivyClients } from "../drizzle/schema";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { eq, desc } from "drizzle-orm";

// Circuit breaker: track consecutive failures per query
const circuitBreaker: Record<string, { failures: number; pausedUntil: number }> = {};
const MAX_FAILURES = 3;
const PAUSE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function isCircuitOpen(key: string): boolean {
  const cb = circuitBreaker[key];
  if (!cb) return false;
  if (cb.failures >= MAX_FAILURES) {
    if (Date.now() < cb.pausedUntil) return true;
    // Reset after pause period
    cb.failures = 0;
    cb.pausedUntil = 0;
    return false;
  }
  return false;
}

function recordFailure(key: string): void {
  if (!circuitBreaker[key]) {
    circuitBreaker[key] = { failures: 0, pausedUntil: 0 };
  }
  circuitBreaker[key].failures++;
  if (circuitBreaker[key].failures >= MAX_FAILURES) {
    circuitBreaker[key].pausedUntil = Date.now() + PAUSE_DURATION_MS;
    console.log(`[Circuit Breaker] ${key} paused for 5 minutes after ${MAX_FAILURES} consecutive failures`);
  }
}

function recordSuccess(key: string): void {
  if (circuitBreaker[key]) {
    circuitBreaker[key].failures = 0;
    circuitBreaker[key].pausedUntil = 0;
  }
}

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
    if (isCircuitOpen('getFiles')) return [];
    const db = await getDb();
    if (!db) return [];

    try {
      const files = await db
        .select()
        .from(uploadedFiles)
        .where(eq(uploadedFiles.uploadedBy, ctx.user.openId))
        .orderBy(desc(uploadedFiles.createdAt));
      recordSuccess('getFiles');
      return files;
    } catch (error) {
      recordFailure('getFiles');
      return [];
    }
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

      const rawContent = response.choices[0].message.content;
      const contentStr = typeof rawContent === 'string' ? rawContent : "{}";
      const data = JSON.parse(contentStr);
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
    if (isCircuitOpen('getLeads')) return [];
    const db = await getDb();
    if (!db) return [];

    try {
      const leads = await db.select().from(clientLeads).orderBy(desc(clientLeads.createdAt));
      recordSuccess('getLeads');
      return leads;
    } catch (error) {
      recordFailure('getLeads');
      return [];
    }
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

      const campaignContent = response.choices[0].message.content;
      const campaignStr = typeof campaignContent === 'string' ? campaignContent : "{}";
      const campaign = JSON.parse(campaignStr);

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
    if (isCircuitOpen('getCampaigns')) return [];
    const db = await getDb();
    if (!db) return [];

    try {
      const campaigns = await db
        .select()
        .from(salesCampaigns)
        .orderBy(desc(salesCampaigns.createdAt));
      recordSuccess('getCampaigns');
      return campaigns;
    } catch (error) {
      recordFailure('getCampaigns');
      return [];
    }
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

  // Calendar drag-and-drop propagation
  moveCampaign: protectedProcedure
    .input(
      z.object({
        campaignId: z.number(),
        newStartDate: z.string(),
        newStatus: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { propagateCalendarChange } = await import("./ropa-onboarding-engine");
      return propagateCalendarChange(
        input.campaignId,
        new Date(input.newStartDate),
        input.newStatus
      );
    }),

  // Get campaign content (drafts for Monitor approval)
  getCampaignContent: protectedProcedure.query(async () => {
    if (isCircuitOpen('getCampaignContent')) return [];
    const db = await getDb();
    if (!db) return [];
    try {
      const { campaignContent } = await import("../drizzle/schema");
      const result = await db.select().from(campaignContent).orderBy(desc(campaignContent.createdAt));
      recordSuccess('getCampaignContent');
      return result;
    } catch (e) {
      recordFailure('getCampaignContent');
      console.warn('[getCampaignContent] Failed:', (e as any).message);
      return [];
    }
  }),

  // Approve/reject campaign content
  updateContentStatus: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        status: z.enum(["approved", "rejected", "pending"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { campaignContent } = await import("../drizzle/schema");
      await db
        .update(campaignContent)
        .set({ status: input.status })
        .where(eq(campaignContent.id, input.contentId));
      return { success: true };
    }),

  // Get all companies for calendar filter
  getCompanies: protectedProcedure.query(async () => {
    if (isCircuitOpen('getCompanies')) return [];
    const db = await getDb();
    if (!db) return [];
    try {
      const result = await db.select().from(ivyClients).orderBy(desc(ivyClients.createdAt));
      recordSuccess('getCompanies');
      return result;
    } catch (e) {
      recordFailure('getCompanies');
      console.warn('[getCompanies] Failed:', (e as any).message);
      return [];
    }
  }),
});
