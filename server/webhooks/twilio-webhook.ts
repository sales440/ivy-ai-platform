
/**
 * Twilio Webhooks Handler
 * Processes real-time events from Twilio (SMS, WhatsApp)
 */

import { Request, Response } from 'express';
import { handleIncomingMessage } from '../meta-agent/capabilities/omni-channel';

/**
 * Main webhook handler for Twilio events
 */
export async function handleTwilioWebhook(req: Request, res: Response): Promise<void> {
    try {
        const event = req.body;

        console.log('[Twilio Webhook] Received event from:', event.From);

        // Delegate to Omni-Channel capability
        await handleIncomingMessage(event);

        // Respond with minimal TwiML to acknowledge receipt
        res.type('text/xml');
        res.send('<Response></Response>');
    } catch (error: any) {
        console.error('[Twilio Webhook] Error processing webhook:', error);
        res.status(500).send('<Response></Response>');
    }
}
