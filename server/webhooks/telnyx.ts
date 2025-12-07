/**
 * Telnyx Webhook Handler
 * 
 * Handles real-time call events from Telnyx:
 * - call.initiated
 * - call.answered
 * - call.hangup
 * - call.recording.saved
 */

import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import * as db from "../db";
import { scheduleFollowUpEmail } from "../schedule-helpers";

interface TelnyxWebhookEvent {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      call_control_id: string;
      call_leg_id: string;
      call_session_id: string;
      client_state?: string;
      connection_id?: string;
      from?: string;
      to?: string;
      direction?: string;
      state?: string;
      // Recording specific
      recording_urls?: {
        mp3?: string;
        wav?: string;
      };
      duration_millis?: number;
      // Hangup specific
      hangup_cause?: string;
      hangup_source?: string;
      sip_hangup_cause?: string;
    };
  };
}

export async function handleTelnyxWebhook(req: Request, res: Response) {
  try {
    const event: TelnyxWebhookEvent = req.body;
    
    console.log('[Telnyx Webhook]', event.data.event_type, event.data.payload);

    const { event_type, payload } = event.data;
    const { call_control_id } = payload;

    // Find call by Telnyx ID
    const calls = await db.getDb();
    if (!calls) {
      console.error('[Telnyx Webhook] Database not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    const { calls: callsTable } = await import("../../drizzle/schema");
    const callResult = await calls.select().from(callsTable).where(eq(callsTable.telnyxCallId, call_control_id)).limit(1);
    const call = callResult[0];

    if (!call) {
      console.warn('[Telnyx Webhook] Call not found for control ID:', call_control_id);
      return res.status(404).json({ error: 'Call not found' });
    }

    // Handle different event types
    switch (event_type) {
      case 'call.initiated':
        await db.updateCallStatus(call.id, 'initiated');
        console.log('[Telnyx Webhook] Call initiated:', call.id);
        break;

      case 'call.answered':
        await db.updateCallStatus(call.id, 'answered');
        console.log('[Telnyx Webhook] Call answered:', call.id);
        break;

      case 'call.hangup':
        const duration = payload.duration_millis ? Math.floor(payload.duration_millis / 1000) : undefined;
        const status = payload.hangup_cause === 'NORMAL_CLEARING' ? 'completed' : 
                      payload.hangup_cause === 'NO_ANSWER' ? 'no-answer' : 'failed';
        
        await calls.update(callsTable)
          .set({
            status,
            duration,
            completedAt: new Date(),
          })
          .where(eq(callsTable.id, call.id));
        
        console.log('[Telnyx Webhook] Call ended:', call.id, 'Status:', status, 'Duration:', duration);

        // Auto-schedule follow-up email for successful calls with specific outcomes
        if (call.outcome && ['callback', 'interested'].includes(call.outcome)) {
          try {
            // Get lead details for email personalization
            const { leads } = await import("../../drizzle/schema");
            const leadResult = await calls.select().from(leads).where(eq(leads.id, call.leadId)).limit(1);
            const lead = leadResult[0];

            if (lead && lead.email) {
              // Generate email content based on outcome
              const templates: Record<string, { subject: string; body: string }> = {
                callback: {
                  subject: `Following up on our call - ${lead.company || 'Your Company'}`,
                  body: `Hi ${lead.name || 'there'},\n\nThank you for taking the time to speak with us earlier. As discussed, I wanted to follow up and schedule a callback at your convenience.\n\nPlease let me know what time works best for you, and I'll make sure to reach out.\n\nBest regards`
                },
                interested: {
                  subject: `Next steps for ${lead.company || 'your business'}`,
                  body: `Hi ${lead.name || 'there'},\n\nIt was great speaking with you! I'm excited about the opportunity to work together.\n\nAs promised, I'm sending over some additional information and next steps. Please review and let me know if you have any questions.\n\nLooking forward to continuing our conversation!\n\nBest regards`
                },
              };

              const template = templates[call.outcome] || templates.interested;

              await scheduleFollowUpEmail({
                leadId: call.leadId,
                companyId: call.companyId,
                callId: call.id,
                outcome: call.outcome,
                emailSubject: template.subject,
                emailBody: template.body,
                delayHours: 24,
                createdBy: call.userId,
              });
              console.log('[Telnyx Webhook] Scheduled follow-up email for call:', call.id, 'Outcome:', call.outcome, 'Delay: 24h');
            }
          } catch (error: any) {
            console.error('[Telnyx Webhook] Failed to schedule follow-up:', error.message);
          }
        }
        break;

      case 'call.recording.saved':
        const recordingUrl = payload.recording_urls?.mp3 || payload.recording_urls?.wav;
        if (recordingUrl) {
          await db.updateCallRecording(call.id, recordingUrl, payload.duration_millis ? Math.floor(payload.duration_millis / 1000) : undefined);
          console.log('[Telnyx Webhook] Recording saved:', call.id, recordingUrl);
        }
        break;

      default:
        console.log('[Telnyx Webhook] Unhandled event type:', event_type);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Telnyx Webhook] Error:', error);
    res.status(500).json({ error: error.message });
  }
}
