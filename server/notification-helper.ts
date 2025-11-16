import * as db from "./db";

/**
 * Helper functions to create automatic notifications for system events
 */

export async function notifyWorkflowCompleted(workflowName: string, userId: number, details?: string) {
  await db.createNotification({
    userId,
    type: 'success',
    category: 'workflow',
    title: 'Workflow Completed',
    message: `The workflow "${workflowName}" has been completed successfully.${details ? ' ' + details : ''}`,
  });
}

export async function notifyLeadQualified(leadName: string, company: string, score: number, userId: number) {
  await db.createNotification({
    userId,
    type: 'success',
    category: 'lead',
    title: 'Lead Qualified',
    message: `${leadName} from ${company} has been qualified with a score of ${score}. Ready for sales follow-up.`,
  });
}

export async function notifyTicketResolved(ticketId: string, subject: string, userId: number, resolutionTime?: string) {
  await db.createNotification({
    userId,
    type: 'success',
    category: 'ticket',
    title: 'Ticket Resolved',
    message: `Ticket #${ticketId} "${subject}" has been resolved.${resolutionTime ? ` Resolution time: ${resolutionTime}` : ''}`,
  });
}

export async function notifyAgentStatusChange(agentName: string, oldStatus: string, newStatus: string, userId: number) {
  await db.createNotification({
    userId,
    type: 'info',
    category: 'agent',
    title: 'Agent Status Changed',
    message: `${agentName} status changed from ${oldStatus} to ${newStatus}.`,
  });
}

export async function notifySystemEvent(title: string, message: string, userId: number) {
  await db.createNotification({
    userId,
    type: 'info',
    category: 'system',
    title,
    message,
  });
}
