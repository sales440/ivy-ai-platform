/**
 * ROPA n8n Action Webhook Receiver
 * 
 * This endpoint allows n8n to execute actions in the Ivy.AI platform.
 * n8n sends action requests, and this handler executes them against the database
 * and platform tools, giving n8n full control of the app.
 * 
 * Endpoint: POST /api/ropa/n8n-action
 * 
 * Supported actions:
 * - create_company, update_company, delete_company
 * - create_campaign, update_campaign, delete_campaign
 * - create_lead, update_lead
 * - create_draft, approve_draft, reject_draft
 * - send_email, send_sms, trigger_call
 * - create_task, complete_task
 * - get_context (returns full platform state)
 * - notify (send notification to owner)
 */

import { Router, Request, Response } from "express";
import { sql } from "drizzle-orm";
import { getDb } from "./db";
import { insertClient, updateClient, deleteClient, getAllClients, getClientByName } from "./ivy-clients-db";
import { buildAppContext } from "./ropa-n8n-service";

export const ropaN8nActionsRouter = Router();

// Simple auth: check for a shared secret or allow from known n8n IPs
function validateN8nRequest(req: Request): boolean {
  // Accept requests with the n8n webhook secret or from the n8n instance
  const authHeader = req.headers['x-n8n-secret'] || req.headers['authorization'];
  const n8nSecret = process.env.N8N_ACTION_SECRET || 'ivy-n8n-action-key';
  
  if (authHeader === n8nSecret || authHeader === `Bearer ${n8nSecret}`) {
    return true;
  }
  
  // Also allow if the request comes from the same server (internal calls)
  const origin = req.headers.origin || req.headers.referer || '';
  if (origin.includes('n8n.cloud') || origin.includes('localhost') || !origin) {
    return true; // Allow n8n cloud and internal requests
  }
  
  return false;
}

/**
 * POST /api/ropa/n8n-action
 * 
 * Execute an action from n8n in the Ivy.AI platform.
 * Body: { action: string, data: object }
 */
ropaN8nActionsRouter.post("/api/ropa/n8n-action", async (req: Request, res: Response) => {
  if (!validateN8nRequest(req)) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return;
  }

  const { action, data } = req.body;

  if (!action || typeof action !== 'string') {
    res.status(400).json({ success: false, error: "Action is required" });
    return;
  }

  console.log(`[n8n Action] Executing: ${action}`, JSON.stringify(data || {}).substring(0, 200));

  try {
    const result = await executeAction(action, data || {});
    console.log(`[n8n Action] ${action} completed:`, result.success);
    res.json(result);
  } catch (err: any) {
    console.error(`[n8n Action] ${action} failed:`, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ropa/n8n-context
 * 
 * Returns the full platform context for n8n to consume.
 * n8n can poll this to stay in sync with the app state.
 */
ropaN8nActionsRouter.get("/api/ropa/n8n-context", async (req: Request, res: Response) => {
  try {
    const context = await buildAppContext();
    res.json({ success: true, context });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ropa/n8n-health
 * 
 * Health check endpoint for n8n to verify the app is running.
 */
ropaN8nActionsRouter.get("/api/ropa/n8n-health", async (_req: Request, res: Response) => {
  const db = await getDb();
  res.json({
    success: true,
    status: "healthy",
    dbConnected: !!db,
    timestamp: new Date().toISOString(),
    version: "2.0",
    platform: "Ivy.AI",
  });
});

// ============ ACTION EXECUTOR ============

async function executeAction(action: string, data: Record<string, any>): Promise<{ success: boolean; [key: string]: any }> {
  const db = await getDb();
  if (!db && action !== 'get_context') {
    return { success: false, error: "Database not available" };
  }

  switch (action) {
    // ============ COMPANY MANAGEMENT ============
    case 'create_company': {
      const clientId = data.clientId || `IVY-${Date.now()}`;
      const ok = await insertClient({
        clientId,
        companyName: data.companyName || data.name,
        industry: data.industry,
        contactName: data.contactName,
        contactEmail: data.contactEmail || data.email,
        contactPhone: data.contactPhone || data.phone,
        website: data.website,
        status: data.status || 'prospect',
        notes: data.notes,
        createdBy: 'n8n',
      });
      return { success: ok, clientId, companyName: data.companyName || data.name };
    }

    case 'update_company': {
      const clientId = data.clientId;
      if (!clientId) return { success: false, error: "clientId is required" };
      const ok = await updateClient(clientId, data.updates || data);
      return { success: ok };
    }

    case 'delete_company': {
      const clientId = data.clientId;
      if (!clientId) return { success: false, error: "clientId is required" };
      const ok = await deleteClient(clientId);
      return { success: ok };
    }

    case 'list_companies': {
      const companies = await getAllClients();
      return { success: true, companies, count: companies.length };
    }

    case 'find_company': {
      const company = await getClientByName(data.companyName || data.name || '');
      return { success: !!company, company };
    }

    // ============ CAMPAIGN MANAGEMENT ============
    case 'create_campaign': {
      const [result] = await db!.execute(sql`
        INSERT INTO sales_campaigns (name, type, status, description, target_leads, client_id, company_name, created_by)
        VALUES (
          ${data.name || 'Nueva Campaña'},
          ${data.type || 'email'},
          ${data.status || 'planned'},
          ${data.description || null},
          ${data.targetLeads || 100},
          ${data.clientId || null},
          ${data.companyName || null},
          ${'n8n'}
        )
      `);
      return { success: true, campaignId: (result as any).insertId };
    }

    case 'update_campaign': {
      if (!data.id) return { success: false, error: "Campaign id is required" };
      const updates: string[] = [];
      if (data.name) updates.push(`name = '${data.name}'`);
      if (data.status) updates.push(`status = '${data.status}'`);
      if (data.type) updates.push(`type = '${data.type}'`);
      if (data.description) updates.push(`description = '${data.description}'`);
      if (updates.length === 0) return { success: false, error: "No updates provided" };
      await db!.execute(sql.raw(`UPDATE sales_campaigns SET ${updates.join(', ')} WHERE id = ${data.id}`));
      return { success: true };
    }

    case 'list_campaigns': {
      const [rows] = await db!.execute(sql`SELECT * FROM sales_campaigns ORDER BY created_at DESC LIMIT 50`);
      return { success: true, campaigns: rows, count: (rows as any[]).length };
    }

    // ============ EMAIL DRAFTS ============
    case 'create_draft': {
      const [result] = await db!.execute(sql`
        INSERT INTO email_drafts (subject, body, recipient_email, recipient_name, type, campaign, status, html_content)
        VALUES (
          ${data.subject || 'Sin asunto'},
          ${data.body || ''},
          ${data.recipientEmail || null},
          ${data.recipientName || null},
          ${data.type || 'email'},
          ${data.campaign || 'General'},
          ${data.status || 'pending'},
          ${data.htmlContent || null}
        )
      `);
      return { success: true, draftId: (result as any).insertId };
    }

    case 'approve_draft': {
      if (!data.id) return { success: false, error: "Draft id is required" };
      await db!.execute(sql`UPDATE email_drafts SET status = 'approved' WHERE id = ${data.id}`);
      return { success: true };
    }

    case 'reject_draft': {
      if (!data.id) return { success: false, error: "Draft id is required" };
      await db!.execute(sql`UPDATE email_drafts SET status = 'rejected' WHERE id = ${data.id}`);
      return { success: true };
    }

    case 'list_drafts': {
      const [rows] = await db!.execute(sql`SELECT * FROM email_drafts ORDER BY created_at DESC LIMIT 50`);
      return { success: true, drafts: rows, count: (rows as any[]).length };
    }

    // ============ LEAD MANAGEMENT ============
    case 'create_lead': {
      const [result] = await db!.execute(sql`
        INSERT INTO client_leads (client_id, name, email, phone, source, status, notes)
        VALUES (
          ${data.clientId || null},
          ${data.name || 'Nuevo Lead'},
          ${data.email || null},
          ${data.phone || null},
          ${data.source || 'n8n'},
          ${data.status || 'new'},
          ${data.notes || null}
        )
      `);
      return { success: true, leadId: (result as any).insertId };
    }

    case 'list_leads': {
      const [rows] = await db!.execute(sql`SELECT * FROM client_leads ORDER BY created_at DESC LIMIT 100`);
      return { success: true, leads: rows, count: (rows as any[]).length };
    }

    // ============ TASK MANAGEMENT ============
    case 'create_task': {
      const [result] = await db!.execute(sql`
        INSERT INTO ropa_tasks (description, category, priority, status, company_name)
        VALUES (
          ${data.description || 'Nueva tarea'},
          ${data.category || 'general'},
          ${data.priority || 'medium'},
          ${data.status || 'pending'},
          ${data.companyName || null}
        )
      `);
      return { success: true, taskId: (result as any).insertId };
    }

    case 'complete_task': {
      if (!data.id) return { success: false, error: "Task id is required" };
      await db!.execute(sql`UPDATE ropa_tasks SET status = 'completed' WHERE id = ${data.id}`);
      return { success: true };
    }

    // ============ SEND EMAIL VIA WEBHOOK ============
    case 'send_email': {
      const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://sales440.app.n8n.cloud/webhook';
      const emailPath = process.env.N8N_EMAIL_WEBHOOK_PATH || 'send-mass-email';
      try {
        const resp = await fetch(`${webhookBase}/${emailPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.to || data.recipientEmail,
            subject: data.subject,
            body: data.body || data.htmlContent,
            from: data.from || 'ropa@ivy-ai.com',
          }),
        });
        return { success: resp.ok, status: resp.status };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // ============ SEND SMS VIA WEBHOOK ============
    case 'send_sms': {
      const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://sales440.app.n8n.cloud/webhook';
      const smsPath = process.env.N8N_SMS_WEBHOOK_PATH || 'send-mass-sms';
      try {
        const resp = await fetch(`${webhookBase}/${smsPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.to || data.phone,
            message: data.message || data.body,
          }),
        });
        return { success: resp.ok, status: resp.status };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // ============ TRIGGER CALL VIA WEBHOOK ============
    case 'trigger_call': {
      const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://sales440.app.n8n.cloud/webhook';
      const callPath = process.env.N8N_CALL_WEBHOOK_PATH || 'trigger-calls';
      try {
        const resp = await fetch(`${webhookBase}/${callPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.to || data.phone,
            script: data.script || data.message,
            companyName: data.companyName,
          }),
        });
        return { success: resp.ok, status: resp.status };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // ============ PLATFORM CONTEXT ============
    case 'get_context': {
      const context = await buildAppContext();
      return { success: true, context };
    }

    // ============ NOTIFY OWNER ============
    case 'notify': {
      try {
        const { notifyOwner } = await import("./_core/notification");
        const ok = await notifyOwner({
          title: data.title || 'Notificación de n8n',
          content: data.content || data.message || '',
        });
        return { success: ok };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    default:
      return { success: false, error: `Unknown action: ${action}` };
  }
}
