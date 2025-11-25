/**
 * WebSocket Real-Time Notifications System
 * 
 * Provides real-time push notifications for critical events:
 * - Agent milestone achievements
 * - A/B test significance reached
 * - Churn spike detection
 * - Performance drops
 */

import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export interface PushNotification {
  id: string;
  type: 'milestone' | 'ab_test' | 'churn' | 'performance';
  severity: 'info' | 'success' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>;
  timestamp: Date;
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): void {
  if (io) {
    console.log('[WebSocket] Already initialized');
    return;
  }

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict to specific origins
      methods: ['GET', 'POST'],
    },
    path: '/api/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });

    socket.on('subscribe', (channel: string) => {
      socket.join(channel);
      console.log(`[WebSocket] Client ${socket.id} subscribed to ${channel}`);
    });

    socket.on('unsubscribe', (channel: string) => {
      socket.leave(channel);
      console.log(`[WebSocket] Client ${socket.id} unsubscribed from ${channel}`);
    });
  });

  console.log('[WebSocket] Server initialized');
}

/**
 * Get WebSocket server instance
 */
export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Send push notification to all connected clients
 */
export function sendPushNotification(notification: PushNotification): void {
  if (!io) {
    console.warn('[WebSocket] Server not initialized, cannot send notification');
    return;
  }

  // Broadcast to all clients
  io.emit('notification', notification);
  
  // Also send to specific channel based on type
  io.to(`notifications:${notification.type}`).emit('notification', notification);
  
  console.log(`[WebSocket] Notification sent: ${notification.type} - ${notification.title}`);
}

/**
 * Send milestone achievement notification
 */
export function notifyMilestone(
  agentName: string,
  milestoneType: string,
  value: number,
  campaignName: string
): void {
  const notification: PushNotification = {
    id: `milestone-${Date.now()}`,
    type: 'milestone',
    severity: 'success',
    title: `🎉 Milestone Achieved: ${agentName}`,
    message: `${agentName} reached ${value} ${milestoneType} in ${campaignName} campaign`,
    data: {
      agentName,
      milestoneType,
      value,
      campaignName,
    },
    timestamp: new Date(),
  };

  sendPushNotification(notification);
}

/**
 * Send A/B test significance notification
 */
export function notifyABTestSignificance(
  testId: string,
  agentName: string,
  recommendationTitle: string,
  improvement: number
): void {
  const notification: PushNotification = {
    id: `ab-test-${Date.now()}`,
    type: 'ab_test',
    severity: 'success',
    title: `✅ A/B Test Winner: ${agentName}`,
    message: `${recommendationTitle} shows ${improvement.toFixed(1)}% improvement and reached statistical significance`,
    data: {
      testId,
      agentName,
      recommendationTitle,
      improvement,
    },
    timestamp: new Date(),
  };

  sendPushNotification(notification);
}

/**
 * Send churn spike detection notification
 */
export function notifyChurnSpike(
  criticalCount: number,
  highRiskCount: number,
  totalAtRisk: number
): void {
  const notification: PushNotification = {
    id: `churn-${Date.now()}`,
    type: 'churn',
    severity: 'critical',
    title: `⚠️ Churn Risk Alert`,
    message: `${criticalCount} contacts at critical risk, ${totalAtRisk} total contacts need reactivation`,
    data: {
      criticalCount,
      highRiskCount,
      totalAtRisk,
    },
    timestamp: new Date(),
  };

  sendPushNotification(notification);
}

/**
 * Send performance drop notification
 */
export function notifyPerformanceDrop(
  agentName: string,
  metric: string,
  dropPercentage: number,
  currentValue: number
): void {
  const notification: PushNotification = {
    id: `performance-${Date.now()}`,
    type: 'performance',
    severity: dropPercentage > 30 ? 'critical' : 'warning',
    title: `📉 Performance Alert: ${agentName}`,
    message: `${metric} dropped ${dropPercentage.toFixed(1)}% to ${currentValue.toFixed(1)}% in the last 7 days`,
    data: {
      agentName,
      metric,
      dropPercentage,
      currentValue,
    },
    timestamp: new Date(),
  };

  sendPushNotification(notification);
}

/**
 * Example: Simulate notifications for testing
 */
export function simulateNotifications(): void {
  setTimeout(() => {
    notifyMilestone('Ivy-Prospect', 'conversions', 300, 'CNC Training 2026');
  }, 5000);

  setTimeout(() => {
    notifyABTestSignificance(
      'ab-ivy-solve-1',
      'Ivy-Solve',
      'Enhanced Email Content Personalization',
      86.7
    );
  }, 10000);

  setTimeout(() => {
    notifyChurnSpike(42, 89, 187);
  }, 15000);

  setTimeout(() => {
    notifyPerformanceDrop('Ivy-Qualify', 'conversion rate', 15.3, 6.2);
  }, 20000);
}
