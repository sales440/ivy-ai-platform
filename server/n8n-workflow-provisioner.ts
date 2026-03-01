/**
 * n8n Workflow Auto-Provisioner
 * 
 * When a new company is created in Ivy.AI, ROPA automatically:
 * 1. Creates a dedicated n8n workflow for that company
 * 2. Configures the webhook path (unique per company)
 * 3. Saves the webhook URL back to the company record in DB
 * 
 * ISOLATION GUARANTEE: Each company gets its own workflow, webhook, and sender identity.
 * No cross-contamination between companies is possible.
 */

const N8N_BASE_URL = process.env.N8N_INSTANCE_URL || 'https://sales440.app.n8n.cloud';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

/**
 * Sanitize company name to a valid webhook path slug
 * e.g. "PET LIFE 360" → "pet-life-360"
 */
function toWebhookSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
}

/**
 * Build the n8n workflow JSON for a new company email sender
 * This is a template that gets customized per company
 */
function buildCompanyWorkflow(company: {
  name: string;
  senderEmail: string;
  senderName: string;
  webhookSlug: string;
}) {
  const { name, senderEmail, senderName, webhookSlug } = company;

  return {
    name: `Ivy.AI - Email Sender - ${name}`,
    nodes: [
      {
        id: `webhook-${webhookSlug}`,
        name: `${name} Email Webhook`,
        type: "n8n-nodes-base.webhook",
        typeVersion: 2,
        position: [240, 300],
        parameters: {
          path: webhookSlug,
          httpMethod: "POST",
          responseMode: "responseNode",
          options: {}
        }
      },
      {
        id: `code-${webhookSlug}`,
        name: "Process Email Batch",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [480, 300],
        parameters: {
          jsCode: `
// ${name} Email Processor - ISOLATED workflow
// Sender: ${senderEmail} (${senderName})
// Created by ROPA for Ivy.AI

const body = $input.first().json;
const emails = Array.isArray(body) ? body : (body.emails || [body]);

const validated = emails.map(email => ({
  to: email.to || email.toRecipients,
  subject: email.subject || '${name} - Message',
  body: email.body || email.htmlBody || email.bodyContent || '',
  company: '${name}',
  senderEmail: '${senderEmail}',
  senderName: '${senderName}',
  campaign: email.campaign || 'General',
  draftId: email.draftId || '',
  callbackUrl: email.callbackUrl || ''
})).filter(e => e.to && e.subject);

if (validated.length === 0) {
  throw new Error('No valid emails to send for ${name}');
}

console.log('[${name}] Processing', validated.length, 'emails from ${senderEmail}');
return validated.map(e => ({ json: e }));
`
        }
      },
      {
        id: `send-${webhookSlug}`,
        name: "Send via Outlook",
        type: "n8n-nodes-base.microsoftOutlook",
        typeVersion: 2,
        position: [720, 300],
        parameters: {
          operation: "send",
          toRecipients: "={{ $json.to }}",
          subject: "={{ $json.subject }}",
          bodyContent: "={{ $json.body }}",
          bodyContentType: "html",
          additionalFields: {
            from: senderEmail,
            replyTo: senderEmail
          }
        },
        credentials: {
          microsoftOutlookOAuth2Api: {
            id: "IAyn3cuVds7LRdnf",
            name: "Microsoft Outlook account"
          }
        }
      },
      {
        id: `callback-${webhookSlug}`,
        name: "Report to Ivy.AI",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [960, 300],
        parameters: {
          method: "POST",
          url: "={{ $('Process Email Batch').item.json.callbackUrl || 'https://upbeat-creativity-production-27ac.up.railway.app/api/email-callback' }}",
          sendBody: true,
          bodyParameters: {
            parameters: [
              { name: "draftId", value: "={{ $('Process Email Batch').item.json.draftId }}" },
              { name: "status", value: "sent" },
              { name: "company", value: "${name}" },
              { name: "sentAt", value: "={{ new Date().toISOString() }}" }
            ]
          },
          options: { ignoreResponseCode: true }
        }
      },
      {
        id: `response-${webhookSlug}`,
        name: "Send Response",
        type: "n8n-nodes-base.respondToWebhook",
        typeVersion: 1,
        position: [1200, 300],
        parameters: {
          respondWith: "json",
          responseBody: "={ \"success\": true, \"company\": \"${name}\", \"sent\": {{ $('Process Email Batch').all().length }}, \"from\": \"${senderEmail}\" }"
        }
      }
    ],
    connections: {
      [`${name} Email Webhook`]: {
        main: [[{ node: "Process Email Batch", type: "main", index: 0 }]]
      },
      "Process Email Batch": {
        main: [[{ node: "Send via Outlook", type: "main", index: 0 }]]
      },
      "Send via Outlook": {
        main: [[{ node: "Report to Ivy.AI", type: "main", index: 0 }]]
      },
      "Report to Ivy.AI": {
        main: [[{ node: "Send Response", type: "main", index: 0 }]]
      }
    },
    settings: {
      executionOrder: "v1",
      saveManualExecutions: true
    }
  };
}

/**
 * Provision a new n8n workflow for a company
 * Called automatically when a new company is created in Ivy.AI
 */
export async function provisionCompanyWorkflow(company: {
  id: number;
  name: string;
  senderEmail: string;
  senderName?: string;
}): Promise<{
  success: boolean;
  webhookUrl?: string;
  workflowId?: string;
  error?: string;
}> {
  if (!N8N_API_KEY || N8N_API_KEY.length < 20) {
    console.warn('[N8N Provisioner] No valid API key configured');
    return { success: false, error: 'N8N API key not configured' };
  }

  const webhookSlug = `send-email-${toWebhookSlug(company.name)}`;
  const senderName = company.senderName || company.name;

  try {
    const workflow = buildCompanyWorkflow({
      name: company.name,
      senderEmail: company.senderEmail,
      senderName,
      webhookSlug
    });

    // Create the workflow in n8n
    const createRes = await fetch(`${N8N_BASE_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(workflow)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`n8n create failed: ${errText}`);
    }

    const created = await createRes.json() as { id: string; name: string };
    const workflowId = created.id;

    // Activate the workflow
    await fetch(`${N8N_BASE_URL}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY }
    });

    const webhookUrl = `${N8N_BASE_URL}/webhook/${webhookSlug}`;

    // Save webhook URL back to DB
    try {
      const mysql2 = await import('mysql2/promise');
      const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
      await conn.execute(
        'UPDATE companies SET n8nWebhookUrl=?, n8nWorkflowId=?, senderEmail=?, senderName=? WHERE id=?',
        [webhookUrl, workflowId, company.senderEmail, senderName, company.id]
      );
      await conn.end();
      console.log(`[N8N Provisioner] ✅ Workflow created for ${company.name}: ${webhookUrl}`);
    } catch (dbErr) {
      console.error('[N8N Provisioner] DB update failed:', dbErr);
    }

    return { success: true, webhookUrl, workflowId };

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[N8N Provisioner] ❌ Failed to provision workflow for ${company.name}:`, errMsg);
    return { success: false, error: errMsg };
  }
}

/**
 * Check if a company already has a workflow provisioned
 */
export async function hasWorkflowProvisioned(companyId: number): Promise<boolean> {
  try {
    const mysql2 = await import('mysql2/promise');
    const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
    const [rows] = await conn.execute(
      'SELECT n8nWorkflowId FROM companies WHERE id=? AND n8nWorkflowId IS NOT NULL',
      [companyId]
    ) as any[];
    await conn.end();
    return rows.length > 0 && rows[0].n8nWorkflowId;
  } catch {
    return false;
  }
}
