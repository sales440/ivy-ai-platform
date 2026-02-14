/**
 * ROPA n8n Central Engine Service
 * 
 * n8n is the PRIMARY engine of the ROPA meta-agent.
 * Every interaction sends full DB context (companies, campaigns, leads, config)
 * so n8n has complete awareness and control of the Ivy.AI platform.
 * 
 * n8n can also execute actions back into the app via the action webhook receiver.
 */

import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { getAllClients } from "./ivy-clients-db";
import { getRopaConfig } from "./ropa-db";

// ============ CONFIGURATION ============

const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE_URL || 'https://sales440.app.n8n.cloud/webhook';
const N8N_CHAT_WEBHOOK = `${N8N_WEBHOOK_BASE}/ropa-chat`;
const N8N_CHAT_TEST_WEBHOOK = `${N8N_WEBHOOK_BASE}-test/ropa-chat`;
const N8N_SYNC_WEBHOOK = `${N8N_WEBHOOK_BASE}/ropa-sync`;
const N8N_ACTION_WEBHOOK = `${N8N_WEBHOOK_BASE}/ropa-action`;
const N8N_TIMEOUT = 20000; // 20 seconds (increased for context-heavy payloads)
const N8N_QUICK_TIMEOUT = 5000; // 5 seconds for health checks

// ============ INTERFACES ============

export interface N8nResponse {
  success: boolean;
  response: string;
  command?: {
    type: string;
    section?: string;
    action?: string;
    data?: any;
  } | null;
  actions?: N8nAction[];
  intent?: string;
  timestamp?: string;
  source?: string;
}

export interface N8nAction {
  type: 'create_company' | 'update_company' | 'delete_company' |
        'create_campaign' | 'update_campaign' | 'delete_campaign' |
        'create_lead' | 'update_lead' |
        'send_email' | 'send_sms' | 'trigger_call' |
        'navigate' | 'notify' | 'update_config';
  data: Record<string, any>;
}

export interface IvyAppContext {
  companies: any[];
  campaigns: any[];
  leads: { total: number; byCompany: Record<string, number> };
  drafts: { total: number; pending: number; approved: number };
  tasks: { total: number; completed: number; pending: number };
  config: any;
  chatHistory: { role: string; message: string }[];
  activePage?: string;
  systemHealth: {
    dbConnected: boolean;
    n8nConnected: boolean;
    totalTools: number;
  };
}

// ============ CONTEXT BUILDER ============

/**
 * Build full Ivy.AI platform context from the database.
 * This is sent with every n8n call so ROPA has complete awareness.
 */
export async function buildAppContext(): Promise<IvyAppContext> {
  const db = await getDb();
  const context: IvyAppContext = {
    companies: [],
    campaigns: [],
    leads: { total: 0, byCompany: {} },
    drafts: { total: 0, pending: 0, approved: 0 },
    tasks: { total: 0, completed: 0, pending: 0 },
    config: null,
    chatHistory: [],
    systemHealth: {
      dbConnected: !!db,
      n8nConnected: false,
      totalTools: 242,
    },
  };

  if (!db) return context;

  try {
    // 1. Companies from ivy_clients
    context.companies = await getAllClients();

    // 2. Campaigns from sales_campaigns
    try {
      const [campaigns] = await db.execute(sql`SELECT * FROM sales_campaigns ORDER BY created_at DESC LIMIT 50`);
      context.campaigns = Array.isArray(campaigns) ? campaigns as any[] : [];
    } catch (e) {
      console.warn('[n8n Context] Failed to load campaigns:', (e as Error).message);
    }

    // 3. Leads count
    try {
      const [leadRows] = await db.execute(sql`SELECT COUNT(*) as cnt FROM client_leads`);
      context.leads.total = Number((leadRows as any[])?.[0]?.cnt || 0);
    } catch (e) {
      console.warn('[n8n Context] Failed to count leads:', (e as Error).message);
    }

    // 4. Email drafts
    try {
      const [draftRows] = await db.execute(sql`SELECT status, COUNT(*) as cnt FROM email_drafts GROUP BY status`);
      const drafts = Array.isArray(draftRows) ? draftRows as any[] : [];
      for (const d of drafts) {
        const cnt = Number(d.cnt || 0);
        context.drafts.total += cnt;
        if (d.status === 'pending') context.drafts.pending = cnt;
        if (d.status === 'approved') context.drafts.approved = cnt;
      }
    } catch (e) {
      console.warn('[n8n Context] Failed to count drafts:', (e as Error).message);
    }

    // 5. Tasks
    try {
      const [taskRows] = await db.execute(sql`SELECT status, COUNT(*) as cnt FROM ropa_tasks GROUP BY status`);
      const tasks = Array.isArray(taskRows) ? taskRows as any[] : [];
      for (const t of tasks) {
        const cnt = Number(t.cnt || 0);
        context.tasks.total += cnt;
        if (t.status === 'completed') context.tasks.completed = cnt;
        if (t.status === 'pending') context.tasks.pending = cnt;
      }
    } catch (e) {
      console.warn('[n8n Context] Failed to count tasks:', (e as Error).message);
    }

    // 6. Config
    try {
      context.config = await getRopaConfig('ropa_user_settings');
    } catch (e) {
      console.warn('[n8n Context] Failed to load config');
    }

    // 7. Recent chat history (last 10 messages)
    try {
      const [chatRows] = await db.execute(sql`SELECT role, message FROM ropa_chat_history ORDER BY created_at DESC LIMIT 10`);
      context.chatHistory = Array.isArray(chatRows) ? (chatRows as any[]).reverse() : [];
    } catch (e) {
      console.warn('[n8n Context] Failed to load chat history');
    }

  } catch (err) {
    console.error('[n8n Context] Error building context:', (err as Error).message);
  }

  return context;
}

/**
 * Build a compact context summary string for the LLM system prompt.
 * This gives ROPA real-time awareness of the platform state.
 */
export async function buildContextSummary(): Promise<string> {
  const ctx = await buildAppContext();
  
  const companyList = ctx.companies.length > 0
    ? ctx.companies.map((c: any) => `- ${c.companyName || c.company_name} (${c.industry || 'sin industria'}, estado: ${c.status || 'prospect'})`).join('\n')
    : '(No hay empresas registradas aún)';

  const campaignList = ctx.campaigns.length > 0
    ? ctx.campaigns.slice(0, 10).map((c: any) => `- ${c.name} [${c.type}] estado: ${c.status}, empresa: ${c.company_name || 'sin asignar'}`).join('\n')
    : '(No hay campañas creadas aún)';

  return `
ESTADO ACTUAL DE LA PLATAFORMA IVY.AI (datos en tiempo real de la base de datos):

EMPRESAS REGISTRADAS (${ctx.companies.length}):
${companyList}

CAMPAÑAS (${ctx.campaigns.length}):
${campaignList}

MÉTRICAS:
- Leads totales: ${ctx.leads.total}
- Borradores de email: ${ctx.drafts.total} (${ctx.drafts.pending} pendientes, ${ctx.drafts.approved} aprobados)
- Tareas ROPA: ${ctx.tasks.total} (${ctx.tasks.completed} completadas, ${ctx.tasks.pending} pendientes)

SISTEMA:
- Base de datos: ${ctx.systemHealth.dbConnected ? 'Conectada' : 'Desconectada'}
- Herramientas disponibles: ${ctx.systemHealth.totalTools}+
`.trim();
}

// ============ N8N COMMUNICATION ============

/**
 * Send a message to n8n ROPA workflow with FULL platform context.
 * This is the primary communication channel - n8n is TIER 1.
 */
export async function callN8nRopa(
  message: string, 
  userId: string = 'system',
  extraContext?: { activePage?: string; ropaConfig?: any }
): Promise<N8nResponse | null> {
  // Build full context from DB
  const appContext = await buildAppContext();
  if (extraContext?.activePage) appContext.activePage = extraContext.activePage;
  if (extraContext?.ropaConfig) appContext.config = extraContext.ropaConfig;

  const payload = {
    message,
    userId,
    context: {
      source: 'ivy-ai-backend',
      timestamp: new Date().toISOString(),
      platform: appContext,
    },
  };

  // Try production webhook first
  try {
    console.log(`[ROPA n8n] Calling production webhook with ${appContext.companies.length} companies, ${appContext.campaigns.length} campaigns...`);
    const response = await fetchWithTimeout(N8N_CHAT_WEBHOOK, payload, N8N_TIMEOUT);
    if (response) {
      console.log('[ROPA n8n] Production webhook responded successfully');
      return response;
    }
  } catch (err: any) {
    console.warn('[ROPA n8n] Production webhook failed:', err.message);
  }

  // Fallback to test webhook
  try {
    console.log('[ROPA n8n] Trying test webhook...');
    const response = await fetchWithTimeout(N8N_CHAT_TEST_WEBHOOK, payload, N8N_TIMEOUT);
    if (response) {
      console.log('[ROPA n8n] Test webhook responded successfully');
      return response;
    }
  } catch (err: any) {
    console.warn('[ROPA n8n] Test webhook also failed:', err.message);
  }

  return null;
}

/**
 * Send a sync event to n8n (e.g., when data changes in the app).
 * This keeps n8n informed of state changes without a chat message.
 */
export async function syncToN8n(event: string, data?: any): Promise<boolean> {
  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
    source: 'ivy-ai-backend',
  };

  try {
    const response = await fetchWithTimeout(N8N_SYNC_WEBHOOK, payload, N8N_QUICK_TIMEOUT);
    return !!response;
  } catch {
    return false;
  }
}

/**
 * Check if n8n is available by pinging the webhook
 */
export async function isN8nAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), N8N_QUICK_TIMEOUT);
    
    const response = await fetch(N8N_CHAT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', userId: 'system', context: { source: 'health-check' } }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get n8n connection status with details
 */
export async function getN8nStatus(): Promise<{
  connected: boolean;
  webhookUrl: string;
  lastCheck: string;
  error?: string;
}> {
  const status = {
    connected: false,
    webhookUrl: N8N_CHAT_WEBHOOK,
    lastCheck: new Date().toISOString(),
    error: undefined as string | undefined,
  };

  try {
    status.connected = await isN8nAvailable();
  } catch (err: any) {
    status.error = err.message;
  }

  return status;
}

// ============ HELPER ============

async function fetchWithTimeout(url: string, payload: any, timeout: number): Promise<N8nResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as N8nResponse;
    
    if (data.success && data.response) {
      return data;
    }
    
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
