/**
 * Real-time Notifications Service
 * Uses Server-Sent Events (SSE) for push notifications
 */

import { Response } from 'express';

export interface Notification {
  id: string;
  type: 'lead_created' | 'lead_updated' | 'ticket_created' | 'ticket_resolved' | 'email_sent' | 'email_opened' | 'system_alert';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
  companyId: number;
  userId?: number;
}

// Store active SSE connections
const connections = new Map<string, Response>();

/**
 * Register a new SSE connection
 */
export function registerSSEConnection(connectionId: string, res: Response) {
  connections.set(connectionId, res);
  
  // Send initial connection success message
  sendSSEMessage(res, {
    type: 'connected',
    message: 'Real-time notifications connected',
  });

  console.log(`[Notifications] Client connected: ${connectionId} (Total: ${connections.size})`);
}

/**
 * Remove SSE connection
 */
export function removeSSEConnection(connectionId: string) {
  connections.delete(connectionId);
  console.log(`[Notifications] Client disconnected: ${connectionId} (Total: ${connections.size})`);
}

/**
 * Send SSE message to a specific connection
 */
function sendSSEMessage(res: Response, data: any) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch (error) {
    console.error('[Notifications] Error sending SSE message:', error);
  }
}

/**
 * Broadcast notification to all connections for a company
 */
export function broadcastNotification(notification: Notification) {
  let sentCount = 0;
  
  connections.forEach((res, connectionId) => {
    // In production, filter by companyId and userId
    // For now, broadcast to all connections
    sendSSEMessage(res, notification);
    sentCount++;
  });

  console.log(`[Notifications] Broadcast sent to ${sentCount} clients`);
}

/**
 * Send notification to specific user
 */
export function sendNotificationToUser(userId: number, notification: Notification) {
  const connectionId = `user-${userId}`;
  const res = connections.get(connectionId);
  
  if (res) {
    sendSSEMessage(res, notification);
    console.log(`[Notifications] Sent to user ${userId}`);
  }
}

/**
 * Send notification to all users in a company
 */
export function sendNotificationToCompany(companyId: number, notification: Notification) {
  let sentCount = 0;
  
  connections.forEach((res, connectionId) => {
    // Filter by company (connection ID format: "company-{companyId}-user-{userId}")
    if (connectionId.startsWith(`company-${companyId}-`)) {
      sendSSEMessage(res, notification);
      sentCount++;
    }
  });

  console.log(`[Notifications] Sent to ${sentCount} users in company ${companyId}`);
}

/**
 * Create notification helpers for common events
 */
export const NotificationHelpers = {
  leadCreated: (leadId: number, leadName: string, companyId: number) => {
    const notification: Notification = {
      id: `lead-${leadId}-${Date.now()}`,
      type: 'lead_created',
      title: 'New Lead Created',
      message: `${leadName} has been added to your pipeline`,
      data: { leadId },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  leadUpdated: (leadId: number, leadName: string, status: string, companyId: number) => {
    const notification: Notification = {
      id: `lead-${leadId}-${Date.now()}`,
      type: 'lead_updated',
      title: 'Lead Updated',
      message: `${leadName} status changed to ${status}`,
      data: { leadId, status },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  ticketCreated: (ticketId: number, ticketTitle: string, companyId: number) => {
    const notification: Notification = {
      id: `ticket-${ticketId}-${Date.now()}`,
      type: 'ticket_created',
      title: 'New Ticket Created',
      message: `${ticketTitle}`,
      data: { ticketId },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  ticketResolved: (ticketId: number, ticketTitle: string, companyId: number) => {
    const notification: Notification = {
      id: `ticket-${ticketId}-${Date.now()}`,
      type: 'ticket_resolved',
      title: 'Ticket Resolved',
      message: `${ticketTitle} has been resolved`,
      data: { ticketId },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  emailSent: (leadId: number, leadName: string, subject: string, companyId: number) => {
    const notification: Notification = {
      id: `email-${leadId}-${Date.now()}`,
      type: 'email_sent',
      title: 'Email Sent',
      message: `Email sent to ${leadName}: ${subject}`,
      data: { leadId, subject },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  emailOpened: (leadId: number, leadName: string, companyId: number) => {
    const notification: Notification = {
      id: `email-${leadId}-${Date.now()}`,
      type: 'email_opened',
      title: 'Email Opened',
      message: `${leadName} opened your email`,
      data: { leadId },
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },

  systemAlert: (message: string, companyId: number) => {
    const notification: Notification = {
      id: `system-${Date.now()}`,
      type: 'system_alert',
      title: 'System Alert',
      message,
      timestamp: new Date(),
      companyId,
    };
    broadcastNotification(notification);
  },
};

/**
 * Get connection stats
 */
export function getConnectionStats() {
  return {
    totalConnections: connections.size,
    connections: Array.from(connections.keys()),
  };
}
