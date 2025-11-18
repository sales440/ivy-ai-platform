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
