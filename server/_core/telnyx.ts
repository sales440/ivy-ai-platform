/**
 * Telnyx Voice API Integration for Ivy-Call
 * 
 * Provides functions to initiate outbound calls, manage call state,
 * and retrieve call recordings/transcriptions.
 * 
 * Docs: https://developers.telnyx.com/docs/api/v2/call-control
 */

const TELNYX_API_KEY = process.env.TELNYX_API_KEY;
const TELNYX_PHONE_NUMBER = process.env.TELNYX_PHONE_NUMBER;
const TELNYX_API_BASE = 'https://api.telnyx.com/v2';

interface InitiateCallParams {
  to: string; // Phone number to call (E.164 format)
  from?: string; // Optional override for caller ID
  webhookUrl?: string; // Webhook for call events
}

interface CallResponse {
  data: {
    call_control_id: string;
    call_leg_id: string;
    call_session_id: string;
    is_alive: boolean;
    record_type: string;
  };
}

/**
 * Initiate an outbound call using Telnyx Call Control API
 */
export async function initiateCall(params: InitiateCallParams): Promise<CallResponse> {
  if (!TELNYX_API_KEY) {
    throw new Error('TELNYX_API_KEY not configured');
  }

  const response = await fetch(`${TELNYX_API_BASE}/calls`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TELNYX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      connection_id: process.env.TELNYX_CONNECTION_ID, // Optional: Telnyx connection ID
      to: params.to,
      from: params.from || TELNYX_PHONE_NUMBER,
      webhook_url: params.webhookUrl,
      webhook_url_method: 'POST',
      record: 'record-from-answer', // Auto-record calls
      record_format: 'mp3',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API error: ${error}`);
  }

  return response.json();
}

/**
 * Get call status from Telnyx
 */
export async function getCallStatus(callControlId: string) {
  if (!TELNYX_API_KEY) {
    throw new Error('TELNYX_API_KEY not configured');
  }

  const response = await fetch(`${TELNYX_API_BASE}/calls/${callControlId}`, {
    headers: {
      'Authorization': `Bearer ${TELNYX_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API error: ${error}`);
  }

  return response.json();
}

/**
 * Hang up an active call
 */
export async function hangupCall(callControlId: string) {
  if (!TELNYX_API_KEY) {
    throw new Error('TELNYX_API_KEY not configured');
  }

  const response = await fetch(`${TELNYX_API_BASE}/calls/${callControlId}/actions/hangup`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TELNYX_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API error: ${error}`);
  }

  return response.json();
}

/**
 * Get recording URL for a completed call
 */
export async function getRecording(recordingId: string) {
  if (!TELNYX_API_KEY) {
    throw new Error('TELNYX_API_KEY not configured');
  }

  const response = await fetch(`${TELNYX_API_BASE}/recordings/${recordingId}`, {
    headers: {
      'Authorization': `Bearer ${TELNYX_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API error: ${error}`);
  }

  return response.json();
}

/**
 * Speak text during an active call (TTS)
 */
export async function speakText(callControlId: string, text: string, voice: string = 'female') {
  if (!TELNYX_API_KEY) {
    throw new Error('TELNYX_API_KEY not configured');
  }

  const response = await fetch(`${TELNYX_API_BASE}/calls/${callControlId}/actions/speak`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TELNYX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payload: text,
      voice,
      language: 'en-US',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telnyx API error: ${error}`);
  }

  return response.json();
}
