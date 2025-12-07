/**
 * Email Tracking Router - tRPC endpoints for email metrics tracking
 * Tracks opens, clicks, and responses for EPM email campaigns
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";

// ============================================================================
// INPUT VALIDATION SCHEMAS
// ============================================================================

const TrackOpenSchema = z.object({
  emailId: z.number(),
  leadId: z.number().optional(),
});

const TrackClickSchema = z.object({
  emailId: z.number(),
  leadId: z.number().optional(),
  url: z.string(),
  linkIndex: z.number().default(0),
});

const TrackResponseSchema = z.object({
  emailId: z.number(),
  leadId: z.number().optional(),
  responseBody: z.string().optional(),
});

const GetCampaignMetricsSchema = z.object({
  campaignId: z.number(),
});

const GetSectorMetricsSchema = z.object({
  companyId: z.number(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Update email open count
 */
async function recordOpen(emailId: number, leadId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Update email record
    await db.execute(
      `UPDATE emailLogs 
       SET openedAt = COALESCE(openedAt, NOW()),
           updatedAt = NOW()
       WHERE id = ?`,
      [emailId]
    );
    
    // Update lead metadata if leadId provided
    if (leadId) {
      await db.execute(
        `UPDATE leads 
         SET metadata = JSON_SET(
           COALESCE(metadata, '{}'),
           '$.emailOpens',
           COALESCE(JSON_EXTRACT(metadata, '$.emailOpens'), 0) + 1,
           '$.lastEmailOpenedAt',
           NOW()
         ),
         updatedAt = NOW()
         WHERE id = ?`,
        [leadId]
      );
    }
  } catch (error) {
    console.error('[EmailTracking] Error recording open:', error);
  }
}

/**
 * Update email click count
 */
async function recordClick(emailId: number, url: string, leadId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Update email record
    await db.execute(
      `UPDATE emailLogs 
       SET clickedAt = COALESCE(clickedAt, NOW()),
           updatedAt = NOW()
       WHERE id = ?`,
      [emailId]
    );
    
    // Update lead metadata if leadId provided
    if (leadId) {
      await db.execute(
        `UPDATE leads 
         SET metadata = JSON_SET(
           COALESCE(metadata, '{}'),
           '$.emailClicks',
           COALESCE(JSON_EXTRACT(metadata, '$.emailClicks'), 0) + 1,
           '$.lastEmailClickedAt',
           NOW()
         ),
         updatedAt = NOW()
         WHERE id = ?`,
        [leadId]
      );
    }
  } catch (error) {
    console.error('[EmailTracking] Error recording click:', error);
  }
}

/**
 * Update email response count
 */
async function recordResponse(emailId: number, leadId?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  try {
    // Update email record
    await db.execute(
      `UPDATE emailLogs 
       SET respondedAt = COALESCE(respondedAt, NOW()),
           updatedAt = NOW()
       WHERE id = ?`,
      [emailId]
    );
    
    // Update lead metadata and status if leadId provided
    if (leadId) {
      await db.execute(
        `UPDATE leads 
         SET metadata = JSON_SET(
           COALESCE(metadata, '{}'),
           '$.emailResponses',
           COALESCE(JSON_EXTRACT(metadata, '$.emailResponses'), 0) + 1,
           '$.lastEmailRespondedAt',
           NOW()
         ),
         status = CASE 
           WHEN status = 'new' THEN 'contacted'
           ELSE status
         END,
         updatedAt = NOW()
         WHERE id = ?`,
        [leadId]
      );
    }
  } catch (error) {
    console.error('[EmailTracking] Error recording response:', error);
  }
}

// ============================================================================
// ROUTER DEFINITION
// ============================================================================

export const emailTrackingRouter = router({
  /**
   * Track email open event (called by tracking pixel)
   */
  trackOpen: publicProcedure
    .input(TrackOpenSchema)
    .mutation(async ({ input }) => {
      await recordOpen(input.emailId, input.leadId);
      return { success: true };
    }),

  /**
   * Track link click event
   */
  trackClick: publicProcedure
    .input(TrackClickSchema)
    .mutation(async ({ input }) => {
      await recordClick(input.emailId, input.url, input.leadId);
      return { success: true, redirectUrl: input.url };
    }),

  /**
   * Track email response event
   */
  trackResponse: protectedProcedure
    .input(TrackResponseSchema)
    .mutation(async ({ input }) => {
      await recordResponse(input.emailId, input.leadId);
      return { success: true };
    }),

  /**
   * Get metrics for a specific campaign
   */
  getCampaignMetrics: protectedProcedure
    .input(GetCampaignMetricsSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [rows] = await db.execute(
        `SELECT 
          COUNT(*) as totalSent,
          SUM(CASE WHEN openedAt IS NOT NULL THEN 1 ELSE 0 END) as totalOpens,
          SUM(CASE WHEN clickedAt IS NOT NULL THEN 1 ELSE 0 END) as totalClicks,
          SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END) as totalResponses
         FROM emailLogs
         WHERE campaignId = ?`,
        [input.campaignId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          totalResponses: 0,
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
        };
      }
      
      const metrics = rows[0] as any;
      const totalSent = Number(metrics.totalSent) || 0;
      const totalOpens = Number(metrics.totalOpens) || 0;
      const totalClicks = Number(metrics.totalClicks) || 0;
      const totalResponses = Number(metrics.totalResponses) || 0;
      
      return {
        totalSent,
        totalOpens,
        totalClicks,
        totalResponses,
        openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
        responseRate: totalSent > 0 ? (totalResponses / totalSent) * 100 : 0,
      };
    }),

  /**
   * Get metrics breakdown by sector for EPM
   */
  getMetricsBySector: protectedProcedure
    .input(GetSectorMetricsSchema)
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [rows] = await db.execute(
        `SELECT 
          l.industry as sector,
          COUNT(e.id) as totalSent,
          SUM(CASE WHEN e.openedAt IS NOT NULL THEN 1 ELSE 0 END) as totalOpens,
          SUM(CASE WHEN e.clickedAt IS NOT NULL THEN 1 ELSE 0 END) as totalClicks,
          SUM(CASE WHEN e.respondedAt IS NOT NULL THEN 1 ELSE 0 END) as totalResponses
         FROM emailLogs e
         LEFT JOIN leads l ON e.leadId = l.id
         WHERE e.companyId = ?
         GROUP BY l.industry`,
        [input.companyId]
      );
      
      if (!Array.isArray(rows)) return {};
      
      const result: Record<string, any> = {};
      
      for (const row of rows as any[]) {
        const sector = row.sector || 'otro';
        const totalSent = Number(row.totalSent) || 0;
        const totalOpens = Number(row.totalOpens) || 0;
        const totalClicks = Number(row.totalClicks) || 0;
        const totalResponses = Number(row.totalResponses) || 0;
        
        result[sector] = {
          totalSent,
          openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
          clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
          responseRate: totalSent > 0 ? (totalResponses / totalSent) * 100 : 0,
        };
      }
      
      return result;
    }),

  /**
   * Get overall email performance for company
   */
  getOverallMetrics: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [rows] = await db.execute(
        `SELECT 
          COUNT(*) as totalSent,
          SUM(CASE WHEN openedAt IS NOT NULL THEN 1 ELSE 0 END) as totalOpens,
          SUM(CASE WHEN clickedAt IS NOT NULL THEN 1 ELSE 0 END) as totalClicks,
          SUM(CASE WHEN respondedAt IS NOT NULL THEN 1 ELSE 0 END) as totalResponses,
          AVG(CASE 
            WHEN openedAt IS NOT NULL AND sentAt IS NOT NULL 
            THEN TIMESTAMPDIFF(MINUTE, sentAt, openedAt) 
            ELSE NULL 
          END) as avgTimeToOpen
         FROM emailLogs
         WHERE companyId = ?`,
        [input.companyId]
      );
      
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          totalSent: 0,
          totalOpens: 0,
          totalClicks: 0,
          totalResponses: 0,
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
          avgTimeToOpen: 0,
        };
      }
      
      const metrics = rows[0] as any;
      const totalSent = Number(metrics.totalSent) || 0;
      const totalOpens = Number(metrics.totalOpens) || 0;
      const totalClicks = Number(metrics.totalClicks) || 0;
      const totalResponses = Number(metrics.totalResponses) || 0;
      const avgTimeToOpen = Number(metrics.avgTimeToOpen) || 0;
      
      return {
        totalSent,
        totalOpens,
        totalClicks,
        totalResponses,
        openRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
        responseRate: totalSent > 0 ? (totalResponses / totalSent) * 100 : 0,
        avgTimeToOpen: Math.round(avgTimeToOpen),
      };
    }),
});
