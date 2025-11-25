/**
 * Agent Milestone Notification System
 * 
 * Automatically creates notifications when agents reach important milestones:
 * - 50 conversions
 * - 30% conversion rate
 * - ROI > 500%
 * - 100 emails sent
 * - 50% open rate
 */

import { getDb } from "./db";
import { notifications, fagorCampaignEnrollments } from "../drizzle/schema";
import { eq, and, gte, sql } from "drizzle-orm";

interface AgentMilestone {
  agentId: string;
  agentName: string;
  campaignId: string;
  campaignName: string;
  milestoneType: 'conversions' | 'conversion_rate' | 'roi' | 'emails_sent' | 'open_rate';
  value: number;
  threshold: number;
  message: string;
}

const AGENT_CAMPAIGNS = [
  { agentId: 'ivy-prospect', agentName: 'Ivy-Prospect', campaignId: 'cnc-training-2026', campaignName: 'CNC Training 2026' },
  { agentId: 'ivy-closer', agentName: 'Ivy-Closer', campaignId: 'warranty-extension', campaignName: 'Warranty Extension' },
  { agentId: 'ivy-solve', agentName: 'Ivy-Solve', campaignId: 'equipment-repair', campaignName: 'Equipment Repair' },
  { agentId: 'ivy-logic', agentName: 'Ivy-Logic', campaignId: 'eol-parts', campaignName: 'EOL Parts' },
  { agentId: 'ivy-talent', agentName: 'Ivy-Talent', campaignId: 'cnc-upgrades', campaignName: 'CNC Upgrades' },
  { agentId: 'ivy-insight', agentName: 'Ivy-Insight', campaignId: 'digital-suite', campaignName: 'Digital Suite' },
];

const MILESTONES = {
  conversions: [10, 25, 50, 100, 200],
  conversion_rate: [15, 20, 30, 40, 50], // percentages
  roi: [200, 300, 500, 750, 1000], // percentages
  emails_sent: [50, 100, 250, 500, 1000],
  open_rate: [25, 35, 45, 55, 65], // percentages
};

/**
 * Check and create notifications for agent milestones
 */
export async function checkAgentMilestones(): Promise<AgentMilestone[]> {
  const db = await getDb();
  if (!db) {
    console.error('[AgentMilestones] Database not available');
    return [];
  }

  const achievedMilestones: AgentMilestone[] = [];

  for (const agent of AGENT_CAMPAIGNS) {
    try {
      // Get all enrollments for this campaign
      const enrollments = await db
        .select()
        .from(fagorCampaignEnrollments)
        .where(eq(fagorCampaignEnrollments.campaignName, agent.campaignId));

      if (enrollments.length === 0) continue;

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

      const conversions = enrollments.filter(e => e.respondedAt !== null).length;
      const leadsGenerated = enrollments.length;

      const openRate = emailsSent > 0 ? (emailsOpened / emailsSent) * 100 : 0;
      const conversionRate = leadsGenerated > 0 ? (conversions / leadsGenerated) * 100 : 0;

      // Calculate ROI (simplified: $500 per conversion, $50 cost per lead)
      const revenue = conversions * 500;
      const cost = leadsGenerated * 50;
      const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

      // Check each milestone type
      const milestones: AgentMilestone[] = [];

      // Conversions milestone
      for (const threshold of MILESTONES.conversions) {
        if (conversions >= threshold) {
          const alreadyNotified = await hasNotificationBeenSent(
            agent.agentId,
            'conversions',
            threshold
          );

          if (!alreadyNotified) {
            milestones.push({
              agentId: agent.agentId,
              agentName: agent.agentName,
              campaignId: agent.campaignId,
              campaignName: agent.campaignName,
              milestoneType: 'conversions',
              value: conversions,
              threshold,
              message: `🎯 ${agent.agentName} has reached ${conversions} conversions in ${agent.campaignName} campaign!`,
            });
          }
        }
      }

      // Conversion rate milestone
      for (const threshold of MILESTONES.conversion_rate) {
        if (conversionRate >= threshold && leadsGenerated >= 10) { // Minimum 10 leads for meaningful rate
          const alreadyNotified = await hasNotificationBeenSent(
            agent.agentId,
            'conversion_rate',
            threshold
          );

          if (!alreadyNotified) {
            milestones.push({
              agentId: agent.agentId,
              agentName: agent.agentName,
              campaignId: agent.campaignId,
              campaignName: agent.campaignName,
              milestoneType: 'conversion_rate',
              value: Math.round(conversionRate * 10) / 10,
              threshold,
              message: `📈 ${agent.agentName} has achieved ${conversionRate.toFixed(1)}% conversion rate in ${agent.campaignName} campaign!`,
            });
          }
        }
      }

      // ROI milestone
      for (const threshold of MILESTONES.roi) {
        if (roi >= threshold && conversions >= 5) { // Minimum 5 conversions for meaningful ROI
          const alreadyNotified = await hasNotificationBeenSent(
            agent.agentId,
            'roi',
            threshold
          );

          if (!alreadyNotified) {
            milestones.push({
              agentId: agent.agentId,
              agentName: agent.agentName,
              campaignId: agent.campaignId,
              campaignName: agent.campaignName,
              milestoneType: 'roi',
              value: Math.round(roi),
              threshold,
              message: `💰 ${agent.agentName} has achieved ${roi.toFixed(0)}% ROI in ${agent.campaignName} campaign!`,
            });
          }
        }
      }

      // Emails sent milestone
      for (const threshold of MILESTONES.emails_sent) {
        if (emailsSent >= threshold) {
          const alreadyNotified = await hasNotificationBeenSent(
            agent.agentId,
            'emails_sent',
            threshold
          );

          if (!alreadyNotified) {
            milestones.push({
              agentId: agent.agentId,
              agentName: agent.agentName,
              campaignId: agent.campaignId,
              campaignName: agent.campaignName,
              milestoneType: 'emails_sent',
              value: emailsSent,
              threshold,
              message: `📧 ${agent.agentName} has sent ${emailsSent} emails in ${agent.campaignName} campaign!`,
            });
          }
        }
      }

      // Open rate milestone
      for (const threshold of MILESTONES.open_rate) {
        if (openRate >= threshold && emailsSent >= 20) { // Minimum 20 emails for meaningful rate
          const alreadyNotified = await hasNotificationBeenSent(
            agent.agentId,
            'open_rate',
            threshold
          );

          if (!alreadyNotified) {
            milestones.push({
              agentId: agent.agentId,
              agentName: agent.agentName,
              campaignId: agent.campaignId,
              campaignName: agent.campaignName,
              milestoneType: 'open_rate',
              value: Math.round(openRate * 10) / 10,
              threshold,
              message: `✉️ ${agent.agentName} has achieved ${openRate.toFixed(1)}% open rate in ${agent.campaignName} campaign!`,
            });
          }
        }
      }

      // Create notifications for achieved milestones
      for (const milestone of milestones) {
        await createMilestoneNotification(milestone);
        achievedMilestones.push(milestone);
      }
    } catch (error) {
      console.error(`[AgentMilestones] Error checking milestones for ${agent.agentId}:`, error);
    }
  }

  if (achievedMilestones.length > 0) {
    console.log(`[AgentMilestones] Created ${achievedMilestones.length} milestone notifications`);
  }

  return achievedMilestones;
}

/**
 * Check if a notification has already been sent for this milestone
 */
async function hasNotificationBeenSent(
  agentId: string,
  milestoneType: string,
  threshold: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return true; // Assume sent if DB unavailable

  const key = `agent_milestone_${agentId}_${milestoneType}_${threshold}`;

  const existing = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.type, 'agent_milestone'),
        sql`JSON_EXTRACT(${notifications.metadata}, '$.milestoneKey') = ${key}`
      )
    )
    .limit(1);

  return existing.length > 0;
}

/**
 * Create a notification for an achieved milestone
 */
async function createMilestoneNotification(milestone: AgentMilestone): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[AgentMilestones] Database not available for creating notification');
    return;
  }

  const key = `agent_milestone_${milestone.agentId}_${milestone.milestoneType}_${milestone.threshold}`;

  try {
    await db.insert(notifications).values({
      type: 'agent_milestone',
      title: 'Agent Milestone Achieved!',
      message: milestone.message,
      metadata: {
        milestoneKey: key,
        agentId: milestone.agentId,
        agentName: milestone.agentName,
        campaignId: milestone.campaignId,
        campaignName: milestone.campaignName,
        milestoneType: milestone.milestoneType,
        value: milestone.value,
        threshold: milestone.threshold,
      },
      isRead: false,
    });

    console.log(`[AgentMilestones] ✅ Created notification: ${milestone.message}`);
  } catch (error) {
    console.error('[AgentMilestones] Error creating notification:', error);
  }
}

/**
 * Scheduled task to check milestones periodically
 * Call this every hour or after campaign email sends
 */
export async function scheduledMilestoneCheck(): Promise<void> {
  console.log('[AgentMilestones] Running scheduled milestone check...');
  const milestones = await checkAgentMilestones();
  console.log(`[AgentMilestones] Check complete. Found ${milestones.length} new milestones.`);
}
