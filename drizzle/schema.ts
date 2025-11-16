import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agentes Ivy.AI - Tabla principal de agentes
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  agentId: varchar("agentId", { length: 64 }).notNull().unique(), // UUID del agente
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("type", ["prospect", "closer", "solve", "logic", "talent", "insight"]).notNull(),
  department: mysqlEnum("department", ["sales", "marketing", "customer_service", "operations", "hr", "strategy"]).notNull(),
  status: mysqlEnum("status", ["idle", "active", "training", "error"]).default("idle").notNull(),
  capabilities: json("capabilities").$type<string[]>().notNull(), // Array de capacidades
  kpis: json("kpis").$type<Record<string, number>>().notNull(), // KPIs del agente
  configuration: json("configuration").$type<Record<string, any>>(), // Configuración personalizada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Tareas ejecutadas por agentes
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  taskId: varchar("taskId", { length: 64 }).notNull().unique(),
  agentId: int("agentId").notNull(),
  type: varchar("type", { length: 100 }).notNull(), // find_leads, resolve_ticket, etc.
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  input: json("input").$type<Record<string, any>>().notNull(), // Datos de entrada
  output: json("output").$type<Record<string, any>>(), // Resultado de la tarea
  error: text("error"), // Mensaje de error si falla
  executionTime: int("executionTime"), // Tiempo de ejecución en ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Workflows - Flujos de trabajo automatizados
 */
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: varchar("workflowId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  steps: json("steps").$type<Array<{
    name: string;
    agentType: string;
    task: Record<string, any>;
    breakCondition?: Record<string, any>;
  }>>().notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy"), // User ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

/**
 * Ejecuciones de workflows
 */
export const workflowExecutions = mysqlTable("workflowExecutions", {
  id: int("id").autoincrement().primaryKey(),
  executionId: varchar("executionId", { length: 64 }).notNull().unique(),
  workflowId: int("workflowId").notNull(),
  status: mysqlEnum("status", ["running", "completed", "failed", "interrupted"]).default("running").notNull(),
  initialData: json("initialData").$type<Record<string, any>>().notNull(),
  results: json("results").$type<Record<string, any>>(),
  currentStep: int("currentStep").default(0),
  totalSteps: int("totalSteps").notNull(),
  error: text("error"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

/**
 * Leads - Para Ivy-Prospect
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  leadId: varchar("leadId", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }),
  company: varchar("company", { length: 200 }),
  title: varchar("title", { length: 200 }),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 200 }),
  companySize: varchar("companySize", { length: 50 }),
  qualificationScore: int("qualificationScore").default(0),
  qualificationLevel: mysqlEnum("qualificationLevel", ["A", "B", "C", "D"]),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "nurture", "converted", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }), // linkedin, web, manual
  metadata: json("metadata").$type<Record<string, any>>(),
  assignedTo: int("assignedTo"), // Agent ID
  createdBy: int("createdBy"), // Agent ID que lo generó
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Tickets de soporte - Para Ivy-Solve
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  ticketId: varchar("ticketId", { length: 64 }).notNull().unique(),
  customerId: int("customerId"), // User ID del cliente
  customerEmail: varchar("customerEmail", { length: 320 }),
  subject: varchar("subject", { length: 300 }).notNull(),
  issue: text("issue").notNull(),
  category: mysqlEnum("category", ["login", "billing", "technical", "feature", "account", "general"]),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "escalated", "closed"]).default("open").notNull(),
  assignedTo: int("assignedTo"), // Agent ID
  resolution: text("resolution"),
  resolutionTime: int("resolutionTime"), // Tiempo en minutos
  customerSatisfaction: int("customerSatisfaction"), // 1-5
  escalationReason: text("escalationReason"),
  metadata: json("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;

/**
 * Base de conocimiento - Para Ivy-Solve
 */
export const knowledgeBase = mysqlTable("knowledgeBase", {
  id: int("id").autoincrement().primaryKey(),
  articleId: varchar("articleId", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: json("tags").$type<string[]>(),
  viewCount: int("viewCount").default(0),
  helpfulCount: int("helpfulCount").default(0),
  isPublished: boolean("isPublished").default(true).notNull(),
  createdBy: int("createdBy"), // User ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeArticle = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeArticle = typeof knowledgeBase.$inferInsert;

/**
 * Comunicaciones entre agentes - Para The Hive
 */
export const agentCommunications = mysqlTable("agentCommunications", {
  id: int("id").autoincrement().primaryKey(),
  communicationId: varchar("communicationId", { length: 64 }).notNull().unique(),
  fromAgentId: int("fromAgentId").notNull(),
  toAgentId: int("toAgentId"),
  messageType: varchar("messageType", { length: 100 }).notNull(),
  message: json("message").$type<Record<string, any>>().notNull(),
  workflowExecutionId: int("workflowExecutionId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = typeof agentCommunications.$inferInsert;

/**
 * Métricas del sistema - Para analytics
 */
export const systemMetrics = mysqlTable("systemMetrics", {
  id: int("id").autoincrement().primaryKey(),
  metricType: varchar("metricType", { length: 100 }).notNull(),
  agentId: int("agentId"),
  department: varchar("department", { length: 50 }),
  metricName: varchar("metricName", { length: 100 }).notNull(),
  metricValue: int("metricValue").notNull(),
  metadata: json("metadata").$type<Record<string, any>>(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = typeof systemMetrics.$inferInsert;

/**
 * Comandos ejecutados - Para historial
 */
export const commandHistory = mysqlTable("commandHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  command: text("command").notNull(),
  parsedCommand: json("parsedCommand").$type<Record<string, any>>(),
  result: json("result").$type<Record<string, any>>(),
  status: mysqlEnum("status", ["success", "error"]).notNull(),
  error: text("error"),
  executionTime: int("executionTime"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommandHistory = typeof commandHistory.$inferSelect;
export type InsertCommandHistory = typeof commandHistory.$inferInsert;
