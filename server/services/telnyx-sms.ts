/**
 * Telnyx SMS API Service
 * Handles SMS/MMS messaging via Telnyx Messaging API
 */

import Telnyx from 'telnyx';
import { ENV } from '../_core/env';

// Lazy initialize Telnyx client only when needed
let telnyx: Telnyx | null = null;

function getTelnyxClient(): Telnyx {
  if (!telnyx) {
    if (!ENV.telnyxApiKey) {
      throw new Error('Telnyx API key not configured. Please set TELNYX_API_KEY environment variable.');
    }
    telnyx = new Telnyx(ENV.telnyxApiKey);
  }
  return telnyx;
}

export interface SendSMSParams {
  to: string;
  from?: string;
  text: string;
  mediaUrls?: string[];
  webhookUrl?: string;
}

export interface SMSResponse {
  messageId: string;
  status: string;
  from: string;
  to: string;
  direction: string;
}

/**
 * Send an SMS message
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResponse> {
  try {
    const message = await getTelnyxClient().messages.create({
      from: params.from || ENV.telnyxPhoneNumber,
      to: params.to,
      text: params.text,
      ...(params.mediaUrls && params.mediaUrls.length > 0 && {
        media_urls: params.mediaUrls
      }),
      ...(params.webhookUrl && {
        webhook_url: params.webhookUrl,
        webhook_url_method: 'POST'
      }),
      messaging_profile_id: ENV.telnyxMessagingProfileId
    });

    return {
      messageId: message.data.id,
      status: message.data.to[0].status,
      from: message.data.from.phone_number,
      to: message.data.to[0].phone_number,
      direction: 'outbound'
    };
  } catch (error: any) {
    console.error('[Telnyx SMS] Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Send an MMS message with media attachments
 */
export async function sendMMS(params: SendSMSParams): Promise<SMSResponse> {
  if (!params.mediaUrls || params.mediaUrls.length === 0) {
    throw new Error('MMS requires at least one media URL');
  }

  return sendSMS(params);
}

/**
 * Get message status
 */
export async function getMessageStatus(messageId: string): Promise<any> {
  try {
    const message = await getTelnyxClient().messages.retrieve(messageId);
    return message.data;
  } catch (error: any) {
    console.error('[Telnyx SMS] Error getting message status:', error);
    throw new Error(`Failed to get message status: ${error.message}`);
  }
}

/**
 * Send bulk SMS to multiple recipients
 */
export async function sendBulkSMS(
  recipients: string[],
  text: string,
  from?: string
): Promise<SMSResponse[]> {
  const promises = recipients.map(to =>
    sendSMS({ to, text, from })
  );

  try {
    return await Promise.all(promises);
  } catch (error: any) {
    console.error('[Telnyx SMS] Error sending bulk SMS:', error);
    throw new Error(`Failed to send bulk SMS: ${error.message}`);
  }
}

/**
 * Send SMS with delivery tracking
 */
export async function sendSMSWithTracking(
  params: SendSMSParams,
  webhookUrl: string
): Promise<SMSResponse> {
  return sendSMS({
    ...params,
    webhookUrl
  });
}
