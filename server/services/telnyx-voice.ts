/**
 * Telnyx Voice API Service
 * Handles voice calls via Telnyx Voice API
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

export interface MakeCallParams {
  to: string;
  from: string;
  webhookUrl: string;
  answerUrl?: string;
}

export interface CallResponse {
  callId: string;
  status: string;
  direction: string;
  from: string;
  to: string;
}

/**
 * Initiate an outbound call
 */
export async function makeCall(params: MakeCallParams): Promise<CallResponse> {
  try {
    const call = await getTelnyxClient().calls.create({
      connection_id: ENV.telnyxConnectionId,
      to: params.to,
      from: params.from || ENV.telnyxPhoneNumber,
      webhook_url: params.webhookUrl,
      webhook_url_method: 'POST',
      // Optional: answer_url for custom call flow
      ...(params.answerUrl && { answer_url: params.answerUrl })
    });

    return {
      callId: call.data.call_control_id,
      status: call.data.state,
      direction: 'outbound',
      from: params.from || ENV.telnyxPhoneNumber,
      to: params.to
    };
  } catch (error: any) {
    console.error('[Telnyx Voice] Error making call:', error);
    throw new Error(`Failed to make call: ${error.message}`);
  }
}

/**
 * Answer an incoming call
 */
export async function answerCall(callControlId: string, webhookUrl?: string): Promise<void> {
  try {
    await getTelnyxClient().calls.answer(callControlId, {
      ...(webhookUrl && { 
        webhook_url: webhookUrl,
        webhook_url_method: 'POST'
      })
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error answering call:', error);
    throw new Error(`Failed to answer call: ${error.message}`);
  }
}

/**
 * Hang up a call
 */
export async function hangupCall(callControlId: string): Promise<void> {
  try {
    await getTelnyxClient().calls.hangup(callControlId);
  } catch (error: any) {
    console.error('[Telnyx Voice] Error hanging up call:', error);
    throw new Error(`Failed to hangup call: ${error.message}`);
  }
}

/**
 * Speak text to the caller using Text-to-Speech
 */
export async function speakText(
  callControlId: string,
  text: string,
  voice: string = 'female',
  language: string = 'es-MX'
): Promise<void> {
  try {
    await getTelnyxClient().calls.speak(callControlId, {
      payload: text,
      voice: voice,
      language: language
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error speaking text:', error);
    throw new Error(`Failed to speak text: ${error.message}`);
  }
}

/**
 * Gather input from the caller (DTMF or speech)
 */
export async function gatherInput(
  callControlId: string,
  prompt: string,
  maxDigits: number = 1,
  timeout: number = 5000
): Promise<void> {
  try {
    await getTelnyxClient().calls.gather(callControlId, {
      payload: prompt,
      max_digits: maxDigits,
      timeout_millis: timeout,
      valid_digits: '0123456789#*'
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error gathering input:', error);
    throw new Error(`Failed to gather input: ${error.message}`);
  }
}

/**
 * Start recording a call
 */
export async function startRecording(
  callControlId: string,
  channels: 'single' | 'dual' = 'single'
): Promise<void> {
  try {
    await getTelnyxClient().calls.record_start(callControlId, {
      channels: channels,
      format: 'mp3'
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error starting recording:', error);
    throw new Error(`Failed to start recording: ${error.message}`);
  }
}

/**
 * Stop recording a call
 */
export async function stopRecording(callControlId: string): Promise<void> {
  try {
    await getTelnyxClient().calls.record_stop(callControlId);
  } catch (error: any) {
    console.error('[Telnyx Voice] Error stopping recording:', error);
    throw new Error(`Failed to stop recording: ${error.message}`);
  }
}

/**
 * Transfer a call to another number
 */
export async function transferCall(
  callControlId: string,
  to: string
): Promise<void> {
  try {
    await getTelnyxClient().calls.transfer(callControlId, {
      to: to
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error transferring call:', error);
    throw new Error(`Failed to transfer call: ${error.message}`);
  }
}

/**
 * Bridge two calls together
 */
export async function bridgeCalls(
  callControlId: string,
  targetCallControlId: string
): Promise<void> {
  try {
    await getTelnyxClient().calls.bridge(callControlId, {
      call_control_id: targetCallControlId
    });
  } catch (error: any) {
    console.error('[Telnyx Voice] Error bridging calls:', error);
    throw new Error(`Failed to bridge calls: ${error.message}`);
  }
}

/**
 * Get call status
 */
export async function getCallStatus(callControlId: string): Promise<any> {
  try {
    const call = await getTelnyxClient().calls.retrieve(callControlId);
    return call.data;
  } catch (error: any) {
    console.error('[Telnyx Voice] Error getting call status:', error);
    throw new Error(`Failed to get call status: ${error.message}`);
  }
}
