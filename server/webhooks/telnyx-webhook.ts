/**
 * Telnyx Webhooks Handler
 * Processes real-time events from Telnyx (Voice, SMS, WhatsApp)
 */

import { Request, Response } from 'express';
import * as db from '../db';
import { invokeLLM } from '../_core/llm';

/**
 * Telnyx Event Types
 */
export enum TelnyxEventType {
  // Call events
  CALL_INITIATED = 'call.initiated',
  CALL_ANSWERED = 'call.answered',
  CALL_HANGUP = 'call.hangup',
  CALL_RECORDING_SAVED = 'call.recording.saved',
  CALL_SPEAK_ENDED = 'call.speak.ended',
  CALL_GATHER_ENDED = 'call.gather.ended',
  
  // SMS events
  MESSAGE_SENT = 'message.sent',
  MESSAGE_DELIVERED = 'message.delivered',
  MESSAGE_FAILED = 'message.failed',
  MESSAGE_RECEIVED = 'message.received',
  
  // WhatsApp events
  MESSAGE_FINALIZED = 'message.finalized',
  MESSAGE_UPDATED = 'message.updated',
}

/**
 * Main webhook handler for all Telnyx events
 */
export async function handleTelnyxWebhook(req: Request, res: Response): Promise<void> {
  try {
    const event = req.body;
    
    console.log('[Telnyx Webhook] Received event:', event.data.event_type);

    // Verify webhook signature (optional but recommended)
    // const signature = req.headers['telnyx-signature-ed25519'];
    // const timestamp = req.headers['telnyx-timestamp'];
    // if (!verifyWebhookSignature(signature, timestamp, req.body)) {
    //   res.status(401).json({ error: 'Invalid signature' });
    //   return;
    // }

    // Route to appropriate handler based on event type
    switch (event.data.event_type) {
      // Voice events
      case TelnyxEventType.CALL_INITIATED:
        await handleCallInitiated(event.data);
        break;
      case TelnyxEventType.CALL_ANSWERED:
        await handleCallAnswered(event.data);
        break;
      case TelnyxEventType.CALL_HANGUP:
        await handleCallHangup(event.data);
        break;
      case TelnyxEventType.CALL_RECORDING_SAVED:
        await handleCallRecordingSaved(event.data);
        break;
      case TelnyxEventType.CALL_SPEAK_ENDED:
        await handleCallSpeakEnded(event.data);
        break;
      case TelnyxEventType.CALL_GATHER_ENDED:
        await handleCallGatherEnded(event.data);
        break;

      // SMS events
      case TelnyxEventType.MESSAGE_SENT:
        await handleMessageSent(event.data);
        break;
      case TelnyxEventType.MESSAGE_DELIVERED:
        await handleMessageDelivered(event.data);
        break;
      case TelnyxEventType.MESSAGE_FAILED:
        await handleMessageFailed(event.data);
        break;
      case TelnyxEventType.MESSAGE_RECEIVED:
        await handleMessageReceived(event.data);
        break;

      // WhatsApp events
      case TelnyxEventType.MESSAGE_FINALIZED:
        await handleWhatsAppFinalized(event.data);
        break;
      case TelnyxEventType.MESSAGE_UPDATED:
        await handleWhatsAppUpdated(event.data);
        break;

      default:
        console.log('[Telnyx Webhook] Unhandled event type:', event.data.event_type);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Telnyx Webhook] Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// ============================================================================
// VOICE EVENT HANDLERS
// ============================================================================

/**
 * Handle call initiated event
 */
async function handleCallInitiated(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Call initiated:', data.payload.call_control_id);
  
  // Update call status in database
  const calls = await db.getCallsByCompanyId(1); // TODO: Get companyId from call metadata
  const call = calls.find(c => c.callSid === data.payload.call_control_id);
  
  if (call) {
    await db.updateCallStatus(call.id, 'initiated', undefined, undefined);
  }
}

/**
 * Handle call answered event
 */
async function handleCallAnswered(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Call answered:', data.payload.call_control_id);
  
  const calls = await db.getCallsByCompanyId(1);
  const call = calls.find(c => c.callSid === data.payload.call_control_id);
  
  if (call) {
    await db.updateCallStatus(call.id, 'answered', undefined, new Date());
  }
}

/**
 * Handle call hangup event
 */
async function handleCallHangup(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Call hangup:', data.payload.call_control_id);
  
  const calls = await db.getCallsByCompanyId(1);
  const call = calls.find(c => c.callSid === data.payload.call_control_id);
  
  if (call) {
    const duration = data.payload.call_duration || 0;
    await db.updateCallStatus(call.id, 'completed', duration, new Date());
  }
}

/**
 * Handle call recording saved event
 */
async function handleCallRecordingSaved(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Recording saved:', data.payload.recording_urls);
  
  const calls = await db.getCallsByCompanyId(1);
  const call = calls.find(c => c.callSid === data.payload.call_control_id);
  
  if (call && data.payload.recording_urls?.mp3) {
    // Update recording URL
    await db.updateCallStatus(call.id, call.status as string, call.duration || 0, undefined);
    
    // TODO: Transcribe recording using Speech-to-Text
    // const transcript = await transcribeRecording(data.payload.recording_urls.mp3);
    // await db.createCallTranscript({ callId: call.id, text: transcript, ... });
  }
}

/**
 * Handle call speak ended event
 */
async function handleCallSpeakEnded(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Speak ended:', data.payload.call_control_id);
  // Can be used to trigger next action in call flow
}

/**
 * Handle call gather ended event (DTMF input collected)
 */
async function handleCallGatherEnded(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Gather ended:', data.payload.digits);
  
  const digits = data.payload.digits;
  
  // Process user input and respond accordingly
  // Example: If user pressed 1, transfer to sales; if 2, transfer to support
  if (digits === '1') {
    console.log('[Telnyx Webhook] User selected option 1');
    // TODO: Transfer call or trigger next action
  } else if (digits === '2') {
    console.log('[Telnyx Webhook] User selected option 2');
    // TODO: Transfer call or trigger next action
  }
}

// ============================================================================
// SMS EVENT HANDLERS
// ============================================================================

/**
 * Handle message sent event
 */
async function handleMessageSent(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Message sent:', data.payload.id);
  
  const messages = await db.getSMSByCompanyId(1);
  const message = messages.find(m => m.messageSid === data.payload.id);
  
  if (message) {
    await db.updateSMSStatus(message.id, 'sent', new Date());
  }
}

/**
 * Handle message delivered event
 */
async function handleMessageDelivered(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Message delivered:', data.payload.id);
  
  const messages = await db.getSMSByCompanyId(1);
  const message = messages.find(m => m.messageSid === data.payload.id);
  
  if (message) {
    await db.updateSMSStatus(message.id, 'delivered', new Date());
  }
}

/**
 * Handle message failed event
 */
async function handleMessageFailed(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Message failed:', data.payload.id);
  
  const messages = await db.getSMSByCompanyId(1);
  const message = messages.find(m => m.messageSid === data.payload.id);
  
  if (message) {
    await db.updateSMSStatus(
      message.id,
      'failed',
      undefined,
      data.payload.errors?.[0]?.code,
      data.payload.errors?.[0]?.title
    );
  }
}

/**
 * Handle incoming message received event
 */
async function handleMessageReceived(data: any): Promise<void> {
  console.log('[Telnyx Webhook] Message received:', data.payload.text);
  
  // Create new inbound SMS record
  await db.createSMS({
    companyId: 1, // TODO: Determine company from phone number
    messageSid: data.payload.id,
    direction: 'inbound',
    from: data.payload.from.phone_number,
    to: data.payload.to[0].phone_number,
    body: data.payload.text,
    status: 'delivered',
    cost: '0.0000', // Inbound SMS are free with Telnyx
  });

  // TODO: Auto-respond using AI
  // const response = await generateAutoResponse(data.payload.text);
  // await sendSMS({ to: data.payload.from.phone_number, text: response });
}

// ============================================================================
// WHATSAPP EVENT HANDLERS
// ============================================================================

/**
 * Handle WhatsApp message finalized event
 */
async function handleWhatsAppFinalized(data: any): Promise<void> {
  console.log('[Telnyx Webhook] WhatsApp finalized:', data.payload.id);
  
  // Find conversation
  const conversation = await db.getWhatsAppConversationByPhone(
    1, // TODO: Get companyId
    data.payload.to[0].phone_number
  );
  
  if (conversation) {
    const messages = await db.getWhatsAppMessagesByConversationId(conversation.id);
    const message = messages.find(m => m.messageSid === data.payload.id);
    
    if (message) {
      await db.updateWhatsAppMessageStatus(
        message.id,
        'delivered',
        new Date()
      );
    }
  }
}

/**
 * Handle WhatsApp message updated event
 */
async function handleWhatsAppUpdated(data: any): Promise<void> {
  console.log('[Telnyx Webhook] WhatsApp updated:', data.payload.id);
  
  const conversation = await db.getWhatsAppConversationByPhone(
    1,
    data.payload.to[0].phone_number
  );
  
  if (conversation) {
    const messages = await db.getWhatsAppMessagesByConversationId(conversation.id);
    const message = messages.find(m => m.messageSid === data.payload.id);
    
    if (message) {
      // Update status based on webhook data
      const status = data.payload.status || 'sent';
      const readAt = status === 'read' ? new Date() : undefined;
      
      await db.updateWhatsAppMessageStatus(
        message.id,
        status,
        undefined,
        readAt
      );
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate AI-powered auto-response for incoming messages
 */
async function generateAutoResponse(incomingMessage: string): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `Eres Ivy-Call, un asistente de ventas de Ivy.AI. 
          Responde de manera profesional y útil a los mensajes entrantes.
          Mantén las respuestas breves (máximo 160 caracteres para SMS).`
        },
        {
          role: 'user',
          content: incomingMessage
        }
      ],
      temperature: 0.7,
      max_tokens: 50
    });

    return response.choices[0].message.content || 'Gracias por tu mensaje. Un representante se pondrá en contacto contigo pronto.';
  } catch (error) {
    console.error('[Telnyx Webhook] Error generating auto-response:', error);
    return 'Gracias por tu mensaje. Un representante se pondrá en contacto contigo pronto.';
  }
}

/**
 * Verify webhook signature (optional security measure)
 */
function verifyWebhookSignature(
  signature: string | undefined,
  timestamp: string | undefined,
  body: any
): boolean {
  // TODO: Implement signature verification using Telnyx public key
  // See: https://developers.telnyx.com/docs/v2/development/webhooks#verifying-webhooks
  return true;
}
