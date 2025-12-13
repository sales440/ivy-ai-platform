import { boolean, date, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
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
 * Companies/Organizations table for multi-tenant support
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  industry: varchar("industry", { length: 100 }),
  plan: mysqlEnum("plan", ["starter", "professional", "enterprise"]).default("starter").notNull(),
  logo: text("logo"),
  website: varchar("website", { length: 500 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

/**
 * User-Company assignments (many-to-many relationship)
 * Allows users to be assigned to specific companies they can access
 */
export const userCompanies = mysqlTable("userCompanies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId").notNull(),
  role: mysqlEnum("role", ["viewer", "analyst", "member", "manager", "admin"]).default("member").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserCompany = typeof userCompanies.$inferSelect;
export type InsertUserCompany = typeof userCompanies.$inferInsert;

/**
 * Preferencias de usuario
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // Relación 1:1 con users
  theme: mysqlEnum("theme", ["light", "dark", "system"]).default("dark").notNull(),
  language: varchar("language", { length: 10 }).default("en").notNull(),
  notificationsEnabled: boolean("notificationsEnabled").default(true).notNull(),
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  workflowNotifications: boolean("workflowNotifications").default(true).notNull(),
  leadNotifications: boolean("leadNotifications").default(true).notNull(),
  ticketNotifications: boolean("ticketNotifications").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = typeof userPreferences.$inferInsert;

/**
 * Notificaciones para usuarios
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // ID del usuario que recibe la notificación
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  category: mysqlEnum("category", ["workflow", "agent", "lead", "ticket", "system"]).notNull(),
  relatedId: varchar("relatedId", { length: 64 }), // ID del objeto relacionado (workflow, lead, ticket, etc.)
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Agentes Ivy.AI - Tabla principal de agentes
 */
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId"),
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
  companyId: int("companyId"),
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
  scoreHistory: json("scoreHistory").$type<Array<{
    score: number;
    change: number;
    reason: string;
    timestamp: string;
    userId: number;
  }>>(),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "nurture", "converted", "lost"]).default("new").notNull(),
  source: varchar("source", { length: 100 }), // linkedin, web, manual
  prospectSearchId: int("prospectSearchId"), // Link to prospectSearches for conversion tracking
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
  companyId: int("companyId"),
  ticketId: varchar("ticketId", { length: 64 }).notNull().unique(),
  customerId: int("customerId"), // User ID del cliente
  customerEmail: varchar("customerEmail", { length: 320 }),
  subject: varchar("subject", { length: 300 }).notNull(),
  issue: text("issue").notNull(),
  category: mysqlEnum("category", ["login", "billing", "technical", "feature_request", "account", "general"]),
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
  fromAgent: varchar("fromAgent", { length: 100 }).default('system').notNull(), // Added default to bypass prompt
  fromAgentId: varchar("fromAgentId", { length: 100 }), // Legacy restoration to prevent interactive prompt
  toAgent: varchar("toAgent", { length: 100 }).default('system').notNull(), // Added default
  toAgentId: varchar("toAgentId", { length: 100 }), // Legacy restoration
  messageType: varchar("messageType", { length: 100 }).notNull(),
  content: text("content").notNull(), // JSON string content
  message: text("message"), // Legacy restoration
  workflowExecutionId: varchar("workflowExecutionId", { length: 64 }), // Legacy restoration
  status: mysqlEnum("status", ["pending", "delivered", "failed"]).default("pending").notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
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

/**
 * Agent Configurations - Personalized settings per company per agent type
 */
export const agentConfigurations = mysqlTable("agentConfigurations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  agentType: mysqlEnum("agentType", ["prospect", "closer", "solve", "logic", "talent", "insight"]).notNull(),
  temperature: int("temperature").default(70).notNull(), // 0-100 scale
  maxTokens: int("maxTokens").default(2000).notNull(),
  systemPrompt: text("systemPrompt"),
  customInstructions: text("customInstructions"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentConfiguration = typeof agentConfigurations.$inferSelect;
export type InsertAgentConfiguration = typeof agentConfigurations.$inferInsert;

/**
 * Audit Logs - Track all critical system changes
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(), // e.g., "assign_user", "remove_user", "update_role", "update_config"
  entityType: varchar("entityType", { length: 50 }).notNull(), // e.g., "user_company", "agent_config", "company"
  entityId: int("entityId"),
  changes: json("changes").$type<Record<string, any>>(), // Store before/after values
  metadata: json("metadata").$type<Record<string, any>>(), // Additional context
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Dashboard Widgets - Customizable dashboard layout per company
 */
export const dashboardWidgets = mysqlTable("dashboardWidgets", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  widgetType: mysqlEnum("widgetType", ["leads_summary", "tickets_summary", "conversion_chart", "revenue_chart", "agents_status", "recent_activity"]).notNull(),
  position: int("position").notNull(), // Order in the grid
  gridX: int("gridX").default(0).notNull(), // Grid column position
  gridY: int("gridY").default(0).notNull(), // Grid row position
  gridW: int("gridW").default(4).notNull(), // Grid width (columns)
  gridH: int("gridH").default(2).notNull(), // Grid height (rows)
  config: json("config").$type<Record<string, any>>(), // Widget-specific configuration
  isVisible: boolean("isVisible").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertDashboardWidget = typeof dashboardWidgets.$inferInsert;

/**
 * CRM Integrations - External CRM connections per company
 */
export const crmIntegrations = mysqlTable("crmIntegrations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  crmType: mysqlEnum("crmType", ["salesforce", "hubspot", "pipedrive"]).notNull(),
  credentials: json("credentials").$type<Record<string, any>>().notNull(), // Encrypted API keys, tokens, etc.
  config: json("config").$type<Record<string, any>>(), // Field mappings, sync settings
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  syncStatus: mysqlEnum("syncStatus", ["idle", "syncing", "error"]).default("idle").notNull(),
  syncError: text("syncError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrmIntegration = typeof crmIntegrations.$inferSelect;
export type InsertCrmIntegration = typeof crmIntegrations.$inferInsert;

/**
 * Prospect Searches - Track Ivy-Prospect search analytics
 */
export const prospectSearches = mysqlTable("prospectSearches", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  location: varchar("location", { length: 255 }),
  companySize: varchar("companySize", { length: 50 }),
  seniority: varchar("seniority", { length: 50 }),
  skills: json("skills").$type<string[]>(), // Array of skills searched
  resultCount: int("resultCount").notNull(),
  source: varchar("source", { length: 50 }).notNull(), // 'linkedin', 'mock', 'mock_fallback'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProspectSearch = typeof prospectSearches.$inferSelect;
export type InsertProspectSearch = typeof prospectSearches.$inferInsert;

/**
 * Saved Searches - Para Ivy-Prospect
 */
export const savedSearches = mysqlTable("savedSearches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyId: int("companyId"),
  name: varchar("name", { length: 200 }).notNull(),
  filters: json("filters").$type<{
    query: string;
    industry?: string;
    location?: string;
    companySize?: string;
    seniority?: string;
    skills?: string[];
  }>().notNull(),
  usageCount: int("usageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedSearch = typeof savedSearches.$inferSelect;
export type InsertSavedSearch = typeof savedSearches.$inferInsert;

/**
 * Calls - Historial de llamadas telefónicas (Telnyx Voice API)
 */
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  leadId: int("leadId"), // Opcional: si la llamada está relacionada con un lead
  userId: int("userId"), // Usuario que inició la llamada
  callSid: varchar("callSid", { length: 255 }).unique(), // Telnyx Call ID
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  from: varchar("from", { length: 50 }).notNull(), // Número de teléfono origen
  to: varchar("to", { length: 50 }).notNull(), // Número de teléfono destino
  status: mysqlEnum("status", ["initiated", "ringing", "answered", "completed", "failed", "busy", "no-answer"]).notNull(),
  duration: int("duration").default(0), // Duración en segundos
  recordingUrl: text("recordingUrl"), // URL de la grabación
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.0000"), // Costo de la llamada
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  outcome: mysqlEnum("outcome", ["interested", "callback", "not-interested", "voicemail", "no-answer", "wrong-number"]),
  notes: text("notes"),
  metadata: json("metadata"),
  startedAt: timestamp("startedAt"),
  answeredAt: timestamp("answeredAt"),
  endedAt: timestamp("endedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

/**
 * Email Campaigns - Templates for automated follow-ups
 */
export const emailCampaigns = mysqlTable("emailCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  body: text("body").notNull(),
  triggerType: mysqlEnum("triggerType", ["manual", "call-outcome", "lead-created", "scheduled"]).default("manual").notNull(),
  triggerCondition: json("triggerCondition").$type<{
    outcome?: string;
    status?: string;
    scoreThreshold?: number;
  }>(),
  sector: varchar("sector", { length: 50 }), // educativo, hotelero, residencial, etc.
  sequence: int("sequence"), // 1, 2, 3, 4 (order in follow-up sequence)
  delayDays: int("delayDays"), // 0, 3, 7, 14 (days to wait before sending)
  active: int("active").default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = typeof emailCampaigns.$inferInsert;

/**
 * Email Logs - Track all sent emails
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId"),
  leadId: int("leadId"), // Nullable - emails can be sent without a lead
  companyId: int("companyId").notNull(),
  userId: int("userId").notNull(), // Who triggered the email
  to: varchar("to", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 300 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced", "opened", "clicked"]).default("sent").notNull(),
  error: text("error"),
  metadata: json("metadata"),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  respondedAt: timestamp("respondedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Scheduled Tasks - Queue for delayed task execution
 */
export const scheduledTasks = mysqlTable("scheduledTasks", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  taskType: mysqlEnum("taskType", ["send-email", "update-lead-score", "send-notification", "custom"]).notNull(),
  taskData: json("taskData").$type<{
    leadId?: number;
    callId?: number;
    emailSubject?: string;
    emailBody?: string;
    outcome?: string;
    [key: string]: any;
  }>().notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "cancelled"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor").notNull(), // When to execute
  executedAt: timestamp("executedAt"),
  error: text("error"),
  retryCount: int("retryCount").default(0).notNull(),
  maxRetries: int("maxRetries").default(3).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ScheduledTask = typeof scheduledTasks.$inferSelect;
export type InsertScheduledTask = typeof scheduledTasks.$inferInsert;

/**
 * Marketing Leads - Prospects captured through marketing campaigns
 */
export const marketingLeads = mysqlTable("marketingLeads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  numSDRs: varchar("numSDRs", { length: 50 }),
  timeline: varchar("timeline", { length: 100 }),
  challenges: text("challenges"),
  source: mysqlEnum("source", ["whitepaper", "calculator", "demo-request", "linkedin", "seo", "referral"]).notNull(),
  leadScore: int("leadScore").default(0).notNull(), // 0-100 score
  stage: mysqlEnum("stage", ["awareness", "consideration", "decision", "qualified", "disqualified"]).default("awareness").notNull(),
  status: mysqlEnum("status", ["new", "contacted", "nurturing", "qualified", "converted", "lost"]).default("new").notNull(),
  assignedAgentId: int("assignedAgentId"), // Which AI agent is handling this lead
  lastContactedAt: timestamp("lastContactedAt"),
  qualifiedAt: timestamp("qualifiedAt"),
  convertedAt: timestamp("convertedAt"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MarketingLead = typeof marketingLeads.$inferSelect;
export type InsertMarketingLead = typeof marketingLeads.$inferInsert;

/**
 * Lead Activities - Track all interactions with marketing leads
 */
export const leadActivities = mysqlTable("leadActivities", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId").notNull(),
  activityType: mysqlEnum("activityType", ["email-sent", "email-opened", "email-clicked", "call-attempted", "call-connected", "demo-scheduled", "whitepaper-downloaded", "calculator-used", "page-visited"]).notNull(),
  description: text("description"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;

/**
 * Email Sequences - Automated email campaigns for lead nurturing
 */
export const emailSequences = mysqlTable("emailSequences", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetStage: mysqlEnum("targetStage", ["awareness", "consideration", "decision"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

/**
 * Email Sequence Steps - Individual emails in a sequence
 */
export const emailSequenceSteps = mysqlTable("emailSequenceSteps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  delayDays: int("delayDays").notNull(), // Days after previous step
  subject: varchar("subject", { length: 300 }).notNull(),
  body: text("body").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;
export type InsertEmailSequenceStep = typeof emailSequenceSteps.$inferInsert;

/**
 * LinkedIn Posts - AI-generated content for Juan Carlos Robledo's LinkedIn
 */
export const linkedInPosts = mysqlTable("linkedInPosts", {
  id: int("id").autoincrement().primaryKey(),
  postType: mysqlEnum("postType", ["thought_leadership", "case_study", "product_update", "industry_insight", "customer_success"]).notNull(),
  content: text("content").notNull(),
  tone: varchar("tone", { length: 50 }).default("professional").notNull(),
  status: mysqlEnum("status", ["pending", "scheduled", "published", "failed"]).default("pending").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  linkedInPostId: varchar("linkedInPostId", { length: 255 }),
  publishedUrl: varchar("publishedUrl", { length: 512 }),
  generatedBy: varchar("generatedBy", { length: 100 }).default("Ivy-Content").notNull(),
  error: text("error"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LinkedInPost = typeof linkedInPosts.$inferSelect;
export type InsertLinkedInPost = typeof linkedInPosts.$inferInsert;

/**
 * Multi-Channel Campaigns - Orchestrate email + LinkedIn workflows
 */
export const multiChannelCampaigns = mysqlTable("multiChannelCampaigns", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAudience: mysqlEnum("targetAudience", ["awareness", "consideration", "decision"]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "paused", "completed"]).default("draft").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  createdBy: int("createdBy").notNull(), // User ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MultiChannelCampaign = typeof multiChannelCampaigns.$inferSelect;
export type InsertMultiChannelCampaign = typeof multiChannelCampaigns.$inferInsert;

/**
 * Campaign Steps - Individual actions in a multi-channel campaign
 */
export const campaignSteps = mysqlTable("campaignSteps", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  stepNumber: int("stepNumber").notNull(), // Order of execution
  delayDays: int("delayDays").notNull(), // Days after previous step (0 for first step)
  channelType: mysqlEnum("channelType", ["email", "linkedin"]).notNull(),
  actionType: varchar("actionType", { length: 100 }).notNull(), // "send_email", "generate_linkedin_post"
  actionConfig: text("actionConfig").notNull(), // JSON config for the action
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignStep = typeof campaignSteps.$inferSelect;
export type InsertCampaignStep = typeof campaignSteps.$inferInsert;

/**
 * Campaign Executions - Track campaign execution per lead
 */
export const campaignExecutions = mysqlTable("campaignExecutions", {
  id: int("id").autoincrement().primaryKey(),
  campaignId: int("campaignId").notNull(),
  leadId: int("leadId").notNull(),
  currentStepNumber: int("currentStepNumber").default(0).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CampaignExecution = typeof campaignExecutions.$inferSelect;
export type InsertCampaignExecution = typeof campaignExecutions.$inferInsert;

/**
 * FAGOR Campaign Contacts - Contacts imported for FAGOR training campaigns
 */
export const fagorContacts = mysqlTable("fagorContacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  company: varchar("company", { length: 255 }),
  role: varchar("role", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  source: varchar("source", { length: 100 }).default("csv_import").notNull(), // csv_import, manual, api
  tags: json("tags").$type<string[]>(), // ["manufacturing", "cnc", "midwest"]
  customFields: json("customFields").$type<Record<string, any>>(), // Additional custom data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FagorContact = typeof fagorContacts.$inferSelect;
export type InsertFagorContact = typeof fagorContacts.$inferInsert;

/**
 * FAGOR Campaign Enrollments - Track which contacts are enrolled in which campaigns
 */
export const fagorCampaignEnrollments = mysqlTable("fagorCampaignEnrollments", {
  id: int("id").autoincrement().primaryKey(),
  contactId: int("contactId").notNull(),
  campaignName: varchar("campaignName", { length: 255 }).notNull(), // "FAGOR_CNC_Training_2026"
  currentStep: int("currentStep").default(0).notNull(), // 0 = not started, 1 = email 1 sent, 2 = email 2 sent, 3 = email 3 sent
  status: mysqlEnum("status", ["active", "paused", "completed", "unsubscribed"]).default("active").notNull(),
  email1SentAt: timestamp("email1SentAt"),
  email1OpenedAt: timestamp("email1OpenedAt"),
  email1ClickedAt: timestamp("email1ClickedAt"),
  email2SentAt: timestamp("email2SentAt"),
  email2OpenedAt: timestamp("email2OpenedAt"),
  email2ClickedAt: timestamp("email2ClickedAt"),
  email3SentAt: timestamp("email3SentAt"),
  email3OpenedAt: timestamp("email3OpenedAt"),
  email3ClickedAt: timestamp("email3ClickedAt"),
  respondedAt: timestamp("respondedAt"), // When they replied to any email
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FagorCampaignEnrollment = typeof fagorCampaignEnrollments.$inferSelect;
export type InsertFagorCampaignEnrollment = typeof fagorCampaignEnrollments.$inferInsert;

/**
 * FAGOR Email Events - Detailed tracking of all email events (opens, clicks, bounces)
 */
export const fagorEmailEvents = mysqlTable("fagorEmailEvents", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  contactId: int("contactId").notNull(),
  emailNumber: int("emailNumber").notNull(), // 1, 2, or 3
  eventType: mysqlEnum("eventType", ["sent", "delivered", "opened", "clicked", "bounced", "complained", "unsubscribed"]).notNull(),
  messageId: varchar("messageId", { length: 255 }), // SendGrid message ID
  userAgent: text("userAgent"), // Browser/email client info
  ipAddress: varchar("ipAddress", { length: 45 }), // IP address of opener/clicker
  clickedUrl: text("clickedUrl"), // Which URL was clicked
  metadata: json("metadata").$type<Record<string, any>>(), // Additional event data
  eventAt: timestamp("eventAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FagorEmailEvent = typeof fagorEmailEvents.$inferSelect;
export type InsertFagorEmailEvent = typeof fagorEmailEvents.$inferInsert;

/**
 * Call Transcripts - Transcripciones de llamadas con IA
 */
export const callTranscripts = mysqlTable("callTranscripts", {
  id: int("id").autoincrement().primaryKey(),
  callId: int("callId").notNull(), // Relación con calls
  speaker: mysqlEnum("speaker", ["agent", "customer"]).notNull(),
  text: text("text").notNull(),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  sentimentScore: decimal("sentimentScore", { precision: 5, scale: 2 }), // -1.00 a 1.00
  timestamp: int("timestamp").notNull(), // Timestamp en segundos desde inicio de llamada
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CallTranscript = typeof callTranscripts.$inferSelect;
export type InsertCallTranscript = typeof callTranscripts.$inferInsert;

/**
 * SMS Messages - Mensajes SMS (Telnyx SMS API)
 */
export const smsMessages = mysqlTable("smsMessages", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  leadId: int("leadId"), // Opcional: si el SMS está relacionado con un lead
  messageSid: varchar("messageSid", { length: 255 }).notNull().unique(), // Telnyx Message ID
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  from: varchar("from", { length: 50 }).notNull(),
  to: varchar("to", { length: 50 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["queued", "sending", "sent", "delivered", "failed", "undelivered"]).notNull(),
  mediaUrl: text("mediaUrl"), // URL de imagen/video si es MMS
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.0000"),
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

/**
 * WhatsApp Conversations - Conversaciones de WhatsApp Business API
 */
export const whatsappConversations = mysqlTable("whatsappConversations", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  leadId: int("leadId"), // Opcional: si la conversación está relacionada con un lead
  conversationId: varchar("conversationId", { length: 255 }).notNull().unique(), // Telnyx Conversation ID
  phoneNumber: varchar("phoneNumber", { length: 50 }).notNull(), // Número del cliente
  status: mysqlEnum("status", ["active", "closed"]).default("active").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type WhatsappConversation = typeof whatsappConversations.$inferSelect;
export type InsertWhatsappConversation = typeof whatsappConversations.$inferInsert;

/**
 * WhatsApp Messages - Mensajes individuales de WhatsApp
 */
export const whatsappMessages = mysqlTable("whatsappMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(), // Relación con whatsappConversations
  messageSid: varchar("messageSid", { length: 255 }).notNull().unique(), // Telnyx Message ID
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  messageType: mysqlEnum("messageType", ["text", "image", "video", "document", "audio", "template"]).notNull(),
  body: text("body"),
  mediaUrl: text("mediaUrl"),
  status: mysqlEnum("status", ["queued", "sending", "sent", "delivered", "read", "failed"]).notNull(),
  conversationType: mysqlEnum("conversationType", ["marketing", "utility", "authentication", "service"]),
  cost: decimal("cost", { precision: 10, scale: 4 }).default("0.0000"),
  errorCode: varchar("errorCode", { length: 50 }),
  errorMessage: text("errorMessage"),
  sentAt: timestamp("sentAt"),
  deliveredAt: timestamp("deliveredAt"),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WhatsappMessage = typeof whatsappMessages.$inferSelect;
export type InsertWhatsappMessage = typeof whatsappMessages.$inferInsert;

/**
 * Communication Analytics - Métricas y analytics de comunicaciones
 */
export const communicationAnalytics = mysqlTable("communicationAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  companyId: int("companyId").notNull(),
  date: date("date").notNull(), // Fecha del reporte
  channel: mysqlEnum("channel", ["voice", "sms", "whatsapp"]).notNull(),
  totalMessages: int("totalMessages").default(0),
  successfulMessages: int("successfulMessages").default(0),
  failedMessages: int("failedMessages").default(0),
  totalCost: decimal("totalCost", { precision: 10, scale: 2 }).default("0.00"),
  averageDuration: int("averageDuration").default(0), // Solo para llamadas, en segundos
  positiveInteractions: int("positiveInteractions").default(0),
  neutralInteractions: int("neutralInteractions").default(0),
  negativeInteractions: int("negativeInteractions").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CommunicationAnalytics = typeof communicationAnalytics.$inferSelect;
export type InsertCommunicationAnalytics = typeof communicationAnalytics.$inferInsert;
