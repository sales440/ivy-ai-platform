/**
 * Telnyx WhatsApp API Service
 * Handles WhatsApp Business messaging via Telnyx WhatsApp API
 */

import Telnyx from 'telnyx';
import { ENV } from '../_core/env';

// Initialize Telnyx client
const telnyx = new Telnyx(ENV.telnyxApiKey);

export interface SendWhatsAppParams {
  to: string;
  from?: string;
  text?: string;
  mediaUrl?: string;
  type?: 'text' | 'image' | 'video' | 'document' | 'audio' | 'template';
  templateName?: string;
  templateParams?: string[];
  webhookUrl?: string;
}

export interface WhatsAppResponse {
  messageId: string;
  status: string;
  from: string;
  to: string;
}

/**
 * Send a WhatsApp text message
 */
export async function sendWhatsAppMessage(params: SendWhatsAppParams): Promise<WhatsAppResponse> {
  try {
    const messageData: any = {
      from: params.from || ENV.telnyxPhoneNumber,
      to: params.to,
      messaging_profile_id: ENV.telnyxMessagingProfileId
    };

    // Add message content based on type
    if (params.type === 'template' && params.templateName) {
      messageData.type = 'template';
      messageData.template = {
        name: params.templateName,
        language: { code: 'es' },
        ...(params.templateParams && {
          components: [
            {
              type: 'body',
              parameters: params.templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ]
        })
      };
    } else if (params.mediaUrl) {
      // Media message (image, video, document, audio)
      messageData.type = params.type || 'image';
      messageData[params.type || 'image'] = {
        link: params.mediaUrl,
        ...(params.text && { caption: params.text })
      };
    } else {
      // Text message
      messageData.type = 'text';
      messageData.text = params.text || '';
    }

    // Add webhook if provided
    if (params.webhookUrl) {
      messageData.webhook_url = params.webhookUrl;
      messageData.webhook_url_method = 'POST';
    }

    const message = await telnyx.messages.create(messageData);

    return {
      messageId: message.data.id,
      status: message.data.to[0].status,
      from: message.data.from.phone_number,
      to: message.data.to[0].phone_number
    };
  } catch (error: any) {
    console.error('[Telnyx WhatsApp] Error sending message:', error);
    throw new Error(`Failed to send WhatsApp message: ${error.message}`);
  }
}

/**
 * Send a WhatsApp template message
 */
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  templateParams?: string[],
  from?: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    from,
    type: 'template',
    templateName,
    templateParams
  });
}

/**
 * Send a WhatsApp image
 */
export async function sendWhatsAppImage(
  to: string,
  imageUrl: string,
  caption?: string,
  from?: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    from,
    type: 'image',
    mediaUrl: imageUrl,
    text: caption
  });
}

/**
 * Send a WhatsApp video
 */
export async function sendWhatsAppVideo(
  to: string,
  videoUrl: string,
  caption?: string,
  from?: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    from,
    type: 'video',
    mediaUrl: videoUrl,
    text: caption
  });
}

/**
 * Send a WhatsApp document
 */
export async function sendWhatsAppDocument(
  to: string,
  documentUrl: string,
  filename?: string,
  from?: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    from,
    type: 'document',
    mediaUrl: documentUrl,
    text: filename
  });
}

/**
 * Send a WhatsApp audio message
 */
export async function sendWhatsAppAudio(
  to: string,
  audioUrl: string,
  from?: string
): Promise<WhatsAppResponse> {
  return sendWhatsAppMessage({
    to,
    from,
    type: 'audio',
    mediaUrl: audioUrl
  });
}

/**
 * Get WhatsApp message status
 */
export async function getWhatsAppMessageStatus(messageId: string): Promise<any> {
  try {
    const message = await telnyx.messages.retrieve(messageId);
    return message.data;
  } catch (error: any) {
    console.error('[Telnyx WhatsApp] Error getting message status:', error);
    throw new Error(`Failed to get WhatsApp message status: ${error.message}`);
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsApp(
  recipients: string[],
  text: string,
  from?: string
): Promise<WhatsAppResponse[]> {
  const promises = recipients.map(to =>
    sendWhatsAppMessage({ to, text, from })
  );

  try {
    return await Promise.all(promises);
  } catch (error: any) {
    console.error('[Telnyx WhatsApp] Error sending bulk messages:', error);
    throw new Error(`Failed to send bulk WhatsApp messages: ${error.message}`);
  }
}
