/**
 * Email Sequence Automation Service
 * Automatically sends follow-up emails based on sector and sequence (0-3-7-14 days)
 */

import { getDb } from '../db';
import { emailCampaigns, emailLogs, leads, scheduledTasks } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export interface SequenceConfig {
  sector: 'educativo' | 'hotelero' | 'residencial';
  sequence: 1 | 2 | 3 | 4;
  delayDays: 0 | 3 | 7 | 14;
}

/**
 * Schedule email sequence for a lead based on their sector
 */
export async function scheduleEmailSequence(
  leadId: number,
  companyId: number,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[EmailSequence] Database not available');
    return;
  }

  try {
    // Get lead details
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) {
      console.error(`[EmailSequence] Lead ${leadId} not found`);
      return;
    }

    // Determine sector from lead industry
    const sector = detectSector(lead.industry || '');
    
    // Get all templates for this sector
    const templates = await db
      .select()
      .from(emailCampaigns)
      .where(
        and(
          eq(emailCampaigns.companyId, companyId),
          eq(emailCampaigns.sector, sector),
          eq(emailCampaigns.active, 1)
        )
      )
      .orderBy(emailCampaigns.sequence);

    if (templates.length === 0) {
      console.warn(`[EmailSequence] No templates found for sector: ${sector}`);
      return;
    }

    // Schedule each email in the sequence
    for (const template of templates) {
      const delayDays = template.delayDays || 0;
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + delayDays);

      await db.insert(scheduledTasks).values({
        companyId,
        taskType: 'send-email',
        taskData: {
          leadId,
          campaignId: template.id,
          emailSubject: template.subject,
          emailBody: template.body,
          sector,
          sequence: template.sequence,
        },
        status: 'pending',
        scheduledFor,
        createdBy: userId,
      });

      console.log(
        `[EmailSequence] Scheduled email ${template.sequence} for lead ${leadId} in ${delayDays} days`
      );
    }
  } catch (error) {
    console.error('[EmailSequence] Error scheduling sequence:', error);
    throw error;
  }
}

/**
 * Execute scheduled email task
 */
export async function executeEmailTask(taskId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Get task details
    const [task] = await db
      .select()
      .from(scheduledTasks)
      .where(eq(scheduledTasks.id, taskId))
      .limit(1);

    if (!task || task.taskType !== 'send-email') {
      return;
    }

    const { leadId, campaignId, emailSubject, emailBody } = task.taskData as any;

    // Get lead email
    const [lead] = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead || !lead.email) {
      throw new Error(`Lead ${leadId} has no email`);
    }

    // Replace variables in template
    const personalizedSubject = replaceVariables(emailSubject, lead);
    const personalizedBody = replaceVariables(emailBody, lead);

    // Send email (this would integrate with Gmail API)
    // For now, just log to emailLogs
    await db.insert(emailLogs).values({
      campaignId,
      leadId,
      companyId: task.companyId,
      userId: task.createdBy,
      to: lead.email,
      subject: personalizedSubject,
      body: personalizedBody,
      status: 'sent',
      sentAt: new Date(),
    });

    // Update task status
    await db
      .update(scheduledTasks)
      .set({
        status: 'completed',
        executedAt: new Date(),
      })
      .where(eq(scheduledTasks.id, taskId));

    console.log(`[EmailSequence] Email sent to ${lead.email}`);
  } catch (error) {
    console.error('[EmailSequence] Error executing email task:', error);
    
    // Update task with error
    await db
      .update(scheduledTasks)
      .set({
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(scheduledTasks.id, taskId));
  }
}

/**
 * Detect sector from industry string
 */
function detectSector(industry: string): 'educativo' | 'hotelero' | 'residencial' {
  const lowerIndustry = industry.toLowerCase();
  
  if (
    lowerIndustry.includes('education') ||
    lowerIndustry.includes('school') ||
    lowerIndustry.includes('university') ||
    lowerIndustry.includes('educativo') ||
    lowerIndustry.includes('escuela')
  ) {
    return 'educativo';
  }
  
  if (
    lowerIndustry.includes('hotel') ||
    lowerIndustry.includes('hospitality') ||
    lowerIndustry.includes('tourism') ||
    lowerIndustry.includes('hotelero') ||
    lowerIndustry.includes('turismo')
  ) {
    return 'hotelero';
  }
  
  // Default to residencial
  return 'residencial';
}

/**
 * Replace template variables with lead data
 */
function replaceVariables(template: string, lead: any): string {
  return template
    .replace(/\{\{leadName\}\}/g, lead.name || 'Cliente')
    .replace(/\{\{company\}\}/g, lead.company || 'su empresa')
    .replace(/\{\{industry\}\}/g, lead.industry || 'su industria')
    .replace(/\{\{title\}\}/g, lead.title || '')
    .replace(/\{\{agentName\}\}/g, 'Equipo EPM Construcciones');
}
