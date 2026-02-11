/**
 * Email Send Service
 * 
 * Handles sending approved emails via n8n workflow (Outlook).
 * Flow: Approved emails → Owner confirms → n8n webhook → Outlook sends → Callback updates status
 */

import { getApprovedEmailDrafts, markDraftsAsSent, getEmailDraftById, createCampaignFromApprovedDraft } from "./db";
import type { EmailDraft } from "../drizzle/schema";

// n8n Mass Email Webhook URL
const N8N_MASS_EMAIL_WEBHOOK = process.env.N8N_MASS_EMAIL_WEBHOOK || 'https://sales440.app.n8n.cloud/webhook/send-mass-email';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// FAGOR Professional HTML Email Template
function generateFagorHtmlTemplate(params: {
  subject: string;
  body: string;
  company: string;
  recipientName?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
    .email-wrapper { max-width: 650px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #E31937 0%, #B71530 100%); padding: 30px 40px; text-align: center; }
    .header img { max-height: 50px; }
    .header-title { color: #ffffff; font-size: 14px; letter-spacing: 2px; text-transform: uppercase; margin-top: 10px; }
    .content { padding: 40px; color: #333333; line-height: 1.7; font-size: 15px; }
    .content h2 { color: #E31937; font-size: 22px; margin-bottom: 15px; }
    .content p { margin-bottom: 16px; }
    .cta-button { display: inline-block; background: #E31937; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 15px; margin: 20px 0; }
    .divider { height: 3px; background: linear-gradient(90deg, #E31937, #ff6b6b, #E31937); margin: 30px 0; }
    .footer { background-color: #1a1a2e; padding: 30px 40px; color: #cccccc; font-size: 12px; }
    .footer-logo { color: #E31937; font-weight: 700; font-size: 16px; margin-bottom: 10px; }
    .footer-address { color: #999999; line-height: 1.6; }
    .footer-links { margin-top: 15px; }
    .footer-links a { color: #E31937; text-decoration: none; margin-right: 15px; }
    .social-links { margin-top: 15px; }
    .social-links a { display: inline-block; margin-right: 10px; color: #cccccc; text-decoration: none; }
    .unsubscribe { margin-top: 20px; color: #666666; font-size: 11px; }
    .unsubscribe a { color: #999999; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- Header with FAGOR Branding -->
    <div class="header">
      <img src="https://www.fagorautomation.com/images/logo-fagor-automation-white.svg" alt="FAGOR Automation" style="max-height: 45px;" />
      <div class="header-title">CNC Solutions & Industrial Automation</div>
    </div>

    <!-- Main Content -->
    <div class="content">
      ${params.body}
    </div>

    <div class="content" style="padding-top: 0;">
      <div class="divider"></div>
      <p style="font-size: 13px; color: #666;">
        Este mensaje fue enviado por <strong>FAGOR Automation USA</strong> a través de nuestra plataforma de comunicación empresarial.
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">FAGOR AUTOMATION USA</div>
      <div class="footer-address">
        4020 Winnetka Ave<br>
        Rolling Meadows, IL 60008<br>
        United States<br>
        Tel: +1 (847) 981-1500<br>
        <a href="https://www.fagorautomation.us" style="color: #E31937;">www.fagorautomation.us</a>
      </div>
      <div class="footer-links">
        <a href="https://www.fagorautomation.us/products">Products</a>
        <a href="https://www.fagorautomation.us/services">Services</a>
        <a href="https://www.fagorautomation.us/training">Training</a>
        <a href="https://www.fagorautomation.us/contact">Contact</a>
      </div>
      <div class="social-links">
        <a href="https://www.linkedin.com/company/fagor-automation/">LinkedIn</a>
        <a href="https://twitter.com/FAGORAutomation">Twitter</a>
        <a href="https://www.youtube.com/c/FAGORAutomation">YouTube</a>
      </div>
      <div class="unsubscribe">
        If you no longer wish to receive these emails, <a href="#">unsubscribe here</a>.<br>
        &copy; ${new Date().getFullYear()} FAGOR Automation USA. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>`;
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

    // Generate professional HTML if not already present
    const htmlContent = draft.htmlContent || generateFagorHtmlTemplate({
      subject: draft.subject,
      body: draft.body,
      company: draft.company,
      recipientName: draft.recipientName || undefined,
    });

    try {
      // Call n8n webhook to send via Outlook
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(N8N_MASS_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: draft.recipientEmail || 'sales@fagorautomation.us',
          subject: draft.subject,
          htmlBody: htmlContent,
          textBody: draft.body.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
          company: draft.company,
          campaign: draft.campaign,
          draftId: draft.draftId,
          // Callback URL for n8n to report results
          callbackUrl: `${process.env.RAILWAY_PUBLIC_DOMAIN || process.env.VITE_APP_URL || ''}/api/email-callback`,
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

    // Rate limiting: wait 3 seconds between emails to avoid spam filters
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

export { generateFagorHtmlTemplate };
