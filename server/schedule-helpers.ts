import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { scheduledTasks, InsertScheduledTask } from '../drizzle/schema';

/**
 * Schedule a follow-up email to be sent after a delay
 */
export async function scheduleFollowUpEmail({
  companyId,
  leadId,
  callId,
  outcome,
  emailSubject,
  emailBody,
  delayHours = 24,
  createdBy,
}: {
  companyId: number;
  leadId: number;
  callId?: number;
  outcome: string;
  emailSubject: string;
  emailBody: string;
  delayHours?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) {
    console.error('[ScheduleHelpers] Database not available');
    return null;
  }

  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  const taskData: InsertScheduledTask = {
    companyId,
    taskType: 'send-email',
    taskData: {
      leadId,
      callId,
      outcome,
      emailSubject,
      emailBody,
    },
    scheduledFor,
    createdBy,
  };

  try {
    const result = await db.insert(scheduledTasks).values(taskData);
    console.log(`[ScheduleHelpers] Scheduled follow-up email for lead ${leadId} at ${scheduledFor.toISOString()}`);
    return result;
  } catch (error) {
    console.error('[ScheduleHelpers] Failed to schedule email:', error);
    return null;
  }
}

/**
 * Schedule a lead score update
 */
export async function scheduleLeadScoreUpdate({
  companyId,
  leadId,
  scoreChange,
  reason,
  delayHours = 0,
  createdBy,
}: {
  companyId: number;
  leadId: number;
  scoreChange: number;
  reason: string;
  delayHours?: number;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) {
    console.error('[ScheduleHelpers] Database not available');
    return null;
  }

  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  const taskData: InsertScheduledTask = {
    companyId,
    taskType: 'update-lead-score',
    taskData: {
      leadId,
      scoreChange,
      reason,
    },
    scheduledFor,
    createdBy,
  };

  try {
    const result = await db.insert(scheduledTasks).values(taskData);
    console.log(`[ScheduleHelpers] Scheduled score update for lead ${leadId} at ${scheduledFor.toISOString()}`);
    return result;
  } catch (error) {
    console.error('[ScheduleHelpers] Failed to schedule score update:', error);
    return null;
  }
}

/**
 * Cancel a scheduled task
 */
export async function cancelScheduledTask(taskId: number) {
  const db = await getDb();
  if (!db) {
    console.error('[ScheduleHelpers] Database not available');
    return false;
  }

  try {
    await db
      .update(scheduledTasks)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(scheduledTasks.id, taskId));
    
    console.log(`[ScheduleHelpers] Cancelled task ${taskId}`);
    return true;
  } catch (error) {
    console.error('[ScheduleHelpers] Failed to cancel task:', error);
    return false;
  }
}
