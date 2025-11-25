/**
 * FAGOR Agents Metrics Router
 * 
 * Provides detailed performance metrics for each AI agent managing FAGOR campaigns
 */

import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { fagorCampaignEnrollments, fagorEmailEvents, fagorContacts } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

export const fagorAgentsMetricsRouter = router({
  /**
   * Get performance metrics for all agents or a specific agent
   */
  getAgentMetrics: publicProcedure
    .input(
      z.object({
        dateRange: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
        agentId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Calculate date filter
      let dateFilter: Date | null = null;
      if (input.dateRange !== 'all') {
        const days = parseInt(input.dateRange);
        dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate() - days);
      }

      // Define agent-campaign mapping
      const agentCampaigns = [
        { agentId: 'ivy-prospect', agentName: 'Ivy-Prospect', department: 'Sales', campaignId: 'cnc-training-2026', campaignName: 'CNC Training 2026' },
        { agentId: 'ivy-closer', agentName: 'Ivy-Closer', department: 'Sales', campaignId: 'warranty-extension', campaignName: 'Warranty Extension' },
        { agentId: 'ivy-solve', agentName: 'Ivy-Solve', department: 'Support', campaignId: 'equipment-repair', campaignName: 'Equipment Repair' },
        { agentId: 'ivy-logic', agentName: 'Ivy-Logic', department: 'Operations', campaignId: 'eol-parts', campaignName: 'EOL Parts' },
        { agentId: 'ivy-talent', agentName: 'Ivy-Talent', department: 'HR', campaignId: 'cnc-upgrades', campaignName: 'CNC Upgrades' },
        { agentId: 'ivy-insight', agentName: 'Ivy-Insight', department: 'Strategy', campaignId: 'digital-suite', campaignName: 'Digital Suite' },
      ];

      // Filter by specific agent if provided
      const filteredAgents = input.agentId
        ? agentCampaigns.filter(a => a.agentId === input.agentId)
        : agentCampaigns;

      const agentMetrics = [];

      for (const agent of filteredAgents) {
        // Get all enrollments for this campaign
        const enrollmentsQuery = dateFilter
          ? db.select().from(fagorCampaignEnrollments)
              .where(
                and(
                  eq(fagorCampaignEnrollments.campaignId, agent.campaignId),
                  gte(fagorCampaignEnrollments.enrolledAt, dateFilter)
                )
              )
          : db.select().from(fagorCampaignEnrollments)
              .where(eq(fagorCampaignEnrollments.campaignId, agent.campaignId));

        const enrollments = await enrollmentsQuery;

        // Calculate metrics
        const emailsSent = enrollments.reduce((sum, e) => {
          let count = 0;
          if (e.email1SentAt) count++;
          if (e.email2SentAt) count++;
          if (e.email3SentAt) count++;
          return sum + count;
        }, 0);

        const emailsOpened = enrollments.reduce((sum, e) => {
          let count = 0;
          if (e.email1OpenedAt) count++;
          if (e.email2OpenedAt) count++;
          if (e.email3OpenedAt) count++;
          return sum + count;
        }, 0);

        const emailsClicked = enrollments.reduce((sum, e) => {
          let count = 0;
          if (e.email1ClickedAt) count++;
          if (e.email2ClickedAt) count++;
          if (e.email3ClickedAt) count++;
          return sum + count;
        }, 0);

        const conversions = enrollments.filter(e => e.respondedAt !== null).length;
        const leadsGenerated = enrollments.length;

        const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
        const clickRate = emailsSent > 0 ? (emailsClicked / emailsSent) * 100 : 0;
        const conversionRate = leadsGenerated > 0 ? (conversions / leadsGenerated) * 100 : 0;

        // Calculate average response time (hours from first email to response)
        const respondedEnrollments = enrollments.filter(e => e.respondedAt && e.email1SentAt);
        const avgResponseTime = respondedEnrollments.length > 0
          ? respondedEnrollments.reduce((sum, e) => {
              const hours = (e.respondedAt!.getTime() - e.email1SentAt!.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }, 0) / respondedEnrollments.length
          : 0;

        // Calculate ROI (simplified: assume $500 value per conversion, $50 cost per campaign)
        const revenue = conversions * 500;
        const cost = leadsGenerated * 50;
        const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

        agentMetrics.push({
          agentId: agent.agentId,
          agentName: agent.agentName,
          department: agent.department,
          campaignName: agent.campaignName,
          emailsSent,
          emailsOpened,
          emailsClicked,
          leadsGenerated,
          conversions,
          conversionRate: Math.round(conversionRate * 10) / 10,
          openRate: Math.round(openRate * 10) / 10,
          clickRate: Math.round(clickRate * 10) / 10,
          avgResponseTime: Math.round(avgResponseTime * 10) / 10,
          roi: Math.round(roi),
        });
      }

      // Calculate totals
      const totals = {
        emailsSent: agentMetrics.reduce((sum, m) => sum + m.emailsSent, 0),
        emailsOpened: agentMetrics.reduce((sum, m) => sum + m.emailsOpened, 0),
        emailsClicked: agentMetrics.reduce((sum, m) => sum + m.emailsClicked, 0),
        leadsGenerated: agentMetrics.reduce((sum, m) => sum + m.leadsGenerated, 0),
        conversions: agentMetrics.reduce((sum, m) => sum + m.conversions, 0),
        avgConversionRate: agentMetrics.length > 0
          ? agentMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / agentMetrics.length
          : 0,
        avgOpenRate: agentMetrics.length > 0
          ? agentMetrics.reduce((sum, m) => sum + m.openRate, 0) / agentMetrics.length
          : 0,
        avgClickRate: agentMetrics.length > 0
          ? agentMetrics.reduce((sum, m) => sum + m.clickRate, 0) / agentMetrics.length
          : 0,
        totalROI: agentMetrics.length > 0
          ? agentMetrics.reduce((sum, m) => sum + m.roi, 0) / agentMetrics.length
          : 0,
      };

      return {
        agents: agentMetrics,
        totals: {
          ...totals,
          avgConversionRate: Math.round(totals.avgConversionRate * 10) / 10,
          avgOpenRate: Math.round(totals.avgOpenRate * 10) / 10,
          avgClickRate: Math.round(totals.avgClickRate * 10) / 10,
          totalROI: Math.round(totals.totalROI),
        },
      };
    }),

  /**
   * Get detailed activity log for a specific agent
   */
  getAgentActivity: publicProcedure
    .input(
      z.object({
        agentId: z.string(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Map agent to campaign
      const campaignMap: Record<string, string> = {
        'ivy-prospect': 'cnc-training-2026',
        'ivy-closer': 'warranty-extension',
        'ivy-solve': 'equipment-repair',
        'ivy-logic': 'eol-parts',
        'ivy-talent': 'cnc-upgrades',
        'ivy-insight': 'digital-suite',
      };

      const campaignId = campaignMap[input.agentId];
      if (!campaignId) {
        return { activities: [] };
      }

      // Get recent enrollments and events
      const enrollments = await db
        .select()
        .from(fagorCampaignEnrollments)
        .where(eq(fagorCampaignEnrollments.campaignId, campaignId))
        .orderBy(sql`${fagorCampaignEnrollments.enrolledAt} DESC`)
        .limit(input.limit);

      const activities = [];

      for (const enrollment of enrollments) {
        // Get contact info
        const [contact] = await db
          .select()
          .from(fagorContacts)
          .where(eq(fagorContacts.id, enrollment.contactId))
          .limit(1);

        if (!contact) continue;

        // Get events for this enrollment
        const events = await db
          .select()
          .from(fagorEmailEvents)
          .where(eq(fagorEmailEvents.enrollmentId, enrollment.id))
          .orderBy(sql`${fagorEmailEvents.eventAt} DESC`)
          .limit(10);

        activities.push({
          enrollmentId: enrollment.id,
          contactName: contact.name,
          contactEmail: contact.email,
          contactCompany: contact.company,
          status: enrollment.status,
          currentStep: enrollment.currentStep,
          enrolledAt: enrollment.enrolledAt,
          respondedAt: enrollment.respondedAt,
          events: events.map(e => ({
            type: e.eventType,
            emailNumber: e.emailNumber,
            eventAt: e.eventAt,
            clickedUrl: e.clickedUrl,
          })),
        });
      }

      return { activities };
    }),
});
