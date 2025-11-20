/**
 * Gmail Webhook Handler
 * Receives notifications when leads respond to emails
 */

import { Router } from 'express';
import { getDb } from '../db';
import { emailLogs, leads } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const gmailWebhookRouter = Router();

/**
 * Webhook endpoint for Gmail push notifications
 * POST /api/webhooks/gmail
 */
gmailWebhookRouter.post('/gmail', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || !message.data) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    // Decode base64 message data
    const decodedData = Buffer.from(message.data, 'base64').toString('utf-8');
    const emailData = JSON.parse(decodedData);

    console.log('[GmailWebhook] Received email notification:', emailData);

    // Process the email response
    await processEmailResponse(emailData);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[GmailWebhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Simple webhook endpoint for testing (no authentication required)
 * POST /api/webhooks/gmail/test
 */
gmailWebhookRouter.post('/gmail/test', async (req, res) => {
  try {
    const { from, to, subject, body, emailId } = req.body;

    console.log('[GmailWebhook] Test webhook received:', { from, to, subject });

    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }

    // Find the original email by recipient
    const [originalEmail] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.to, from))
      .orderBy(emailLogs.sentAt)
      .limit(1);

    if (originalEmail) {
      // Mark email as responded
      await db
        .update(emailLogs)
        .set({
          respondedAt: new Date(),
          status: 'clicked', // Update status
          updatedAt: new Date(),
        })
        .where(eq(emailLogs.id, originalEmail.id));

      // Update lead status if exists
      if (originalEmail.leadId) {
        await db
          .update(leads)
          .set({
            status: 'contacted',
            updatedAt: new Date(),
          })
          .where(eq(leads.id, originalEmail.leadId));

        console.log(`[GmailWebhook] Updated lead ${originalEmail.leadId} status to contacted`);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Email response processed',
      originalEmailFound: !!originalEmail 
    });
  } catch (error) {
    console.error('[GmailWebhook] Error in test webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Process incoming email response
 */
async function processEmailResponse(emailData: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const { from, to, subject, threadId } = emailData;

    // Find the original email sent to this recipient
    const [originalEmail] = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.to, from))
      .orderBy(emailLogs.sentAt)
      .limit(1);

    if (!originalEmail) {
      console.warn(`[GmailWebhook] No original email found for ${from}`);
      return;
    }

    // Update email log with response
    await db
      .update(emailLogs)
      .set({
        respondedAt: new Date(),
        status: 'clicked',
        metadata: {
          ...originalEmail.metadata,
          responseThreadId: threadId,
          responseSubject: subject,
        },
        updatedAt: new Date(),
      })
      .where(eq(emailLogs.id, originalEmail.id));

    // Update lead status if exists
    if (originalEmail.leadId) {
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, originalEmail.leadId))
        .limit(1);

      if (lead) {
        // Update lead to "contacted" status
        await db
          .update(leads)
          .set({
            status: lead.status === 'new' ? 'contacted' : lead.status,
            metadata: {
              ...lead.metadata,
              lastEmailResponseAt: new Date().toISOString(),
              emailResponseCount: (lead.metadata?.emailResponseCount || 0) + 1,
            },
            updatedAt: new Date(),
          })
          .where(eq(leads.id, originalEmail.leadId));

        console.log(`[GmailWebhook] Lead ${originalEmail.leadId} responded to email`);
      }
    }
  } catch (error) {
    console.error('[GmailWebhook] Error processing email response:', error);
    throw error;
  }
}

/**
 * Verification endpoint for Gmail webhook setup
 * GET /api/webhooks/gmail/verify
 */
gmailWebhookRouter.get('/gmail/verify', (req, res) => {
  res.status(200).json({ 
    status: 'active',
    service: 'gmail-webhook',
    timestamp: new Date().toISOString()
  });
});
