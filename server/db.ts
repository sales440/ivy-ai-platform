import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
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
  InsertCommandHistory
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

export async function getAllAgents(): Promise<Agent[]> {
  const db = await getDb();
  if (!db) return [];

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

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadsByStatus(status: Lead["status"]): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

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

  const result = await db.insert(tickets).values(ticket);
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

export async function getAllTickets(): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(tickets).orderBy(desc(tickets.createdAt));
}

export async function getTicketsByStatus(status: Ticket["status"]): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) return [];

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

export async function searchKnowledgeBase(query: string): Promise<KnowledgeArticle[]> {
  const db = await getDb();
  if (!db) return [];

  // Simple search - in production, use full-text search
  return await db.select().from(knowledgeBase)
    .where(eq(knowledgeBase.isPublished, true))
    .orderBy(desc(knowledgeBase.helpfulCount));
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
