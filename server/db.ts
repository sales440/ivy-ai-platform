import { eq, and, desc, asc, sql, gte, lte, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  InsertUser,
  users,
  companies,
  InsertCompany,
  userCompanies,
  InsertUserCompany,
  UserCompany,
  userPreferences,
  InsertUserPreferences,
  UserPreferences,
  agents,
  InsertAgent,
  Agent,
  tasks,
  InsertTask,
  Task,
  workflows,
  InsertWorkflow,
  Workflow,
  workflowExecutions,
  InsertWorkflowExecution,
  WorkflowExecution,
  leads,
  InsertLead,
  Lead,
  tickets,
  InsertTicket,
  Ticket,
  knowledgeBase,
  InsertKnowledgeArticle,
  KnowledgeArticle,
  agentCommunications,
  InsertAgentCommunication,
  systemMetrics,
  InsertSystemMetric,
  commandHistory,
  InsertCommandHistory,
  agentConfigurations,
  InsertAgentConfiguration,
  AgentConfiguration,
  auditLogs,
  InsertAuditLog,
  AuditLog,
  crmIntegrations,
  InsertCrmIntegration,
  CrmIntegration,
  prospectSearches,
  InsertProspectSearch,
  ProspectSearch,
  savedSearches,
  InsertSavedSearch,
  SavedSearch,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: mysql.Pool | null = null;
let _lastConnectionAttempt = 0;
const RECONNECT_INTERVAL = 5000; // 5 seconds

// Create connection pool with automatic reconnection
export async function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  // Prevent mysql2 from trying to connect to a file (SQLite) URL
  if (process.env.DATABASE_URL.startsWith('file:')) {
    console.warn("[Database] SQLite connection string detected but MySQL driver is active. Database features will be disabled.");
    return null;
  }

  // If we have a healthy connection, return it
  if (_db && _pool) {
    try {
      // Test connection
      await _pool.query('SELECT 1');
      return _db;
    } catch (error) {
      console.warn("[Database] Connection lost, attempting reconnect...");
      _db = null;
      _pool = null;
    }
  }

  // Throttle reconnection attempts
  const now = Date.now();
  if (now - _lastConnectionAttempt < RECONNECT_INTERVAL) {
    return null;
  }
  _lastConnectionAttempt = now;

  try {
    // Create new connection pool
    _pool = mysql.createPool({
      uri: process.env.DATABASE_URL,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });

    _db = drizzle(_pool);
    console.log("[Database] Connected successfully");
    return _db;
  } catch (error) {
    console.error("[Database] Failed to connect:", error);
    _db = null;
    _pool = null;
    return null;
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get users: database not available");
    return [];
  }

  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get users:", error);
    return [];
  }
}

// ============================================================================
// AGENT MANAGEMENT
// ============================================================================

export async function createAgent(agent: InsertAgent): Promise<Agent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(agents).values(agent);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(agents).where(eq(agents.id, insertedId)).limit(1);
  return created[0];
}

export async function getAgentById(id: number): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0];
}

export async function getAgentByAgentId(agentId: string): Promise<Agent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agents).where(eq(agents.agentId, agentId)).limit(1);
  return result[0];
}

export async function getAllAgents(companyId?: number): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    return await db.select().from(agents).where(eq(agents.companyId, companyId)).orderBy(desc(agents.createdAt));
  }
  return await db.select().from(agents).orderBy(desc(agents.createdAt));
}

export async function getAgentsByType(type: Agent["type"]): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(agents).where(eq(agents.type, type));
}

export async function getAgentCount(companyId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = companyId
    ? await db.select().from(agents).where(eq(agents.companyId, companyId))
    : await db.select().from(agents);
  return result.length;
}

export async function getActiveAgentCount(companyId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = companyId
    ? await db.select().from(agents).where(and(eq(agents.companyId, companyId), eq(agents.status, 'active')))
    : await db.select().from(agents).where(eq(agents.status, 'active'));
  return result.length;
}

export async function updateAgentStatus(id: number, status: Agent["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(agents).set({ status }).where(eq(agents.id, id));
}

export async function updateAgentKPIs(id: number, kpis: Record<string, number>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(agents).set({ kpis }).where(eq(agents.id, id));
}

// ============================================================================
// TASK MANAGEMENT
// ============================================================================

export async function createTask(task: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(task);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(tasks).where(eq(tasks.id, insertedId)).limit(1);
  return created[0];
}

export async function getTaskById(id: number): Promise<Task | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function getTasksByAgent(agentId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tasks).where(eq(tasks.agentId, agentId)).orderBy(desc(tasks.createdAt));
}

export async function updateTaskStatus(id: number, status: Task["status"], output?: any, error?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { status };
  if (output) updateData.output = output;
  if (error) updateData.error = error;
  if (status === "completed" || status === "failed") {
    updateData.completedAt = new Date();
  }

  await db.update(tasks).set(updateData).where(eq(tasks.id, id));
}

// ============================================================================
// WORKFLOW MANAGEMENT
// ============================================================================

export async function createWorkflow(workflow: InsertWorkflow): Promise<Workflow> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(workflows).values(workflow);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(workflows).where(eq(workflows.id, insertedId)).limit(1);
  return created[0];
}

export async function getWorkflowById(id: number): Promise<Workflow | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(workflows).where(eq(workflows.id, id)).limit(1);
  return result[0];
}

export async function getAllWorkflows(): Promise<Workflow[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(workflows).where(eq(workflows.isActive, true)).orderBy(desc(workflows.createdAt));
}

export async function createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(workflowExecutions).values(execution);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, insertedId)).limit(1);
  return created[0];
}

export async function updateWorkflowExecution(id: number, updates: Partial<WorkflowExecution>): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(workflowExecutions).set(updates).where(eq(workflowExecutions.id, id));
}

// ============================================================================
// LEAD MANAGEMENT
// ============================================================================

export async function createLead(lead: InsertLead): Promise<Lead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(lead);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(leads).where(eq(leads.id, insertedId)).limit(1);
  return created[0];
}

export async function getLeadById(id: number): Promise<Lead | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result[0];
}

export async function getAllLeads(companyId?: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    return await db.select().from(leads).where(eq(leads.companyId, companyId)).orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadCount(companyId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = companyId
    ? await db.select().from(leads).where(eq(leads.companyId, companyId))
    : await db.select().from(leads);
  return result.length;
}

export async function getLeadsByStatus(status: Lead["status"], companyId?: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    return await db.select().from(leads).where(and(eq(leads.status, status), eq(leads.companyId, companyId))).orderBy(desc(leads.createdAt));
  }
  return await db.select().from(leads).where(eq(leads.status, status)).orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(id: number, status: Lead["status"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function updateLeadMetadata(id: number, metadata: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ metadata }).where(eq(leads.id, id));
}

// ============================================================================
// TICKET MANAGEMENT
// ============================================================================

export async function createTicket(ticket: InsertTicket): Promise<Ticket> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Usar SQL template de Drizzle para evitar problemas con valores default
  const result: any = await db.execute(sql`
    INSERT INTO tickets (
      ticketId, customerId, customerEmail, subject, issue, category,
      priority, status, assignedTo, resolution, resolutionTime,
      customerSatisfaction, escalationReason, metadata, resolvedAt
    ) VALUES (
      ${ticket.ticketId},
      ${ticket.customerId ?? null},
      ${ticket.customerEmail ?? null},
      ${ticket.subject},
      ${ticket.issue},
      ${ticket.category ?? null},
      ${ticket.priority ?? 'medium'},
      ${ticket.status ?? 'open'},
      ${ticket.assignedTo ?? null},
      ${ticket.resolution ?? null},
      ${ticket.resolutionTime ?? null},
      ${ticket.customerSatisfaction ?? null},
      ${ticket.escalationReason ?? null},
      ${ticket.metadata ? JSON.stringify(ticket.metadata) : null},
      ${ticket.resolvedAt ?? null}
    )
  `);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(tickets).where(eq(tickets.id, insertedId)).limit(1);
  return created[0];
}

export async function getTicketById(id: number): Promise<Ticket | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return result[0];
}

export async function getAllTickets(companyId?: number): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    return await db.select().from(tickets).where(eq(tickets.companyId, companyId)).orderBy(desc(tickets.createdAt));
  }
  return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function getTicketCount(companyId?: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = companyId
    ? await db.select().from(tickets).where(eq(tickets.companyId, companyId))
    : await db.select().from(tickets);
  return result.length;
}

export async function getTicketsByStatus(status: Ticket["status"], companyId?: number): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) return [];

  if (companyId) {
    return await db.select().from(tickets).where(and(eq(tickets.status, status), eq(tickets.companyId, companyId))).orderBy(desc(tickets.createdAt));
  }
  return await db.select().from(tickets).where(eq(tickets.status, status)).orderBy(desc(tickets.createdAt));
}

export async function updateTicketStatus(id: number, status: Ticket["status"], resolution?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { status };
  if (resolution) updateData.resolution = resolution;
  if (status === "resolved" || status === "closed") {
    updateData.resolvedAt = new Date();
  }

  await db.update(tickets).set(updateData).where(eq(tickets.id, id));
}

// ============================================================================
// KNOWLEDGE BASE
// ============================================================================

export async function createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(knowledgeBase).values(article);
  const insertedId = Number(result[0].insertId);

  const created = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, insertedId)).limit(1);
  return created[0];
}

export async function searchKnowledgeBase(query: string, category?: string): Promise<KnowledgeArticle[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    let baseQuery = db.select().from(knowledgeBase).where(eq(knowledgeBase.isPublished, true));

    if (category) {
      baseQuery = baseQuery.where(eq(knowledgeBase.category, category));
    }

    const articles = await baseQuery;

    // Simple keyword matching (in production, use vector search or full-text search)
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

    const scored = articles.map(article => {
      const content = `${article.title} ${article.content} ${article.tags?.join(' ') || ''}`.toLowerCase();
      const score = keywords.reduce((acc, keyword) => {
        const count = (content.match(new RegExp(keyword, 'g')) || []).length;
        return acc + count;
      }, 0);

      return { article, score };
    });

    // Return top 3 most relevant articles
    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.article);
  } catch (error) {
    console.error("[Database] Failed to search knowledge base:", error);
    return [];
  }
}

// ============================================================================
// AGENT COMMUNICATIONS
// ============================================================================

export async function logAgentCommunication(comm: InsertAgentCommunication): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(agentCommunications).values(comm);
}

// ============================================================================
// SYSTEM METRICS
// ============================================================================

export async function recordMetric(metric: InsertSystemMetric): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(systemMetrics).values(metric);
}

export async function getMetricsByAgent(agentId: number, limit: number = 100): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(systemMetrics)
    .where(eq(systemMetrics.agentId, agentId))
    .orderBy(desc(systemMetrics.recordedAt))
    .limit(limit);
}

// ============================================================================
// COMMAND HISTORY
// ============================================================================

export async function logCommand(cmd: InsertCommandHistory): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(commandHistory).values(cmd);
}

export async function getCommandHistory(userId: number, limit: number = 50): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(commandHistory)
    .where(eq(commandHistory.userId, userId))
    .orderBy(desc(commandHistory.createdAt))
    .limit(limit);
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { notifications } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return result;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  const { notifications } = await import("../drizzle/schema");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;

  const { notifications } = await import("../drizzle/schema");
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  const { notifications } = await import("../drizzle/schema");
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

export async function createNotification(data: {
  userId: number;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  category: "workflow" | "agent" | "lead" | "ticket" | "system";
  relatedId?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  const { notifications } = await import("../drizzle/schema");
  const result = await db.insert(notifications).values({
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    category: data.category,
    relatedId: data.relatedId,
    isRead: false,
  });

  return result;
}

// ============================================================================
// CSV EXPORT
// ============================================================================

export async function getAllLeadsForExport() {
  const db = await getDb();
  if (!db) return [];

  const { leads } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(leads)
    .orderBy(desc(leads.createdAt));

  return result;
}

export async function getAllTicketsForExport() {
  const db = await getDb();
  if (!db) return [];

  const { tickets } = await import("../drizzle/schema");
  const result = await db
    .select()
    .from(tickets)
    .orderBy(desc(tickets.createdAt));

  return result;
}

// ============================================================================
// USER PREFERENCES MANAGEMENT
// ============================================================================

export async function getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user preferences: database not available");
    return undefined;
  }

  try {
    const result = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get user preferences:", error);
    return undefined;
  }
}

export async function upsertUserPreferences(prefs: InsertUserPreferences): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user preferences: database not available");
    return;
  }

  try {
    await db
      .insert(userPreferences)
      .values(prefs)
      .onDuplicateKeyUpdate({
        set: {
          theme: prefs.theme,
          language: prefs.language,
          notificationsEnabled: prefs.notificationsEnabled,
          emailNotifications: prefs.emailNotifications,
          workflowNotifications: prefs.workflowNotifications,
          leadNotifications: prefs.leadNotifications,
          ticketNotifications: prefs.ticketNotifications,
          updatedAt: new Date(),
        }
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user preferences:", error);
    throw error;
  }
}

export async function createDefaultUserPreferences(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create default preferences: database not available");
    return;
  }

  try {
    await db.insert(userPreferences).values({
      userId,
      theme: "dark",
      language: "en",
      notificationsEnabled: true,
      emailNotifications: true,
      workflowNotifications: true,
      leadNotifications: true,
      ticketNotifications: true,
    });
  } catch (error) {
    // Ignore duplicate key errors (preferences already exist)
    if (!(error as any).message?.includes('Duplicate entry')) {
      console.error("[Database] Failed to create default preferences:", error);
    }
  }
}

// ==================== Companies ====================

export async function getAllCompanies() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get companies: database not available");
    return [];
  }

  try {
    const result = await db.select().from(companies);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get companies:", error);
    return [];
  }
}

export async function getCompanyById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get company: database not available");
    return undefined;
  }

  try {
    const result = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get company:", error);
    return undefined;
  }
}

export async function createCompany(data: InsertCompany) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(companies).values(data);
    return { id: Number(result[0].insertId), ...data };
  } catch (error) {
    console.error("[Database] Failed to create company:", error);
    throw error;
  }
}

export async function updateCompany(id: number, data: Partial<InsertCompany>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(companies).set({ ...data, updatedAt: new Date() }).where(eq(companies.id, id));
    return await getCompanyById(id);
  } catch (error) {
    console.error("[Database] Failed to update company:", error);
    throw error;
  }
}

export async function deleteCompany(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.delete(companies).where(eq(companies.id, id));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete company:", error);
    throw error;
  }
}

// ============================================================================
// USER-COMPANY ASSIGNMENTS
// ============================================================================

export async function getUserCompanies(userId: number): Promise<UserCompany[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(userCompanies).where(eq(userCompanies.userId, userId));
  } catch (error) {
    console.error("[Database] Failed to get user companies:", error);
    return [];
  }
}

export async function getCompanyUsers(companyId: number): Promise<UserCompany[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(userCompanies).where(eq(userCompanies.companyId, companyId));
  } catch (error) {
    console.error("[Database] Failed to get company users:", error);
    return [];
  }
}

export async function assignUserToCompany(data: InsertUserCompany) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(userCompanies).values(data);
    return { id: Number(result[0].insertId), ...data };
  } catch (error) {
    console.error("[Database] Failed to assign user to company:", error);
    throw error;
  }
}

export async function removeUserFromCompany(userId: number, companyId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.delete(userCompanies).where(
      and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, companyId)
      )
    );
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to remove user from company:", error);
    throw error;
  }
}

export async function updateUserCompanyRole(
  userId: number,
  companyId: number,
  role: "viewer" | "member" | "admin"
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(userCompanies)
      .set({ role })
      .where(
        and(
          eq(userCompanies.userId, userId),
          eq(userCompanies.companyId, companyId)
        )
      );
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update user company role:", error);
    throw error;
  }
}

export async function isUserAssignedToCompany(userId: number, companyId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const result = await db.select().from(userCompanies).where(
      and(
        eq(userCompanies.userId, userId),
        eq(userCompanies.companyId, companyId)
      )
    ).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Database] Failed to check user company assignment:", error);
    return false;
  }
}

// ============================================================================
// COMPANY METRICS
// ============================================================================

export async function getCompanyMetrics(companyId: number, startDate?: string, endDate?: string) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Build date filter conditions
    const dateConditions = [];
    if (startDate) {
      dateConditions.push(sql`${leads.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      dateConditions.push(sql`${leads.createdAt} <= ${endDate}`);
    }

    // Get leads metrics with date filter
    const leadsConditions = [eq(leads.companyId, companyId), ...dateConditions];
    const companyLeads = await db.select().from(leads).where(and(...leadsConditions));
    const qualifiedLeads = companyLeads.filter(l => l.status === 'qualified' || l.status === 'converted');
    const convertedLeads = companyLeads.filter(l => l.status === 'converted');

    // Get tickets metrics with date filter
    const ticketDateConditions = [];
    if (startDate) {
      ticketDateConditions.push(sql`${tickets.createdAt} >= ${startDate}`);
    }
    if (endDate) {
      ticketDateConditions.push(sql`${tickets.createdAt} <= ${endDate}`);
    }
    const ticketsConditions = [eq(tickets.companyId, companyId), ...ticketDateConditions];
    const companyTickets = await db.select().from(tickets).where(and(...ticketsConditions));
    const openTickets = companyTickets.filter(t => t.status === 'open' || t.status === 'in_progress');
    const resolvedTickets = companyTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

    // Get agents metrics
    const companyAgents = await db.select().from(agents).where(eq(agents.companyId, companyId));
    const activeAgents = companyAgents.filter(a => a.status === 'active');

    // Calculate average qualification score
    const avgQualificationScore = companyLeads.length > 0
      ? companyLeads.reduce((sum, l) => sum + (l.qualificationScore || 0), 0) / companyLeads.length
      : 0;

    // Calculate average resolution time (in hours)
    const ticketsWithResolutionTime = companyTickets.filter(t => t.resolutionTime !== null);
    const avgResolutionTime = ticketsWithResolutionTime.length > 0
      ? ticketsWithResolutionTime.reduce((sum, t) => sum + (t.resolutionTime || 0), 0) / ticketsWithResolutionTime.length
      : 0;

    return {
      companyId,
      leads: {
        total: companyLeads.length,
        qualified: qualifiedLeads.length,
        converted: convertedLeads.length,
        conversionRate: companyLeads.length > 0 ? (convertedLeads.length / companyLeads.length) * 100 : 0,
        avgQualificationScore: Math.round(avgQualificationScore),
      },
      tickets: {
        total: companyTickets.length,
        open: openTickets.length,
        resolved: resolvedTickets.length,
        resolutionRate: companyTickets.length > 0 ? (resolvedTickets.length / companyTickets.length) * 100 : 0,
        avgResolutionTime: Math.round(avgResolutionTime),
      },
      agents: {
        total: companyAgents.length,
        active: activeAgents.length,
      },
    };
  } catch (error) {
    console.error("[Database] Failed to get company metrics:", error);
    return null;
  }
}

export async function getAllCompaniesMetrics() {
  const db = await getDb();
  if (!db) return [];

  try {
    const allCompanies = await db.select().from(companies);
    const metricsPromises = allCompanies.map(company => getCompanyMetrics(company.id));
    const metrics = await Promise.all(metricsPromises);

    return metrics.filter(m => m !== null);
  } catch (error) {
    console.error("[Database] Failed to get all companies metrics:", error);
    return [];
  }
}

// ============================================================================
// AGENT CONFIGURATIONS
// ============================================================================

export async function getAgentConfiguration(companyId: number, agentType: AgentConfiguration["agentType"]) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.select().from(agentConfigurations).where(
      and(
        eq(agentConfigurations.companyId, companyId),
        eq(agentConfigurations.agentType, agentType)
      )
    ).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get agent configuration:", error);
    return null;
  }
}

export async function getAllAgentConfigurations(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return await db.select().from(agentConfigurations).where(eq(agentConfigurations.companyId, companyId));
  } catch (error) {
    console.error("[Database] Failed to get agent configurations:", error);
    return [];
  }
}

export async function upsertAgentConfiguration(data: InsertAgentConfiguration) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.insert(agentConfigurations).values(data).onDuplicateKeyUpdate({
      set: {
        temperature: data.temperature,
        maxTokens: data.maxTokens,
        systemPrompt: data.systemPrompt,
        customInstructions: data.customInstructions,
        isActive: data.isActive,
        updatedAt: new Date(),
      }
    });
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to upsert agent configuration:", error);
    throw error;
  }
}

export async function deleteAgentConfiguration(companyId: number, agentType: AgentConfiguration["agentType"]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.delete(agentConfigurations).where(
      and(
        eq(agentConfigurations.companyId, companyId),
        eq(agentConfigurations.agentType, agentType)
      )
    );
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to delete agent configuration:", error);
    throw error;
  }
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(auditLogs).values(log);
    return { id: Number(result.insertId), ...log };
  } catch (error) {
    console.error("[Database] Failed to create audit log:", error);
    return null;
  }
}

export async function getAllAuditLogs(filters?: {
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(auditLogs.userId, filters.userId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters?.entityType) {
      conditions.push(eq(auditLogs.entityType, filters.entityType));
    }
    if (filters?.startDate) {
      conditions.push(sql`${auditLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }

    if (conditions.length > 0) {
      return await db.select().from(auditLogs).where(and(...conditions)).orderBy(desc(auditLogs.createdAt));
    }

    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get audit logs:", error);
    return [];
  }
}

// ============================================================================
// CRM Integrations
// ============================================================================

export async function getCrmIntegrations(companyId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(crmIntegrations).where(eq(crmIntegrations.companyId, companyId));
}

export async function getCrmIntegrationById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(crmIntegrations).where(eq(crmIntegrations.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertCrmIntegration(integration: InsertCrmIntegration & { id?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (integration.id) {
    // Update existing
    await db.update(crmIntegrations)
      .set({
        credentials: integration.credentials,
        config: integration.config,
        isActive: integration.isActive,
        updatedAt: new Date(),
      })
      .where(eq(crmIntegrations.id, integration.id));
    return integration.id;
  } else {
    // Insert new
    const result = await db.insert(crmIntegrations).values(integration);
    return Number(result.insertId);
  }
}

export async function deleteCrmIntegration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(crmIntegrations).where(eq(crmIntegrations.id, id));
  return { success: true };
}

export async function updateCrmIntegrationSyncStatus(
  id: number,
  status: { lastSyncAt?: Date; syncStatus?: "idle" | "syncing" | "error"; syncError?: string | null }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(crmIntegrations)
    .set({
      ...status,
      updatedAt: new Date(),
    })
    .where(eq(crmIntegrations.id, id));
}

export async function getUserCompanyRole(userId: number, companyId: number): Promise<"viewer" | "analyst" | "member" | "manager" | "admin" | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(userCompanies)
    .where(and(eq(userCompanies.userId, userId), eq(userCompanies.companyId, companyId)))
    .limit(1);

  return result.length > 0 ? result[0].role : null;
}




// ============================================================================
// PROSPECT SEARCHES
// ============================================================================

export async function createProspectSearch(search: InsertProspectSearch) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(prospectSearches).values(search);
    return { id: Number(result.insertId), ...search };
  } catch (error) {
    console.error("[Database] Failed to create prospect search:", error);
    return null;
  }
}

export async function getProspectSearchMetrics(companyId: number, filters?: {
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDb();
  if (!db) return null;

  try {
    const conditions = [eq(prospectSearches.companyId, companyId)];

    if (filters?.startDate) {
      conditions.push(sql`${prospectSearches.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${prospectSearches.createdAt} <= ${filters.endDate}`);
    }

    const searches = await db
      .select()
      .from(prospectSearches)
      .where(and(...conditions))
      .orderBy(desc(prospectSearches.createdAt));

    return searches;
  } catch (error) {
    console.error("[Database] Failed to get prospect search metrics:", error);
    return null;
  }
}

export async function getLeadsByProspectSearchIds(searchIds: number[]) {
  const db = await getDb();
  if (!db) return [];

  if (searchIds.length === 0) return [];

  return await db
    .select()
    .from(leads)
    .where(inArray(leads.prospectSearchId, searchIds));
}

// ========== Saved Searches Functions ==========

export async function createSavedSearch(data: InsertSavedSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(savedSearches).values(data);
  return result.insertId;
}

export async function getSavedSearches(userId: number, companyId?: number | null) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(savedSearches.userId, userId)];
  if (companyId) {
    conditions.push(eq(savedSearches.companyId, companyId));
  }

  return await db
    .select()
    .from(savedSearches)
    .where(and(...conditions))
    .orderBy(desc(savedSearches.usageCount), desc(savedSearches.updatedAt));
}

export async function updateSavedSearchUsage(searchId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(savedSearches)
    .set({
      usageCount: sql`${savedSearches.usageCount} + 1`,
      updatedAt: new Date()
    })
    .where(eq(savedSearches.id, searchId));
}

export async function deleteSavedSearch(searchId: number, userId: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .delete(savedSearches)
    .where(and(
      eq(savedSearches.id, searchId),
      eq(savedSearches.userId, userId)
    ));
}

// ============================================================================
// PIPELINE ANALYTICS
// ============================================================================

export async function getPipelineMetrics(filters: {
  companyId?: number;
  startDate?: string;
  endDate?: string;
}) {
  const db = await getDb();
  if (!db) return {
    stages: [],
    conversionRates: [],
    avgTimeByStage: [],
    bottleneck: null,
    totalConversionRate: 0,
    avgTimeToConvert: 0,
  };

  // Get all leads with filters
  let query = db.select().from(leads);

  const conditions = [];
  if (filters.companyId) {
    conditions.push(eq(leads.companyId, filters.companyId));
  }
  if (filters.startDate) {
    conditions.push(sql`${leads.createdAt} >= ${filters.startDate}`);
  }
  if (filters.endDate) {
    conditions.push(sql`${leads.createdAt} <= ${filters.endDate}`);
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const allLeads = await query;

  // Define pipeline stages in order
  const stages = [
    { name: 'new', label: 'New Leads' },
    { name: 'contacted', label: 'Contacted' },
    { name: 'qualified', label: 'Qualified' },
    { name: 'converted', label: 'Converted' },
  ];

  // Count leads in each stage
  const stageCounts = stages.map(stage => ({
    stage: stage.label,
    count: allLeads.filter(l => l.status === stage.name).length,
  }));

  // Calculate conversion rates between stages
  const conversionRates = [];
  for (let i = 0; i < stages.length - 1; i++) {
    const currentCount = stageCounts[i].count;
    const nextCount = stageCounts[i + 1].count;
    const rate = currentCount > 0 ? Math.round((nextCount / currentCount) * 100) : 0;
    conversionRates.push({
      from: stages[i].label,
      to: stages[i + 1].label,
      rate,
    });
  }

  // Calculate average time in each stage (mock data for now - would need timestamps)
  const avgTimeByStage = stages.map(stage => ({
    stage: stage.label,
    avgDays: Math.floor(Math.random() * 10) + 1, // TODO: Calculate from actual timestamps
  }));

  // Detect bottleneck (stage with lowest conversion rate)
  const bottleneck = conversionRates.length > 0
    ? conversionRates.reduce((min, curr) => curr.rate < min.rate ? curr : min)
    : null;

  // Calculate total conversion rate (new → converted)
  const totalNew = stageCounts[0].count;
  const totalConverted = stageCounts[stageCounts.length - 1].count;
  const totalConversionRate = totalNew > 0 ? Math.round((totalConverted / totalNew) * 100) : 0;

  // Calculate average time to convert (sum of all stage times)
  const avgTimeToConvert = avgTimeByStage.reduce((sum, stage) => sum + stage.avgDays, 0);

  return {
    stages: stageCounts,
    conversionRates,
    avgTimeByStage,
    bottleneck,
    totalConversionRate,
    avgTimeToConvert,
  };
}

// ============================================================================
// CALLS MANAGEMENT (Ivy-Call)
// ============================================================================

export async function createCall(call: InsertCall): Promise<Call> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(calls).values(call);
  const insertedId = Number(result[0].insertId);

  const insertedCall = await getCallById(insertedId);
  if (!insertedCall) throw new Error("Failed to retrieve inserted call");

  return insertedCall;
}

export async function getCallById(id: number): Promise<Call | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(calls).where(eq(calls.id, id)).limit(1);
  return result[0];
}

export async function getCallsByLeadId(leadId: number): Promise<Call[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(calls).where(eq(calls.leadId, leadId)).orderBy(desc(calls.createdAt));
}

export async function getCallsByCompanyId(companyId: number): Promise<Call[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(calls).where(eq(calls.companyId, companyId)).orderBy(desc(calls.createdAt));
}

export async function updateCallStatus(id: number, status: Call["status"], completedAt?: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { status };
  if (completedAt) {
    updateData.completedAt = completedAt;
  }

  await db.update(calls).set(updateData).where(eq(calls.id, id));
}

export async function updateCallTranscript(id: number, transcript: string, sentiment?: Call["sentiment"], outcome?: Call["outcome"]): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { transcript };
  if (sentiment) updateData.sentiment = sentiment;
  if (outcome) updateData.outcome = outcome;

  await db.update(calls).set(updateData).where(eq(calls.id, id));
}

export async function updateCallRecording(id: number, recordingUrl: string, duration?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const updateData: any = { recordingUrl };
  if (duration) updateData.duration = duration;

  await db.update(calls).set(updateData).where(eq(calls.id, id));
}


/**
 * Update lead score with history tracking
 */
export async function updateLeadScore(
  leadId: number,
  scoreChange: number,
  reason: string,
  userId: number
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update lead score: database not available");
    return;
  }

  try {
    // Get current lead
    const leadResult = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    const lead = leadResult[0];

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`);
    }

    const currentScore = lead.qualificationScore || 0;
    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange)); // Clamp between 0-100

    // Build score history entry
    const historyEntry = {
      score: newScore,
      change: scoreChange,
      reason,
      timestamp: new Date().toISOString(),
      userId,
    };

    // Get existing history or create new array
    const existingHistory = (lead.scoreHistory as any[]) || [];
    const newHistory = [...existingHistory, historyEntry];

    // Update lead with new score and history
    await db.update(leads)
      .set({
        qualificationScore: newScore,
        scoreHistory: newHistory as any,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    console.log(`[Database] Updated lead ${leadId} score: ${currentScore} → ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange}) - ${reason}`);
  } catch (error) {
    console.error("[Database] Failed to update lead score:", error);
    throw error;
  }
}

/**
 * Scoring rules for different interactions
 */
export const SCORING_RULES = {
  CALL_POSITIVE: 10,
  CALL_NEGATIVE: -5,
  EMAIL_OPENED: 5,
  EMAIL_CLICKED: 8,
  MEETING_COMPLETED: 15,
  MEETING_CANCELLED: -3,
  DEMO_REQUESTED: 20,
  PROPOSAL_SENT: 12,
  CONTRACT_SIGNED: 30,
  UNSUBSCRIBED: -15,
  BOUNCED_EMAIL: -2,
};

/**
 * Create call transcript
 */
export async function createCallTranscript(data: InsertCallTranscript): Promise<CallTranscript> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(callTranscripts).values(data);
  const [transcript] = await db.select().from(callTranscripts).where(eq(callTranscripts.id, Number(result.insertId)));
  return transcript;
}

/**
 * Get transcripts by call ID
 */
export async function getTranscriptsByCallId(callId: number): Promise<CallTranscript[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(callTranscripts)
    .where(eq(callTranscripts.callId, callId))
    .orderBy(asc(callTranscripts.timestamp));
}

/**
 * Create SMS message record
 */
export async function createSMS(data: InsertSmsMessage): Promise<SmsMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(smsMessages).values(data);
  const [sms] = await db.select().from(smsMessages).where(eq(smsMessages.id, Number(result.insertId)));
  return sms;
}

/**
 * Get SMS messages by company ID
 */
export async function getSMSByCompanyId(companyId: number, limit: number = 50): Promise<SmsMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(smsMessages)
    .where(eq(smsMessages.companyId, companyId))
    .orderBy(desc(smsMessages.createdAt))
    .limit(limit);
}

/**
 * Get SMS messages by lead ID
 */
export async function getSMSByLeadId(leadId: number): Promise<SmsMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(smsMessages)
    .where(eq(smsMessages.leadId, leadId))
    .orderBy(desc(smsMessages.createdAt));
}

/**
 * Update SMS status
 */
export async function updateSMSStatus(
  id: number,
  status: string,
  deliveredAt?: Date,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(smsMessages)
    .set({
      status: status as any,
      ...(deliveredAt && { deliveredAt }),
      ...(errorCode && { errorCode }),
      ...(errorMessage && { errorMessage })
    })
    .where(eq(smsMessages.id, id));
}

/**
 * Create WhatsApp conversation
 */
export async function createWhatsAppConversation(data: InsertWhatsappConversation): Promise<WhatsappConversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(whatsappConversations).values(data);
  const [conversation] = await db.select().from(whatsappConversations).where(eq(whatsappConversations.id, Number(result.insertId)));
  return conversation;
}

/**
 * Get WhatsApp conversation by phone number
 */
export async function getWhatsAppConversationByPhone(
  companyId: number,
  phoneNumber: string
): Promise<WhatsappConversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [conversation] = await db.select().from(whatsappConversations)
    .where(and(
      eq(whatsappConversations.companyId, companyId),
      eq(whatsappConversations.phoneNumber, phoneNumber)
    ));
  return conversation;
}

/**
 * Create WhatsApp message
 */
export async function createWhatsAppMessage(data: InsertWhatsappMessage): Promise<WhatsappMessage> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(whatsappMessages).values(data);
  const [message] = await db.select().from(whatsappMessages).where(eq(whatsappMessages.id, Number(result.insertId)));
  return message;
}

/**
 * Get WhatsApp messages by conversation ID
 */
export async function getWhatsAppMessagesByConversationId(conversationId: number): Promise<WhatsappMessage[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(whatsappMessages)
    .where(eq(whatsappMessages.conversationId, conversationId))
    .orderBy(desc(whatsappMessages.createdAt));
}

/**
 * Update WhatsApp message status
 */
export async function updateWhatsAppMessageStatus(
  id: number,
  status: string,
  deliveredAt?: Date,
  readAt?: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(whatsappMessages)
    .set({
      status: status as any,
      ...(deliveredAt && { deliveredAt }),
      ...(readAt && { readAt })
    })
    .where(eq(whatsappMessages.id, id));
}

/**
 * Get communication analytics by company and date range
 */
export async function getCommunicationAnalytics(
  companyId: number,
  startDate: string,
  endDate: string
): Promise<CommunicationAnalytics[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(communicationAnalytics)
    .where(and(
      eq(communicationAnalytics.companyId, companyId),
      gte(communicationAnalytics.date, startDate),
      lte(communicationAnalytics.date, endDate)
    ))
    .orderBy(desc(communicationAnalytics.date));
}

/**
 * Create or update communication analytics
 */
export async function upsertCommunicationAnalytics(data: InsertCommunicationAnalytics): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(communicationAnalytics)
    .values(data)
    .onDuplicateKeyUpdate({
      set: {
        totalMessages: data.totalMessages,
        successfulMessages: data.successfulMessages,
        failedMessages: data.failedMessages,
        totalCost: data.totalCost,
        averageDuration: data.averageDuration,
        positiveInteractions: data.positiveInteractions,
        neutralInteractions: data.neutralInteractions,
        negativeInteractions: data.negativeInteractions,
        updatedAt: new Date()
      }
    });
}

/**
 * Get total communication costs by company
 */
export async function getTotalCommunicationCosts(
  companyId: number,
  startDate?: string,
  endDate?: string
): Promise<{ voice: number; sms: number; whatsapp: number; total: number }> {
  const db = await getDb();
  if (!db) return { voice: 0, sms: 0, whatsapp: 0, total: 0 };

  const conditions = [eq(calls.companyId, companyId)];
  if (startDate) conditions.push(gte(calls.createdAt, new Date(startDate)));
  if (endDate) conditions.push(lte(calls.createdAt, new Date(endDate)));

  // Get voice costs
  const voiceCosts = await db.select({ total: sum(calls.cost) })
    .from(calls)
    .where(and(...conditions));

  // Get SMS costs
  const smsCosts = await db.select({ total: sum(smsMessages.cost) })
    .from(smsMessages)
    .where(and(...conditions.map(c => {
      const str = c.toString();
      return str.replace('calls', 'smsMessages');
    })));

  // Get WhatsApp costs
  const whatsappCosts = await db.select({ total: sum(whatsappMessages.cost) })
    .from(whatsappMessages)
    .where(and(...conditions.map(c => {
      const str = c.toString();
      return str.replace('calls', 'whatsappMessages');
    })));

  const voice = Number(voiceCosts[0]?.total || 0);
  const sms = Number(smsCosts[0]?.total || 0);
  const whatsapp = Number(whatsappCosts[0]?.total || 0);

  return {
    voice,
    sms,
    whatsapp,
    total: voice + sms + whatsapp
  };
}
