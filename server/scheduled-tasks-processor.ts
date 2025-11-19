import { and, eq, lte } from 'drizzle-orm';
import { getDb } from './db';
import { scheduledTasks } from '../drizzle/schema';
import { sendEmail } from './_core/email';

/**
 * Process pending scheduled tasks that are due for execution
 */
export async function processScheduledTasks() {
  const db = await getDb();
  if (!db) {
    console.error('[ScheduledTasks] Database not available');
    return;
  }

  const now = new Date();
  
  try {
    // Get all pending tasks that are due
    const dueTasks = await db
      .select()
      .from(scheduledTasks)
      .where(
        and(
          eq(scheduledTasks.status, 'pending'),
          lte(scheduledTasks.scheduledFor, now)
        )
      )
      .limit(50); // Process max 50 tasks per run

    console.log(`[ScheduledTasks] Found ${dueTasks.length} tasks to process`);

    for (const task of dueTasks) {
      try {
        // Mark as processing
        await db
          .update(scheduledTasks)
          .set({ status: 'processing', updatedAt: now })
          .where(eq(scheduledTasks.id, task.id));

        // Execute task based on type
        await executeTask(task);

        // Mark as completed
        await db
          .update(scheduledTasks)
          .set({
            status: 'completed',
            executedAt: now,
            updatedAt: now,
          })
          .where(eq(scheduledTasks.id, task.id));

        console.log(`[ScheduledTasks] Completed task ${task.id} (${task.taskType})`);
      } catch (error: any) {
        console.error(`[ScheduledTasks] Failed to execute task ${task.id}:`, error);

        // Increment retry count
        const newRetryCount = task.retryCount + 1;
        const shouldRetry = newRetryCount < task.maxRetries;

        if (shouldRetry) {
          // Retry in 1 hour
          const retryAt = new Date(now.getTime() + 60 * 60 * 1000);
          await db
            .update(scheduledTasks)
            .set({
              status: 'pending',
              retryCount: newRetryCount,
              scheduledFor: retryAt,
              error: error.message,
              updatedAt: now,
            })
            .where(eq(scheduledTasks.id, task.id));

          console.log(`[ScheduledTasks] Scheduled retry ${newRetryCount}/${task.maxRetries} for task ${task.id}`);
        } else {
          // Max retries reached, mark as failed
          await db
            .update(scheduledTasks)
            .set({
              status: 'failed',
              error: error.message,
              updatedAt: now,
            })
            .where(eq(scheduledTasks.id, task.id));

          console.error(`[ScheduledTasks] Task ${task.id} failed after ${task.maxRetries} retries`);
        }
      }
    }
  } catch (error) {
    console.error('[ScheduledTasks] Error processing tasks:', error);
  }
}

/**
 * Execute a single task based on its type
 */
async function executeTask(task: any) {
  switch (task.taskType) {
    case 'send-email':
      await executeSendEmailTask(task);
      break;
    
    case 'update-lead-score':
      await executeUpdateLeadScoreTask(task);
      break;
    
    case 'send-notification':
      await executeSendNotificationTask(task);
      break;
    
    default:
      console.warn(`[ScheduledTasks] Unknown task type: ${task.taskType}`);
  }
}

/**
 * Execute send-email task
 */
async function executeSendEmailTask(task: any) {
  const { leadId, emailSubject, emailBody, outcome } = task.taskData;

  if (!leadId || !emailSubject || !emailBody) {
    throw new Error('Missing required fields for send-email task');
  }

  // Get lead details
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  const { leads } = await import('../drizzle/schema');
  const leadResult = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  const lead = leadResult[0];

  if (!lead || !lead.email) {
    throw new Error(`Lead ${leadId} not found or has no email`);
  }

  // Send email
  const result = await sendEmail({
    to: lead.email,
    subject: emailSubject,
    body: emailBody,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to send email');
  }

  // Log email
  const { emailLogs } = await import('../drizzle/schema');
  await db.insert(emailLogs).values({
    leadId: lead.id as number | null,
    campaignId: null,
    companyId: lead.companyId,
    userId: task.createdBy,
    to: lead.email,
    subject: emailSubject,
    body: emailBody,
    status: 'sent',
    metadata: { outcome, taskId: task.id },
  });

  console.log(`[ScheduledTasks] Sent follow-up email to ${lead.email}`);
}

/**
 * Execute update-lead-score task
 */
async function executeUpdateLeadScoreTask(task: any) {
  const { leadId, scoreChange, reason } = task.taskData;

  if (!leadId || scoreChange === undefined || !reason) {
    throw new Error('Missing required fields for update-lead-score task');
  }

  const { updateLeadScore } = await import('./db');
  await updateLeadScore(leadId, scoreChange, reason, task.createdBy);

  console.log(`[ScheduledTasks] Updated lead ${leadId} score by ${scoreChange}`);
}

/**
 * Execute send-notification task
 */
async function executeSendNotificationTask(task: any) {
  const { title, content } = task.taskData;

  if (!title || !content) {
    throw new Error('Missing required fields for send-notification task');
  }

  const { notifyOwner } = await import('./_core/notification');
  const success = await notifyOwner({ title, content });

  if (!success) {
    throw new Error('Failed to send notification');
  }

  console.log(`[ScheduledTasks] Sent notification: ${title}`);
}

/**
 * Start the scheduled tasks processor (runs every 5 minutes)
 */
export function startScheduledTasksProcessor() {
  console.log('[ScheduledTasks] Starting processor (runs every 5 minutes)');

  // Run immediately on startup
  processScheduledTasks().catch(error => {
    console.error('[ScheduledTasks] Error in initial run:', error);
  });

  // Run every 5 minutes
  setInterval(() => {
    processScheduledTasks().catch(error => {
      console.error('[ScheduledTasks] Error in scheduled run:', error);
    });
  }, 5 * 60 * 1000); // 5 minutes
}
