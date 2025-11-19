/**
 * ML Scoring Router - tRPC endpoints for predictive lead scoring
 * Integrates with EPM ML scoring engine for IVY-QUALIFY agent
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { calculatePredictiveScore, type LeadFeatures, type ScoringResult } from "../_core/epm-ml-scoring";

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const LeadFeaturesSchema = z.object({
  // Company characteristics
  sector: z.enum(['educativo', 'hotelero', 'residencial', 'otro']),
  companySize: z.enum(['small', 'medium', 'large']),
  installationSize: z.number().min(0),
  budget: z.number().min(0),
  
  // Lead characteristics
  title: z.string(),
  seniorityLevel: z.enum(['entry', 'mid', 'senior', 'executive', 'c-level']),
  decisionMaker: z.boolean(),
  
  // Engagement metrics
  emailOpens: z.number().min(0).default(0),
  emailClicks: z.number().min(0).default(0),
  websiteVisits: z.number().min(0).default(0),
  responseTime: z.number().min(0).default(0), // hours
  
  // Urgency indicators
  hasEmergency: z.boolean().default(false),
  seasonalTiming: z.enum(['high', 'medium', 'low']),
  competitorMentioned: z.boolean().default(false),
  
  // Historical context
  previousCustomer: z.boolean().default(false),
  referralSource: z.enum(['organic', 'referral', 'paid', 'cold']),
});

const BatchScoreSchema = z.object({
  leads: z.array(z.object({
    id: z.number(),
    features: LeadFeaturesSchema
  }))
});

// ============================================================================
// ROUTER DEFINITION
// ============================================================================

export const mlScoringRouter = router({
  /**
   * Calculate predictive score for a single lead
   */
  scoreLeadByFeatures: publicProcedure
    .input(LeadFeaturesSchema)
    .mutation(({ input }): ScoringResult => {
      return calculatePredictiveScore(input as LeadFeatures);
    }),

  /**
   * Calculate predictive score for a lead by ID
   * Extracts features from lead data in database
   */
  scoreLeadById: publicProcedure
    .input(z.object({
      leadId: z.number(),
      companyId: z.number()
    }))
    .query(async ({ input, ctx }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get lead data
      const [leads] = await db.execute(
        `SELECT * FROM leads WHERE id = ? AND companyId = ?`,
        [input.leadId, input.companyId]
      );

      if (!Array.isArray(leads) || leads.length === 0) {
        throw new Error(`Lead ${input.leadId} not found`);
      }

      const lead = leads[0] as any;

      // Extract features from lead data
      const features: LeadFeatures = extractFeaturesFromLead(lead);

      // Calculate score
      const result = calculatePredictiveScore(features);

      return {
        leadId: input.leadId,
        leadName: lead.name,
        company: lead.company,
        ...result
      };
    }),

  /**
   * Batch score multiple leads
   * Useful for IVY-QUALIFY to prioritize a list of leads
   */
  batchScore: publicProcedure
    .input(BatchScoreSchema)
    .mutation(({ input }) => {
      const results = input.leads.map(lead => ({
        leadId: lead.id,
        ...calculatePredictiveScore(lead.features as LeadFeatures)
      }));

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      return {
        total: results.length,
        highPriority: results.filter(r => r.priority === 'critical' || r.priority === 'high').length,
        avgScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
        results
      };
    }),

  /**
   * Get scoring statistics for a company
   * Shows distribution of scores across all leads
   */
  getCompanyStats: publicProcedure
    .input(z.object({
      companyId: z.number()
    }))
    .query(async ({ input }) => {
      const { getDb } = await import("../db");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all leads for company
      const [leads] = await db.execute(
        `SELECT * FROM leads WHERE companyId = ?`,
        [input.companyId]
      );

      if (!Array.isArray(leads) || leads.length === 0) {
        return {
          totalLeads: 0,
          avgScore: 0,
          distribution: { critical: 0, high: 0, medium: 0, low: 0 },
          sectorBreakdown: {}
        };
      }

      // Score all leads
      const scores = leads.map((lead: any) => {
        const features = extractFeaturesFromLead(lead);
        return calculatePredictiveScore(features);
      });

      // Calculate statistics
      const avgScore = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length);
      
      const distribution = {
        critical: scores.filter(s => s.priority === 'critical').length,
        high: scores.filter(s => s.priority === 'high').length,
        medium: scores.filter(s => s.priority === 'medium').length,
        low: scores.filter(s => s.priority === 'low').length
      };

      // Sector breakdown
      const sectorBreakdown: Record<string, { count: number; avgScore: number }> = {};
      leads.forEach((lead: any, index: number) => {
        const sector = extractSectorFromLead(lead);
        if (!sectorBreakdown[sector]) {
          sectorBreakdown[sector] = { count: 0, avgScore: 0 };
        }
        sectorBreakdown[sector].count++;
        sectorBreakdown[sector].avgScore += scores[index].score;
      });

      Object.keys(sectorBreakdown).forEach(sector => {
        sectorBreakdown[sector].avgScore = Math.round(
          sectorBreakdown[sector].avgScore / sectorBreakdown[sector].count
        );
      });

      return {
        totalLeads: leads.length,
        avgScore,
        distribution,
        sectorBreakdown
      };
    }),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract scoring features from lead database record
 */
function extractFeaturesFromLead(lead: any): LeadFeatures {
  // Parse metadata if it exists
  const metadata = typeof lead.metadata === 'string' 
    ? JSON.parse(lead.metadata) 
    : (lead.metadata || {});

  // Determine sector from industry or metadata
  const sector = extractSectorFromLead(lead);

  // Determine company size from metadata or default
  const companySize = metadata.companySize || 'medium';

  // Determine installation size (default based on sector)
  const installationSize = metadata.installationSize || getDefaultInstallationSize(sector);

  // Determine budget (from metadata or estimate from sector)
  const budget = metadata.budget || getDefaultBudget(sector);

  // Determine seniority from title
  const seniorityLevel = extractSeniorityFromTitle(lead.title || '');

  // Determine if decision maker
  const decisionMaker = metadata.decisionMaker || isLikelyDecisionMaker(lead.title || '');

  // Get engagement metrics from metadata
  const emailOpens = metadata.emailOpens || 0;
  const emailClicks = metadata.emailClicks || 0;
  const websiteVisits = metadata.websiteVisits || 0;
  const responseTime = metadata.responseTime || 0;

  // Determine urgency
  const hasEmergency = lead.priority === 'urgent' || metadata.hasEmergency || false;
  const seasonalTiming = getCurrentSeasonalTiming(sector);
  const competitorMentioned = metadata.competitorMentioned || false;

  // Historical context
  const previousCustomer = metadata.previousCustomer || false;
  const referralSource = metadata.referralSource || 'cold';

  return {
    sector,
    companySize,
    installationSize,
    budget,
    title: lead.title || '',
    seniorityLevel,
    decisionMaker,
    emailOpens,
    emailClicks,
    websiteVisits,
    responseTime,
    hasEmergency,
    seasonalTiming,
    competitorMentioned,
    previousCustomer,
    referralSource
  };
}

function extractSectorFromLead(lead: any): 'educativo' | 'hotelero' | 'residencial' | 'otro' {
  const industry = (lead.industry || '').toLowerCase();
  const company = (lead.company || '').toLowerCase();
  
  if (industry.includes('educ') || company.includes('escuela') || company.includes('colegio') || company.includes('universidad')) {
    return 'educativo';
  }
  if (industry.includes('hotel') || industry.includes('hospedaje') || company.includes('hotel')) {
    return 'hotelero';
  }
  if (industry.includes('residencial') || industry.includes('condominio') || company.includes('residencial')) {
    return 'residencial';
  }
  return 'otro';
}

function extractSeniorityFromTitle(title: string): 'entry' | 'mid' | 'senior' | 'executive' | 'c-level' {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('ceo') || titleLower.includes('cfo') || titleLower.includes('coo') || titleLower.includes('director general')) {
    return 'c-level';
  }
  if (titleLower.includes('director') || titleLower.includes('vp') || titleLower.includes('vicepresidente')) {
    return 'executive';
  }
  if (titleLower.includes('senior') || titleLower.includes('jefe') || titleLower.includes('gerente')) {
    return 'senior';
  }
  if (titleLower.includes('manager') || titleLower.includes('coordinador') || titleLower.includes('encargado')) {
    return 'mid';
  }
  return 'entry';
}

function isLikelyDecisionMaker(title: string): boolean {
  const titleLower = title.toLowerCase();
  const decisionTitles = ['director', 'ceo', 'cfo', 'coo', 'gerente', 'jefe', 'owner', 'propietario'];
  return decisionTitles.some(t => titleLower.includes(t));
}

function getDefaultInstallationSize(sector: string): number {
  const defaults = {
    educativo: 5000,  // 5,000 m² (typical school)
    hotelero: 3000,   // 3,000 m² (medium hotel)
    residencial: 8000, // 8,000 m² (residential complex)
    otro: 2000
  };
  return defaults[sector as keyof typeof defaults] || 2000;
}

function getDefaultBudget(sector: string): number {
  const defaults = {
    educativo: 45000,  // MXN
    hotelero: 80000,
    residencial: 50000,
    otro: 35000
  };
  return defaults[sector as keyof typeof defaults] || 35000;
}

function getCurrentSeasonalTiming(sector: string): 'high' | 'medium' | 'low' {
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  const seasonality = {
    educativo: {
      high: [1, 2, 7, 8],
      medium: [3, 4, 9, 10],
      low: [5, 6, 11, 12]
    },
    hotelero: {
      high: [11, 12, 3, 4],
      medium: [6, 7, 8],
      low: [1, 2, 5, 9, 10]
    },
    residencial: {
      high: [4, 5, 10, 11],
      medium: [1, 2, 3, 9],
      low: [6, 7, 8, 12]
    },
    otro: {
      high: [],
      medium: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      low: []
    }
  };

  const sectorSeasonality = seasonality[sector as keyof typeof seasonality] || seasonality.otro;
  
  if (sectorSeasonality.high.includes(currentMonth)) return 'high';
  if (sectorSeasonality.low.includes(currentMonth)) return 'low';
  return 'medium';
}
