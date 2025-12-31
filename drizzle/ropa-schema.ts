import { int, mysqlTable, text, timestamp, varchar, mysqlEnum, json, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * ROPA (Robotic Operational Process Automation) - Meta-Agent System
 * Database schema for autonomous AI agent operations
 */

// ROPA Tasks - Tracks all tasks executed by ROPA
export const ropaTasks = mysqlTable("ropa_tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("task_id", { length: 64 }).notNull().unique(),
  type: varchar("type", { length: 64 }).notNull(), // e.g., "fix_typescript", "train_agent", "health_check"
  status: mysqlEnum("status", ["pending", "running", "completed", "failed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  toolUsed: varchar("tool_used", { length: 128 }), // Which of the 129 tools was used
  input: json("input"), // Task input parameters
  output: json("output"), // Task output/results
  error: text("error"), // Error message if failed
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: int("duration"), // Duration in milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ROPA Logs - Detailed logs of ROPA operations
export const ropaLogs = mysqlTable("ropa_logs", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("task_id", { length: 64 }), // Reference to ropa_tasks
  level: mysqlEnum("level", ["debug", "info", "warn", "error"]).default("info").notNull(),
  message: text("message").notNull(),
  metadata: json("metadata"), // Additional context
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ROPA Metrics - Performance and health metrics
export const ropaMetrics = mysqlTable("ropa_metrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metric_type", { length: 64 }).notNull(), // e.g., "cpu_usage", "memory", "task_success_rate"
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 32 }), // e.g., "percent", "mb", "count"
  metadata: json("metadata"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ROPA Configuration - System configuration and settings
export const ropaConfig = mysqlTable("ropa_config", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: json("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

// ROPA Chat History - Conversation history with ROPA
export const ropaChatHistory = mysqlTable("ropa_chat_history", {
  id: int("id").autoincrement().primaryKey(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  message: text("message").notNull(),
  metadata: json("metadata"), // Additional context like tool calls
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ROPA Learning - Self-learning data storage
export const ropaLearning = mysqlTable("ropa_learning", {
  id: int("id").autoincrement().primaryKey(),
  category: varchar("category", { length: 64 }).notNull(), // e.g., "error_patterns", "success_patterns"
  pattern: text("pattern").notNull(),
  frequency: int("frequency").default(1).notNull(),
  successRate: decimal("success_rate", { precision: 5, scale: 2 }),
  metadata: json("metadata"),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ROPA Alerts - System alerts and notifications
export const ropaAlerts = mysqlTable("ropa_alerts", {
  id: int("id").autoincrement().primaryKey(),
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports
export type RopaTask = typeof ropaTasks.$inferSelect;
export type InsertRopaTask = typeof ropaTasks.$inferInsert;
export type RopaLog = typeof ropaLogs.$inferSelect;
export type InsertRopaLog = typeof ropaLogs.$inferInsert;
export type RopaMetric = typeof ropaMetrics.$inferSelect;
export type InsertRopaMetric = typeof ropaMetrics.$inferInsert;
export type RopaConfig = typeof ropaConfig.$inferSelect;
export type InsertRopaConfig = typeof ropaConfig.$inferInsert;
export type RopaChatHistory = typeof ropaChatHistory.$inferSelect;
export type InsertRopaChatHistory = typeof ropaChatHistory.$inferInsert;
export type RopaLearning = typeof ropaLearning.$inferSelect;
export type InsertRopaLearning = typeof ropaLearning.$inferInsert;
export type RopaAlert = typeof ropaAlerts.$inferSelect;
export type InsertRopaAlert = typeof ropaAlerts.$inferInsert;
