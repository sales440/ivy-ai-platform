/**
 * WebSocket Notifications Service
 * Real-time notifications for ROPA events and platform updates
 */

import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { createRopaLog } from "./ropa-db";

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Subscribe to notification channels
    socket.on("subscribe", (channel: string) => {
      socket.join(channel);
      console.log(`[WebSocket] Client ${socket.id} subscribed to ${channel}`);
    });

    socket.on("unsubscribe", (channel: string) => {
      socket.leave(channel);
      console.log(`[WebSocket] Client ${socket.id} unsubscribed from ${channel}`);
    });

    socket.on("disconnect", () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[WebSocket] Socket.IO initialized on /api/socket.io");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ============ NOTIFICATION TYPES ============

export type NotificationType = "critical" | "warning" | "info" | "success";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  metadata?: any;
}

// ============ NOTIFICATION FUNCTIONS ============

async function sendNotification(
  channel: string,
  notification: Notification,
  logLevel: "info" | "warn" | "error" = "info"
) {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized, skipping notification");
    return;
  }

  // Broadcast to all clients in channel
  io.to(channel).emit("notification", notification);

  // Log notification
  await createRopaLog({
    taskId: undefined,
    level: logLevel,
    message: `[Notification] ${notification.title}: ${notification.message}`,
    metadata: { channel, notification },
  });
}

// ============ ROPA EVENT NOTIFICATIONS ============

export async function notifyROPATaskCompleted(taskId: string, taskName: string, result: any) {
  await sendNotification(
    "ropa:tasks",
    {
      id: `task_${taskId}`,
      type: "success",
      title: "ROPA Task Completed",
      message: `Task "${taskName}" completed successfully`,
      timestamp: new Date().toISOString(),
      metadata: { taskId, result },
    },
    "info"
  );
}

export async function notifyROPATaskFailed(taskId: string, taskName: string, error: any) {
  await sendNotification(
    "ropa:tasks",
    {
      id: `task_${taskId}`,
      type: "critical",
      title: "ROPA Task Failed",
      message: `Task "${taskName}" failed: ${error.message}`,
      timestamp: new Date().toISOString(),
      metadata: { taskId, error },
    },
    "error"
  );
}

export async function notifyROPAHealthCheck(health: number, status: string) {
  const type: NotificationType = health >= 90 ? "success" : health >= 70 ? "info" : "warning";

  await sendNotification(
    "ropa:health",
    {
      id: `health_${Date.now()}`,
      type,
      title: "ROPA Health Check",
      message: `Platform health: ${health}% (${status})`,
      timestamp: new Date().toISOString(),
      metadata: { health, status },
    },
    "info"
  );
}

export async function notifyROPACriticalError(error: string, details: any) {
  await sendNotification(
    "ropa:errors",
    {
      id: `error_${Date.now()}`,
      type: "critical",
      title: "ROPA Critical Error",
      message: error,
      timestamp: new Date().toISOString(),
      metadata: details,
    },
    "error"
  );
}

export async function notifyROPAMaintenance(action: string, result: any) {
  await sendNotification(
    "ropa:maintenance",
    {
      id: `maintenance_${Date.now()}`,
      type: "info",
      title: "ROPA Maintenance",
      message: `Maintenance action: ${action}`,
      timestamp: new Date().toISOString(),
      metadata: result,
    },
    "info"
  );
}

// ============ AGENT NOTIFICATIONS ============

export async function notifyAgentCreated(agentId: string, agentName: string) {
  await sendNotification("agents:lifecycle", {
    id: `agent_${agentId}`,
    type: "success",
    title: "Agent Created",
    message: `New agent "${agentName}" has been created`,
    timestamp: new Date().toISOString(),
    metadata: { agentId, agentName },
  });
}

export async function notifyAgentPerformance(agentId: string, agentName: string, metrics: any) {
  const type: NotificationType =
    metrics.successRate >= 90 ? "success" : metrics.successRate >= 70 ? "info" : "warning";

  await sendNotification("agents:performance", {
    id: `agent_perf_${agentId}`,
    type,
    title: "Agent Performance Update",
    message: `Agent "${agentName}" success rate: ${metrics.successRate}%`,
    timestamp: new Date().toISOString(),
    metadata: { agentId, agentName, metrics },
  });
}

// ============ CAMPAIGN NOTIFICATIONS ============

export async function notifyCampaignStarted(campaignId: string, campaignName: string) {
  await sendNotification("campaigns:lifecycle", {
    id: `campaign_${campaignId}`,
    type: "info",
    title: "Campaign Started",
    message: `Campaign "${campaignName}" has been started`,
    timestamp: new Date().toISOString(),
    metadata: { campaignId, campaignName },
  });
}

export async function notifyCampaignCompleted(
  campaignId: string,
  campaignName: string,
  results: any
) {
  await sendNotification("campaigns:lifecycle", {
    id: `campaign_${campaignId}`,
    type: "success",
    title: "Campaign Completed",
    message: `Campaign "${campaignName}" completed with ${results.conversions} conversions`,
    timestamp: new Date().toISOString(),
    metadata: { campaignId, campaignName, results },
  });
}

// ============ SYSTEM NOTIFICATIONS ============

export async function notifySystemAlert(severity: NotificationType, title: string, message: string) {
  await sendNotification(
    "system:alerts",
    {
      id: `alert_${Date.now()}`,
      type: severity,
      title,
      message,
      timestamp: new Date().toISOString(),
    },
    severity === "critical" ? "error" : severity === "warning" ? "warn" : "info"
  );
}

export async function notifyDatabaseBackup(backupId: string, size: number) {
  await sendNotification("system:backups", {
    id: `backup_${backupId}`,
    type: "success",
    title: "Database Backup Created",
    message: `Backup created successfully (${(size / 1024 / 1024).toFixed(2)} MB)`,
    timestamp: new Date().toISOString(),
    metadata: { backupId, size },
  });
}

// ============ BROADCAST TO ALL ============

export async function broadcastNotification(notification: Notification) {
  if (!io) {
    console.warn("[WebSocket] Socket.IO not initialized, skipping broadcast");
    return;
  }

  io.emit("notification", notification);

  await createRopaLog({
    taskId: undefined,
    level: notification.type === "critical" ? "error" : notification.type === "warning" ? "warn" : "info",
    message: `[Broadcast] ${notification.title}: ${notification.message}`,
    metadata: { notification },
  });
}
