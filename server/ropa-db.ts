import { eq, desc, and, gte } from "drizzle-orm";
import { getDb } from "./db";
import {
  ropaTasks,
  ropaLogs,
  ropaMetrics,
  ropaConfig,
  ropaChatHistory,
  ropaLearning,
  ropaAlerts,
  type InsertRopaTask,
  type InsertRopaLog,
  type InsertRopaMetric,
  type InsertRopaConfig,
  type InsertRopaChatHistory,
  type InsertRopaLearning,
  type InsertRopaAlert,
} from "../drizzle/schema";

/**
 * ROPA Database Helper Functions
 * Provides clean interface for ROPA data operations
 */

// ============ TASKS ============

export async function createRopaTask(task: InsertRopaTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [result] = await db.insert(ropaTasks).values(task);
  return result;
}

export async function getRopaTaskById(taskId: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [task] = await db.select().from(ropaTasks).where(eq(ropaTasks.taskId, taskId)).limit(1);
  return task;
}

export async function getRecentRopaTasks(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaTasks).orderBy(desc(ropaTasks.createdAt)).limit(limit);
}

export async function getRunningRopaTasks() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaTasks).where(eq(ropaTasks.status, "running"));
}

export async function updateRopaTaskStatus(
  taskId: string,
  status: "pending" | "running" | "completed" | "failed" | "cancelled",
  output?: any,
  error?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (output) updateData.output = output;
  if (error) updateData.error = error;
  if (status === "running") updateData.startedAt = new Date();
  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
    const task = await getRopaTaskById(taskId);
    if (task?.startedAt) {
      updateData.duration = Date.now() - new Date(task.startedAt).getTime();
    }
  }
  
  await db.update(ropaTasks).set(updateData).where(eq(ropaTasks.taskId, taskId));
}

// ============ LOGS ============

export async function createRopaLog(log: InsertRopaLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(ropaLogs).values(log);
}

export async function getRecentRopaLogs(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaLogs).orderBy(desc(ropaLogs.timestamp)).limit(limit);
}

export async function getRopaLogsByTaskId(taskId: string) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaLogs).where(eq(ropaLogs.taskId, taskId)).orderBy(desc(ropaLogs.timestamp));
}

// ============ METRICS ============

export async function recordRopaMetric(metric: InsertRopaMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(ropaMetrics).values(metric);
}

export async function getRecentRopaMetrics(metricType: string, hours = 24) {
  const db = await getDb();
  if (!db) return [];
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await db
    .select()
    .from(ropaMetrics)
    .where(and(eq(ropaMetrics.metricType, metricType), gte(ropaMetrics.timestamp, since)))
    .orderBy(desc(ropaMetrics.timestamp));
}

// ============ CONFIG ============

export async function setRopaConfig(key: string, value: any, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .insert(ropaConfig)
    .values({ key, value, description })
    .onDuplicateKeyUpdate({ set: { value, description } });
}

export async function getRopaConfig(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const [config] = await db.select().from(ropaConfig).where(eq(ropaConfig.key, key)).limit(1);
  return config?.value;
}

// ============ CHAT HISTORY ============

export async function addRopaChatMessage(message: InsertRopaChatHistory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(ropaChatHistory).values(message);
}

export async function getRopaChatHistory(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaChatHistory).orderBy(desc(ropaChatHistory.timestamp)).limit(limit);
}

// ============ LEARNING ============

export async function recordRopaLearning(learning: InsertRopaLearning) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Check if pattern exists
  const [existing] = await db
    .select()
    .from(ropaLearning)
    .where(and(eq(ropaLearning.category, learning.category), eq(ropaLearning.pattern, learning.pattern)))
    .limit(1);
  
  if (existing) {
    // Update frequency and last seen
    await db
      .update(ropaLearning)
      .set({
        frequency: existing.frequency + 1,
        lastSeen: new Date(),
        successRate: learning.successRate || existing.successRate,
      })
      .where(eq(ropaLearning.id, existing.id));
  } else {
    // Insert new pattern
    await db.insert(ropaLearning).values(learning);
  }
}

export async function getRopaLearningPatterns(category: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(ropaLearning)
    .where(eq(ropaLearning.category, category))
    .orderBy(desc(ropaLearning.frequency))
    .limit(limit);
}

// ============ ALERTS ============

export async function createRopaAlert(alert: InsertRopaAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(ropaAlerts).values(alert);
}

export async function getUnresolvedRopaAlerts() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(ropaAlerts).where(eq(ropaAlerts.resolved, false)).orderBy(desc(ropaAlerts.createdAt));
}

export async function resolveRopaAlert(alertId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(ropaAlerts).set({ resolved: true, resolvedAt: new Date() }).where(eq(ropaAlerts.id, alertId));
}

// ============ STATS ============

export async function getRopaStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [totalTasks] = await db.select().from(ropaTasks);
  const runningTasks = await getRunningRopaTasks();
  const unresolvedAlerts = await getUnresolvedRopaAlerts();
  
  // Get task success rate (last 24h)
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentTasks = await db
    .select()
    .from(ropaTasks)
    .where(gte(ropaTasks.createdAt, since24h));
  
  const completedTasks = recentTasks.filter((t) => t.status === "completed").length;
  const failedTasks = recentTasks.filter((t) => t.status === "failed").length;
  const successRate = recentTasks.length > 0 ? (completedTasks / recentTasks.length) * 100 : 100;
  
  return {
    totalTasks: totalTasks.length,
    runningTasks: runningTasks.length,
    completedTasksToday: completedTasks,
    failedTasksToday: failedTasks,
    successRate: Math.round(successRate * 10) / 10,
    unresolvedAlerts: unresolvedAlerts.length,
  };
}
