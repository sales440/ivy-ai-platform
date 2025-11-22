import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { marketingLeads, leadActivities, InsertMarketingLead, InsertLeadActivity, leads } from "../drizzle/schema";
import { autoAssignLead } from "./lead-assignment";
import { eq, desc } from "drizzle-orm";

/**
 * Marketing Router - Handles lead capture, scoring, and nurturing
 * Core of the AI-Native marketing campaign
 */

/**
 * Lead Scoring Algorithm
 * Calculates a 0-100 score based on multiple factors
 */
function calculateLeadScore(lead: {
  source: string;
  role?: string | null;
  numSDRs?: string | null;
  timeline?: string | null;
  company?: string | null;
  challenges?: string | null;
}): number {
  let score = 0;

  // Source weight (max 20 points)
  const sourceScores: Record<string, number> = {
    "demo-request": 20,  // Highest intent
    "calculator": 15,    // High intent (actively calculating ROI)
    "whitepaper": 10,    // Medium intent (educating themselves)
    "linkedin": 8,
    "seo": 5,
    "referral": 12,
  };
  score += sourceScores[lead.source] || 0;

  // Role weight (max 25 points)
  if (lead.role) {
    const roleStr = lead.role.toLowerCase();
    if (roleStr.includes("vp") || roleStr.includes("vice president") || roleStr.includes("director")) {
      score += 25; // Decision maker
    } else if (roleStr.includes("head") || roleStr.includes("manager")) {
      score += 20; // Influencer
    } else if (roleStr.includes("ceo") || roleStr.includes("cto") || roleStr.includes("cfo")) {
      score += 25; // C-level
    } else {
      score += 10; // Individual contributor
    }
  }

  // Team size weight (max 30 points)
  if (lead.numSDRs) {
    const numSDRsStr = lead.numSDRs.toLowerCase();
    if (numSDRsStr.includes("20+")) {
      score += 30; // Large team = high value
    } else if (numSDRsStr.includes("11-20")) {
      score += 25;
    } else if (numSDRsStr.includes("6-10")) {
      score += 20;
    } else if (numSDRsStr.includes("3-5")) {
      score += 15;
    } else if (numSDRsStr.includes("1-2")) {
      score += 10;
    } else if (numSDRsStr.includes("0") || numSDRsStr.includes("no tenemos")) {
      score += 5; // Greenfield opportunity
    }
  }

  // Timeline weight (max 15 points)
  if (lead.timeline) {
    const timelineStr = lead.timeline.toLowerCase();
    if (timelineStr.includes("immediate") || timelineStr.includes("inmediato")) {
      score += 15; // Ready to buy
    } else if (timelineStr.includes("1 month") || timelineStr.includes("1 mes")) {
      score += 12;
    } else if (timelineStr.includes("1-3 months") || timelineStr.includes("1-3 meses")) {
      score += 10;
    } else if (timelineStr.includes("3-6 months") || timelineStr.includes("3-6 meses")) {
      score += 7;
    } else {
      score += 3; // Just exploring
    }
  }

  // Company presence (max 5 points)
  if (lead.company && lead.company.trim().length > 0) {
    score += 5;
  }

  // Challenges articulated (max 5 points)
  if (lead.challenges && lead.challenges.trim().length > 20) {
    score += 5; // They took time to explain their pain points
  }

  return Math.min(score, 100); // Cap at 100
}

/**
 * Determine lead stage based on source and score
 */
function determineLeadStage(source: string, score: number): "awareness" | "consideration" | "decision" | "qualified" {
  if (score >= 70) return "qualified";
  if (source === "demo-request") return "decision";
  if (source === "calculator") return "consideration";
  return "awareness";
}

export const marketingRouter = router({
  /**
   * Get marketing analytics overview
   */
  getAnalytics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    // Get marketing leads (whitepaper, calculator, demo-request)
    const marketingSources = ["whitepaper", "calculator", "demo-request"];
    const allLeads = await db.select().from(leads);
    const totalLeads = allLeads.filter(l => l.source && marketingSources.includes(l.source));

    // Calculate metrics by source
    const leadsBySource = totalLeads.reduce((acc, lead) => {
      if (lead.source) {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Calculate metrics by stage (from metadata)
    const leadsByStage = totalLeads.reduce((acc, lead) => {
      const stage = (lead.metadata as any)?.leadStage || "awareness";
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average lead score
    const avgLeadScore = totalLeads.length > 0
      ? totalLeads.reduce((sum, lead) => sum + (lead.qualificationScore || 0), 0) / totalLeads.length
      : 0;

    // Calculate conversion rates
    const qualifiedLeads = totalLeads.filter(l => (l.qualificationScore || 0) >= 70).length;
    const conversionRate = totalLeads.length > 0
      ? (qualifiedLeads / totalLeads.length) * 100
      : 0;

    return {
      totalLeads: totalLeads.length,
      leadsBySource,
      leadsByStage,
      avgLeadScore: Math.round(avgLeadScore),
      qualifiedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
    };
  }),

  /**
   * Get A/B test variants for a page
   */
  getABTestVariants: publicProcedure
    .input(z.object({ page: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db.execute(
        `SELECT * FROM abTestVariants WHERE page = ? AND isActive = TRUE`,
        [input.page]
      );
      return results.rows as any[];
    }),

  /**
   * Track A/B test event (view, click, conversion)
   */
  trackABTestEvent: publicProcedure
    .input(
      z.object({
        variantId: z.number(),
        eventType: z.enum(["view", "click", "conversion"]),
        sessionId: z.string(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db.execute(
        `INSERT INTO abTestResults (variantId, eventType, sessionId, metadata) VALUES (?, ?, ?, ?)`,
        [input.variantId, input.eventType, input.sessionId, JSON.stringify(input.metadata || {})]
      );

      return { success: true };
    }),

  /**
   * Get A/B test results summary
   */
  getABTestResults: publicProcedure
    .input(z.object({ testName: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const results = await db.execute(
        `SELECT 
          v.id,
          v.variantName,
          v.isControl,
          COUNT(CASE WHEN r.eventType = 'view' THEN 1 END) as views,
          COUNT(CASE WHEN r.eventType = 'click' THEN 1 END) as clicks,
          COUNT(CASE WHEN r.eventType = 'conversion' THEN 1 END) as conversions,
          ROUND(COUNT(CASE WHEN r.eventType = 'click' THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN r.eventType = 'view' THEN 1 END), 0), 2) as ctr,
          ROUND(COUNT(CASE WHEN r.eventType = 'conversion' THEN 1 END) * 100.0 / NULLIF(COUNT(CASE WHEN r.eventType = 'view' THEN 1 END), 0), 2) as conversionRate
        FROM abTestVariants v
        LEFT JOIN abTestResults r ON v.id = r.variantId
        WHERE v.testName = ?
        GROUP BY v.id, v.variantName, v.isControl
        ORDER BY v.isControl DESC, v.id ASC`,
        [input.testName]
      );
      return results.rows as any[];
    }),

  /**
   * Capture lead from whitepaper download
   */
  captureWhitepaperLead: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().optional(),
        role: z.string().optional(),
        numSDRs: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const leadScore = calculateLeadScore({
        source: "whitepaper",
        role: input.role,
        numSDRs: input.numSDRs,
        company: input.company,
      });

      const stage = determineLeadStage("whitepaper", leadScore);

      // Generate unique leadId
      const leadId = `WP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insert into unified leads table
      const leadData = {
        leadId,
        name: input.name,
        email: input.email,
        company: input.company || null,
        title: input.role || null,
        source: "whitepaper",
        qualificationScore: leadScore,
        qualificationLevel: leadScore >= 70 ? "A" as const : leadScore >= 50 ? "B" as const : leadScore >= 30 ? "C" as const : "D" as const,
        status: "new" as const,
        metadata: {
          marketingSource: "whitepaper",
          numSDRs: input.numSDRs,
          leadStage: stage,
          capturedAt: new Date().toISOString(),
        },
      };

      const [lead] = await db.insert(leads).values(leadData).$returningId();

      // Log activity in leadActivities
      const activityData: InsertLeadActivity = {
        leadId: lead.id,
        activityType: "whitepaper-downloaded",
        description: `Downloaded whitepaper: El Costo Oculto de la Fuerza de Ventas Humana`,
      };
      await db.insert(leadActivities).values(activityData);

      // Auto-assign if qualified (score >= 70)
      let assignmentResult = null;
      if (leadScore >= 70) {
        assignmentResult = await autoAssignLead(lead.id, leadScore);
      }

      // TODO: Trigger email sequence based on lead score
      // High score (70+): Immediate outreach by AI agent
      // Medium score (40-69): Nurture sequence
      // Low score (<40): Educational content sequence

      return {
        success: true,
        leadId: lead.id,
        leadScore,
        stage,
        assigned: assignmentResult?.success || false,
        assignedTo: assignmentResult?.agentName,
      };
    }),

  /**
   * Request personalized demo
   */
  requestDemo: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        company: z.string().min(1),
        role: z.string().min(1),
        phone: z.string().optional(),
        numSDRs: z.string(),
        timeline: z.string(),
        challenges: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const leadScore = calculateLeadScore({
        source: "demo-request",
        role: input.role,
        numSDRs: input.numSDRs,
        timeline: input.timeline,
        company: input.company,
        challenges: input.challenges,
      });

      const stage = determineLeadStage("demo-request", leadScore);

      // Generate unique leadId
      const leadId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Insert into unified leads table
      const leadData = {
        leadId,
        name: input.name,
        email: input.email,
        company: input.company,
        title: input.role,
        source: "demo-request",
        qualificationScore: leadScore,
        qualificationLevel: leadScore >= 70 ? "A" as const : leadScore >= 50 ? "B" as const : leadScore >= 30 ? "C" as const : "D" as const,
        status: leadScore >= 70 ? "qualified" as const : "new" as const,
        metadata: {
          marketingSource: "demo-request",
          phone: input.phone,
          numSDRs: input.numSDRs,
          timeline: input.timeline,
          challenges: input.challenges,
          leadStage: stage,
          capturedAt: new Date().toISOString(),
        },
      };

      const [lead] = await db.insert(leads).values(leadData).$returningId();

      // Log activity
      const activityData: InsertLeadActivity = {
        leadId: lead.id,
        activityType: "demo-scheduled",
        description: `Requested demo - Timeline: ${input.timeline}, Team size: ${input.numSDRs}`,
        metadata: {
          timeline: input.timeline,
          numSDRs: input.numSDRs,
          challenges: input.challenges,
        },
      };
      await db.insert(leadActivities).values(activityData);

      // Auto-assign if qualified (score >= 70)
      let assignmentResult = null;
      if (leadScore >= 70) {
        assignmentResult = await autoAssignLead(lead.id, leadScore);
      }

      // TODO: Schedule automated follow-up by AI agent within 24 hours

      return {
        success: true,
        leadId: lead.id,
        leadScore,
        stage,
        isHighPriority: leadScore >= 70,
        assigned: assignmentResult?.success || false,
        assignedTo: assignmentResult?.agentName,
      };
    }),

  /**
   * Track calculator usage (for lead scoring)
   */
  trackCalculatorUsage: publicProcedure
    .input(
      z.object({
        email: z.string().email().optional(),
        numSDRs: z.number(),
        avgSalary: z.number(),
        annualSavings: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { success: true, message: "Tracked anonymously" };

      // If email provided, try to find existing lead or create new one
      if (input.email) {
        const existingLeads = await db
          .select()
          .from(leads)
          .where(eq(leads.email, input.email))
          .limit(1);

        if (existingLeads.length > 0) {
          // Update existing lead score
          const lead = existingLeads[0];
          const newScore = Math.min((lead.qualificationScore || 0) + 10, 100); // Boost score for calculator usage

          await db
            .update(leads)
            .set({
              qualificationScore: newScore,
              qualificationLevel: newScore >= 70 ? "A" as const : newScore >= 50 ? "B" as const : newScore >= 30 ? "C" as const : "D" as const,
              updatedAt: new Date(),
            })
            .where(eq(leads.id, lead.id));

          // Log activity
          const activityData: InsertLeadActivity = {
            leadId: lead.id,
            activityType: "calculator-used",
            description: `Used ROI calculator - Potential savings: $${input.annualSavings.toLocaleString()}`,
            metadata: {
              numSDRs: input.numSDRs,
              avgSalary: input.avgSalary,
              annualSavings: input.annualSavings,
            },
          };
          await db.insert(leadActivities).values(activityData);

          return {
            success: true,
            leadId: lead.id,
            newScore,
          };
        }
      }

      return { success: true, message: "Calculator usage tracked" };
    }),

  /**
   * Get all marketing leads (for internal dashboard)
   */
  getAllLeads: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const leads = await db
      .select()
      .from(marketingLeads)
      .orderBy(desc(marketingLeads.createdAt))
      .limit(100);

    return leads;
  }),

  /**
   * Get lead activities
   */
  getLeadActivities: publicProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const activities = await db
        .select()
        .from(leadActivities)
        .where(eq(leadActivities.leadId, input.leadId))
        .orderBy(desc(leadActivities.createdAt));

      return activities;
    }),
});
