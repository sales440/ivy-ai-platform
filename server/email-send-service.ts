/**
 * Email Send Service
 * 
 * Handles sending approved emails via n8n workflow (Outlook).
 * Flow: Approved emails → Owner confirms → n8n webhook → Outlook sends → Callback updates status
 * 
 * BRAND FIREWALL: Uses generateBrandedEmailHtml for company-specific templates.
 * No hardcoded brand assets. Each company gets its own unique template.
 */

import { getApprovedEmailDrafts, markDraftsAsSent, getEmailDraftById, createCampaignFromApprovedDraft } from "./db";
import { generateBrandedEmailHtml, getBrandProfile } from "./brand-firewall";
import type { EmailDraft } from "../drizzle/schema";

// Default n8n Mass Email Webhook URL (FAGOR fallback)
const N8N_MASS_EMAIL_WEBHOOK_DEFAULT = process.env.N8N_MASS_EMAIL_WEBHOOK || 'https://sales440.app.n8n.cloud/webhook/send-mass-email';

/**
 * Get the company-specific n8n webhook URL from DB
 * Each company has its own isolated n8n workflow - NO cross-contamination
 */
async function getCompanyWebhookUrl(companyName: string): Promise<{ webhookUrl: string; senderEmail: string; senderName: string }> {
  try {
    const mysql2 = await import('mysql2/promise');
    const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
    const [rows] = await conn.execute(
      'SELECT n8nWebhookUrl, senderEmail, senderName FROM companies WHERE name = ? OR name LIKE ? LIMIT 1',
      [companyName, '%' + companyName.split(' ')[0] + '%']
    ) as any[];
    await conn.end();
    if (rows.length > 0 && rows[0].n8nWebhookUrl) {
      return {
        webhookUrl: rows[0].n8nWebhookUrl,
        senderEmail: rows[0].senderEmail || process.env.ROPA_FROM_EMAIL || 'ropa@ivybyai.com',
        senderName: rows[0].senderName || companyName
      };
    }
  } catch (e) {
    console.warn('[EmailSend] Could not fetch company webhook URL:', e);
  }
  return {
    webhookUrl: N8N_MASS_EMAIL_WEBHOOK_DEFAULT,
    senderEmail: process.env.ROPA_FROM_EMAIL || 'ropa@ivybyai.com',
    senderName: companyName
  };
}

/**
 * Generate company-specific HTML email template using Brand Firewall
 * This replaces the old generateFagorHtmlTemplate - now works for ANY company
 */
async function generateBrandedHtmlForDraft(draft: {
  subject: string;
  body: string;
  company: string;
  recipientName?: string;
}): Promise<string> {
  try {
    const { html, coherenceCheck } = await generateBrandedEmailHtml({
      companyName: draft.company,
      subject: draft.subject,
      body: draft.body,
      recipientName: draft.recipientName,
    });
    
    if (!coherenceCheck) {
      console.warn(`[EmailSendService] ⚠️ Coherence check failed for ${draft.company}, using regenerated template`);
    }
    
    return html;
  } catch (error) {
    console.error(`[EmailSendService] Error generating branded HTML for ${draft.company}:`, error);
    // Fallback: simple HTML with company name (no cross-contamination)
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${draft.subject}</title></head>
<body style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
  <h2>${draft.subject}</h2>
  ${draft.body.replace(/\n/g, '<br>')}
  <hr style="margin-top: 30px;">
  <p style="font-size: 12px; color: #666;">${draft.company}</p>
</body></html>`;
  }
}

/**
 * Legacy compatibility: generateFagorHtmlTemplate now routes through Brand Firewall
 * @deprecated Use generateBrandedHtmlForDraft instead
 */
function generateFagorHtmlTemplate(params: {
  subject: string;
  body: string;
  company: string;
  recipientName?: string;
}): string {
  // Synchronous fallback for legacy callers - uses FAGOR profile directly
  // New code should use generateBrandedHtmlForDraft (async) instead
  console.warn('[EmailSendService] ⚠️ Legacy generateFagorHtmlTemplate called - should use Brand Firewall');
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>${params.subject}</title></head>
<body style="font-family: 'Segoe UI', sans-serif; background: #f4f4f4; padding: 0; margin: 0;">
<div style="max-width: 650px; margin: 0 auto; background: #fff;">
  <div style="background: linear-gradient(135deg, #E31937 0%, #B71530 100%); padding: 30px 40px; text-align: center;">
    <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663031167889/lFvNmUJyWPByzMSL.jpg" alt="FAGOR Automation" style="max-height: 45px;" />
  </div>
  <div style="padding: 40px; color: #333; line-height: 1.7; font-size: 15px;">${params.body}</div>
  <div style="background: #1a1a2e; padding: 30px 40px; color: #ccc; font-size: 12px;">
    <strong style="color: #E31937;">FAGOR AUTOMATION USA</strong><br>
    4020 Winnetka Ave, Rolling Meadows, IL 60008<br>Tel: +1 (847) 981-1500
  </div>
</div></body></html>`;
}

/**
 * Get all approved emails ready to send
 */
export async function getApprovedEmailsForSending(): Promise<EmailDraft[]> {
  return await getApprovedEmailDrafts();
}

/**
 * Send approved emails via n8n webhook (Outlook)
 * This is called ONLY after the owner explicitly clicks "Confirmar Envío"
 * 
 * BRAND FIREWALL: Each email gets its own company-specific HTML template
 */
export async function sendApprovedEmailsViaN8n(draftIds: string[]): Promise<{
  success: boolean;
  sentCount: number;
  failedCount: number;
  results: Array<{ draftId: string; status: 'sent' | 'failed'; error?: string }>;
}> {
  const results: Array<{ draftId: string; status: 'sent' | 'failed'; error?: string }> = [];
  let sentCount = 0;
  let failedCount = 0;

  for (const draftId of draftIds) {
    const draft = await getEmailDraftById(draftId);
    if (!draft || draft.status !== 'approved') {
      results.push({ draftId, status: 'failed', error: 'Draft not found or not approved' });
      failedCount++;
      continue;
    }

    // BRAND FIREWALL: Generate company-specific HTML using Brand Firewall
    let htmlContent = draft.htmlContent;
    if (!htmlContent) {
      htmlContent = await generateBrandedHtmlForDraft({
        subject: draft.subject,
        body: draft.body,
        company: draft.company,
        recipientName: draft.recipientName || undefined,
      });
    }

    // Get company-specific n8n webhook URL and sender email from DB
    // Each company has its OWN isolated n8n workflow - NO cross-contamination
    const companyConfig = await getCompanyWebhookUrl(draft.company);
    const { webhookUrl: companyWebhookUrl, senderEmail, senderName } = companyConfig;
    const replyToEmail = senderEmail;
    const fallbackEmail = senderEmail;
    
    console.log(`[EmailSend] Routing ${draft.company} → ${companyWebhookUrl} (from: ${senderEmail})`);

    try {
      // Call company-specific n8n webhook (ISOLATED per company)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(companyWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: draft.recipientEmail || fallbackEmail,
          subject: draft.subject,
          body: htmlContent,          // n8n workflow uses 'body' field
          htmlBody: htmlContent,      // also send as htmlBody for compatibility
          textBody: draft.body.replace(/<[^>]*>/g, ''),
          from: senderEmail,          // company-specific sender
          fromName: senderName,
          replyTo: replyToEmail,
          company: draft.company,
          campaign: draft.campaign,
          draftId: draft.draftId,
          callbackUrl: `${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VITE_APP_URL || 'https://upbeat-creativity-production-27ac.up.railway.app'}/api/email-callback`,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        sentCount++;
        results.push({ draftId, status: 'sent' });
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        failedCount++;
        results.push({ draftId, status: 'failed', error: `HTTP ${response.status}: ${errorText}` });
      }
    } catch (error: any) {
      failedCount++;
      results.push({ draftId, status: 'failed', error: error.message || 'Network error' });
    }

    // Rate limiting: wait 3 seconds between emails
    if (draftIds.indexOf(draftId) < draftIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Mark successfully sent drafts
  const sentDraftIds = results.filter(r => r.status === 'sent').map(r => r.draftId);
  if (sentDraftIds.length > 0) {
    await markDraftsAsSent(sentDraftIds);
  }

  return { success: sentCount > 0, sentCount, failedCount, results };
}

/**
 * Process n8n callback with email delivery results
 */
export async function processEmailCallback(data: {
  draftId: string;
  status: 'delivered' | 'bounced' | 'failed';
  messageId?: string;
  error?: string;
  timestamp?: string;
}): Promise<{ success: boolean }> {
  console.log(`[Email Callback] Draft ${data.draftId}: ${data.status}`);

  if (data.status === 'delivered') {
    await markDraftsAsSent([data.draftId]);
  }

  return { success: true };
}

/**
 * Create campaign from approved drafts (called when emails are approved)
 */
export async function createCampaignFromDrafts(drafts: EmailDraft[]): Promise<number | null> {
  if (drafts.length === 0) return null;

  const company = drafts[0].company;
  const campaign = drafts[0].campaign || 'Email Campaign';
  const campaignName = `${campaign} - ${company} (${new Date().toLocaleDateString('es-ES')})`;

  return await createCampaignFromApprovedDraft({
    name: campaignName,
    company,
    type: 'email',
    draftCount: drafts.length,
  });
}

export { generateFagorHtmlTemplate, generateBrandedHtmlForDraft };
