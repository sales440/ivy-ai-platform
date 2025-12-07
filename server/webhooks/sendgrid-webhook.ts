/**
 * SendGrid Event Webhook Handler
 * 
 * Receives real-time events from SendGrid:
 * - delivered, opened, clicked, bounced, unsubscribed, etc.
 * 
 * Updates fagorCampaignEnrollments and fagorEmailEvents tables
 */

import { Router } from 'express';
import { getDb } from '../db';
import { fagorCampaignEnrollments, fagorEmailEvents } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const sendgridWebhookRouter = Router();

interface SendGridEvent {
  email: string;
  timestamp: number;
  event: 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe';
  sg_message_id: string;
  useragent?: string;
  ip?: string;
  url?: string;
  // Custom args we set when sending
  enrollmentId?: string;
  emailNumber?: string;
  contactId?: string;
  campaign?: string;
}

sendgridWebhookRouter.post('/sendgrid', async (req, res) => {
  try {
    const events: SendGridEvent[] = req.body;

    if (!Array.isArray(events)) {
      console.error('[SendGrid Webhook] Invalid payload: not an array');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    console.log(`[SendGrid Webhook] Received ${events.length} events`);

    const db = await getDb();
    if (!db) {
      console.error('[SendGrid Webhook] Database not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    for (const event of events) {
      try {
        // Extract custom args
        const enrollmentId = event.enrollmentId ? parseInt(event.enrollmentId) : null;
        const emailNumber = event.emailNumber ? parseInt(event.emailNumber) : null;
        const contactId = event.contactId ? parseInt(event.contactId) : null;

        if (!enrollmentId || !emailNumber || !contactId) {
          console.warn('[SendGrid Webhook] Missing custom args, skipping event:', event.event);
          continue;
        }

        // Log event
        await db.insert(fagorEmailEvents).values({
          enrollmentId,
          contactId,
          emailNumber: emailNumber as 1 | 2 | 3,
          eventType: mapEventType(event.event),
          messageId: event.sg_message_id,
          userAgent: event.useragent || null,
          ipAddress: event.ip || null,
          clickedUrl: event.url || null,
          metadata: {
            originalEvent: event.event,
            timestamp: event.timestamp,
          },
          eventAt: new Date(event.timestamp * 1000),
        });

        // Update enrollment based on event type
        if (event.event === 'open') {
          const openedAtField = `email${emailNumber}OpenedAt` as 'email1OpenedAt' | 'email2OpenedAt' | 'email3OpenedAt';
          
          // Only update if not already opened
          const [enrollment] = await db
            .select()
            .from(fagorCampaignEnrollments)
            .where(eq(fagorCampaignEnrollments.id, enrollmentId))
            .limit(1);

          if (enrollment && !enrollment[openedAtField]) {
            await db
              .update(fagorCampaignEnrollments)
              .set({ [openedAtField]: new Date(event.timestamp * 1000) })
              .where(eq(fagorCampaignEnrollments.id, enrollmentId));

            console.log(`[SendGrid Webhook] ✅ Recorded open for enrollment ${enrollmentId}, email ${emailNumber}`);
          }
        } else if (event.event === 'click') {
          const clickedAtField = `email${emailNumber}ClickedAt` as 'email1ClickedAt' | 'email2ClickedAt' | 'email3ClickedAt';
          
          // Only update if not already clicked
          const [enrollment] = await db
            .select()
            .from(fagorCampaignEnrollments)
            .where(eq(fagorCampaignEnrollments.id, enrollmentId))
            .limit(1);

          if (enrollment && !enrollment[clickedAtField]) {
            await db
              .update(fagorCampaignEnrollments)
              .set({ [clickedAtField]: new Date(event.timestamp * 1000) })
              .where(eq(fagorCampaignEnrollments.id, enrollmentId));

            console.log(`[SendGrid Webhook] ✅ Recorded click for enrollment ${enrollmentId}, email ${emailNumber}, URL: ${event.url}`);
          }
        } else if (event.event === 'unsubscribe') {
          await db
            .update(fagorCampaignEnrollments)
            .set({ status: 'unsubscribed' })
            .where(eq(fagorCampaignEnrollments.id, enrollmentId));

          console.log(`[SendGrid Webhook] ✅ Unsubscribed enrollment ${enrollmentId}`);
        }
      } catch (error) {
        console.error('[SendGrid Webhook] Error processing event:', error);
        // Continue processing other events
      }
    }

    res.status(200).json({ received: events.length });
  } catch (error) {
    console.error('[SendGrid Webhook] Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function mapEventType(event: string): 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' {
  switch (event) {
    case 'delivered':
      return 'delivered';
    case 'open':
      return 'opened';
    case 'click':
      return 'clicked';
    case 'bounce':
    case 'dropped':
      return 'bounced';
    case 'spamreport':
      return 'complained';
    case 'unsubscribe':
      return 'unsubscribed';
    default:
      return 'delivered';
  }
}
