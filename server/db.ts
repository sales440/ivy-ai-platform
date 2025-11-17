import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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



