/**
 * n8n Integration Service
 * Connects ROPA with n8n workflows for mass outreach operations:
 * - Mass email sending via Outlook
 * - SMS campaigns (future)
 * - Phone call campaigns (future)
 * 
 * Webhook URLs are configured via environment variables.
 * The existing n8n workflow "Ivy.AI - Mass Email Sender (Outlook)" handles:
 *   1. Receiving email batch via webhook
 *   2. Validating & splitting emails
 *   3. Rate-limited sending via Outlook
 *   4. Logging results & reporting back to Ivy.AI
 */

import { createRopaLog, recordRopaMetric } from "./ropa-db";
import { ENV } from "./_core/env";

// ============ CONFIGURATION ============

// n8n webhook URLs - configured via environment variables
const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE_URL || "https://sales440.app.n8n.cloud/webhook";
const N8N_EMAIL_WEBHOOK = process.env.N8N_EMAIL_WEBHOOK_PATH || "send-mass-email";
const N8N_SMS_WEBHOOK = process.env.N8N_SMS_WEBHOOK_PATH || "send-mass-sms";
const N8N_CALL_WEBHOOK = process.env.N8N_CALL_WEBHOOK_PATH || "trigger-calls";

function getWebhookUrl(path: string): string {
  return `${N8N_WEBHOOK_BASE}/${path}`;
}

// ============ TYPES ============

export interface EmailRecipient {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  recipientName?: string;
}

export interface MassEmailPayload {
  campaign: string;
  company: string;
  batchId: string;
  emails: EmailRecipient[];
  senderNote?: string;
}

export interface SMSRecipient {
  phone: string;
  message: string;
  recipientName?: string;
}

export interface MassSMSPayload {
  campaign: string;
  company: string;
  batchId: string;
  recipients: SMSRecipient[];
}

export interface CallRecipient {
  phone: string;
  script: string;
  recipientName?: string;
  priority?: "high" | "medium" | "low";
}

export interface MassCallPayload {
  campaign: string;
  company: string;
  batchId: string;
  calls: CallRecipient[];
}

export interface N8NWebhookResponse {
  success: boolean;
  message: string;
  totalSent?: number;
  totalFailed?: number;
  batchId?: string;
  details?: any[];
}

// ============ CORE WEBHOOK CALLER ============

async function callN8NWebhook(
  webhookPath: string,
  payload: any,
  label: string,
  timeoutMs: number = 120000 // 2 minutes for mass operations
): Promise<N8NWebhookResponse> {
  const url = getWebhookUrl(webhookPath);
  
  console.log(`[n8n] Calling webhook: ${url} for ${label}`);
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "IvyAI-ROPA/2.0",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error(`[n8n] Webhook error for ${label}: ${response.status} - ${errorText.substring(0, 200)}`);
      return {
        success: false,
        message: `Error del webhook n8n (${response.status}): ${errorText.substring(0, 100)}`,
      };
    }
    
    const result = await response.json().catch(() => ({ success: true, message: "Webhook accepted" }));
    console.log(`[n8n] Webhook response for ${label}:`, JSON.stringify(result).substring(0, 200));
    
    return {
      success: true,
      message: result.message || "Operación completada",
      totalSent: result.totalSent,
      totalFailed: result.totalFailed,
      batchId: result.batchId || payload.batchId,
      details: result.details,
    };
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn(`[n8n] Webhook timeout for ${label} after ${timeoutMs}ms`);
      return {
        success: false,
        message: `Timeout: El envío masivo está en progreso pero tardó más de ${timeoutMs / 1000}s. Los resultados llegarán por callback.`,
        batchId: payload.batchId,
      };
    }
    console.error(`[n8n] Webhook failed for ${label}:`, err.message);
    return {
      success: false,
      message: `Error de conexión con n8n: ${err.message?.substring(0, 100)}`,
    };
  }
}

// ============ MASS EMAIL SERVICE ============

export const n8nEmailService = {
  /**
   * Send a batch of emails through n8n Outlook workflow
   */
  async sendMassEmails(params: {
    company: string;
    campaign: string;
    emails: EmailRecipient[];
    senderNote?: string;
  }): Promise<N8NWebhookResponse & { batchId: string }> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[n8n] Sending mass email batch: ${batchId} (${params.emails.length} emails) for ${params.company}`,
      metadata: { batchId, company: params.company, campaign: params.campaign, emailCount: params.emails.length },
    });
    
    const payload: MassEmailPayload = {
      campaign: params.campaign,
      company: params.company,
      batchId,
      emails: params.emails,
      senderNote: params.senderNote,
    };
    
    const result = await callN8NWebhook(N8N_EMAIL_WEBHOOK, payload, `mass-email-${params.company}`);
    
    await recordRopaMetric({
      metricType: "n8n_mass_email_sent",
      value: String(params.emails.length),
      unit: "emails",
      metadata: { batchId, company: params.company, campaign: params.campaign, success: result.success },
    });
    
    if (result.success) {
      await createRopaLog({
        taskId: undefined,
        level: "info",
        message: `[n8n] Mass email batch ${batchId} sent successfully: ${result.totalSent || params.emails.length} emails`,
        metadata: { batchId, totalSent: result.totalSent, totalFailed: result.totalFailed },
      });
    } else {
      await createRopaLog({
        taskId: undefined,
        level: "error",
        message: `[n8n] Mass email batch ${batchId} failed: ${result.message}`,
        metadata: { batchId, error: result.message },
      });
    }
    
    return { ...result, batchId };
  },
  
  /**
   * Send a single email through n8n (wraps as a batch of 1)
   */
  async sendSingleEmail(params: {
    company: string;
    campaign?: string;
    to: string;
    subject: string;
    body: string;
    recipientName?: string;
  }): Promise<N8NWebhookResponse> {
    return this.sendMassEmails({
      company: params.company,
      campaign: params.campaign || "Direct",
      emails: [{
        to: params.to,
        subject: params.subject,
        body: params.body,
        recipientName: params.recipientName,
      }],
    });
  },
  
  /**
   * Check if n8n email webhook is configured and reachable
   */
  async checkHealth(): Promise<{ available: boolean; webhookUrl: string; message: string }> {
    const url = getWebhookUrl(N8N_EMAIL_WEBHOOK);
    try {
      // Just check if the URL is reachable (HEAD request)
      const response = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "IvyAI-ROPA/2.0" },
      });
      return {
        available: response.status < 500,
        webhookUrl: url,
        message: `n8n email webhook ${response.status < 500 ? "disponible" : "no disponible"} (status: ${response.status})`,
      };
    } catch (err: any) {
      return {
        available: false,
        webhookUrl: url,
        message: `n8n email webhook no accesible: ${err.message?.substring(0, 100)}`,
      };
    }
  },
};

// ============ MASS SMS SERVICE (FUTURE) ============

export const n8nSMSService = {
  /**
   * Send a batch of SMS through n8n workflow
   * Note: Requires n8n SMS workflow to be configured with Twilio/MessageBird/etc.
   */
  async sendMassSMS(params: {
    company: string;
    campaign: string;
    recipients: SMSRecipient[];
  }): Promise<N8NWebhookResponse & { batchId: string }> {
    const batchId = `sms_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[n8n] Sending mass SMS batch: ${batchId} (${params.recipients.length} messages) for ${params.company}`,
      metadata: { batchId, company: params.company, campaign: params.campaign, smsCount: params.recipients.length },
    });
    
    const payload: MassSMSPayload = {
      campaign: params.campaign,
      company: params.company,
      batchId,
      recipients: params.recipients,
    };
    
    const result = await callN8NWebhook(N8N_SMS_WEBHOOK, payload, `mass-sms-${params.company}`);
    
    await recordRopaMetric({
      metricType: "n8n_mass_sms_sent",
      value: String(params.recipients.length),
      unit: "sms",
      metadata: { batchId, company: params.company, success: result.success },
    });
    
    return { ...result, batchId };
  },
};

// ============ MASS CALL SERVICE (FUTURE) ============

export const n8nCallService = {
  /**
   * Trigger a batch of phone calls through n8n workflow
   * Note: Requires n8n call workflow to be configured with Twilio/Vonage/etc.
   */
  async triggerMassCalls(params: {
    company: string;
    campaign: string;
    calls: CallRecipient[];
  }): Promise<N8NWebhookResponse & { batchId: string }> {
    const batchId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[n8n] Triggering mass calls: ${batchId} (${params.calls.length} calls) for ${params.company}`,
      metadata: { batchId, company: params.company, campaign: params.campaign, callCount: params.calls.length },
    });
    
    const payload: MassCallPayload = {
      campaign: params.campaign,
      company: params.company,
      batchId,
      calls: params.calls,
    };
    
    const result = await callN8NWebhook(N8N_CALL_WEBHOOK, payload, `mass-calls-${params.company}`);
    
    await recordRopaMetric({
      metricType: "n8n_mass_calls_triggered",
      value: String(params.calls.length),
      unit: "calls",
      metadata: { batchId, company: params.company, success: result.success },
    });
    
    return { ...result, batchId };
  },
};

// ============ UNIFIED OUTREACH SERVICE ============

export const n8nOutreachService = {
  email: n8nEmailService,
  sms: n8nSMSService,
  calls: n8nCallService,
  
  /**
   * Execute a multi-channel outreach campaign
   */
  async executeMultiChannelCampaign(params: {
    company: string;
    campaign: string;
    channels: {
      email?: EmailRecipient[];
      sms?: SMSRecipient[];
      calls?: CallRecipient[];
    };
  }): Promise<{
    success: boolean;
    results: {
      email?: N8NWebhookResponse;
      sms?: N8NWebhookResponse;
      calls?: N8NWebhookResponse;
    };
    summary: string;
  }> {
    const results: any = {};
    const summaryParts: string[] = [];
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: `[n8n] Executing multi-channel campaign for ${params.company}`,
      metadata: {
        company: params.company,
        campaign: params.campaign,
        emailCount: params.channels.email?.length || 0,
        smsCount: params.channels.sms?.length || 0,
        callCount: params.channels.calls?.length || 0,
      },
    });
    
    // Execute each channel
    if (params.channels.email && params.channels.email.length > 0) {
      results.email = await n8nEmailService.sendMassEmails({
        company: params.company,
        campaign: params.campaign,
        emails: params.channels.email,
      });
      summaryParts.push(`Email: ${results.email.success ? `${results.email.totalSent || params.channels.email.length} enviados` : "Error"}`);
    }
    
    if (params.channels.sms && params.channels.sms.length > 0) {
      results.sms = await n8nSMSService.sendMassSMS({
        company: params.company,
        campaign: params.campaign,
        recipients: params.channels.sms,
      });
      summaryParts.push(`SMS: ${results.sms.success ? `${params.channels.sms.length} enviados` : "Error"}`);
    }
    
    if (params.channels.calls && params.channels.calls.length > 0) {
      results.calls = await n8nCallService.triggerMassCalls({
        company: params.company,
        campaign: params.campaign,
        calls: params.channels.calls,
      });
      summaryParts.push(`Llamadas: ${results.calls.success ? `${params.channels.calls.length} programadas` : "Error"}`);
    }
    
    const allSuccess = Object.values(results).every((r: any) => r.success);
    const summary = `Campaña multi-canal "${params.campaign}" para ${params.company}: ${summaryParts.join(" | ")}`;
    
    await recordRopaMetric({
      metricType: "n8n_multi_channel_campaign",
      value: "1",
      unit: "campaign",
      metadata: { company: params.company, campaign: params.campaign, success: allSuccess, summary },
    });
    
    return { success: allSuccess, results, summary };
  },
  
  /**
   * Get status of all n8n services
   */
  async getServiceStatus(): Promise<{
    email: { available: boolean; webhookUrl: string };
    sms: { available: boolean; webhookUrl: string };
    calls: { available: boolean; webhookUrl: string };
  }> {
    const emailHealth = await n8nEmailService.checkHealth();
    return {
      email: { available: emailHealth.available, webhookUrl: emailHealth.webhookUrl },
      sms: { available: false, webhookUrl: getWebhookUrl(N8N_SMS_WEBHOOK) },
      calls: { available: false, webhookUrl: getWebhookUrl(N8N_CALL_WEBHOOK) },
    };
  },
};
