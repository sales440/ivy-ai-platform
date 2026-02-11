/**
 * ROPA n8n Integration Service
 * 
 * Connects ROPA to the n8n workflow orchestrator for intelligent responses.
 * Used as a fallback tier when Gemini and Manus LLMs are unavailable.
 * Also serves as the orchestration layer for future integrations (Gmail, Calendar, etc.)
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://sales440.app.n8n.cloud/webhook/ropa-chat';
const N8N_TEST_WEBHOOK_URL = process.env.N8N_TEST_WEBHOOK_URL || 'https://sales440.app.n8n.cloud/webhook-test/ropa-chat';
const N8N_TIMEOUT = 15000; // 15 seconds timeout

export interface N8nResponse {
  success: boolean;
  response: string;
  command?: {
    type: string;
    section?: string;
  } | null;
  intent?: string;
  timestamp?: string;
  source?: string;
}

/**
 * Send a message to the n8n ROPA workflow and get a response.
 * Tries production webhook first, then falls back to test webhook.
 */
export async function callN8nRopa(message: string, userId: string = 'anonymous'): Promise<N8nResponse | null> {
  const payload = {
    message,
    userId,
    context: {
      source: 'ivy-ai-backend',
      timestamp: new Date().toISOString(),
    },
  };

  // Try production webhook first
  try {
    console.log('[ROPA n8n] Calling production webhook...');
    const response = await fetchWithTimeout(N8N_WEBHOOK_URL, payload, N8N_TIMEOUT);
    if (response) {
      console.log('[ROPA n8n] Production webhook responded successfully');
      return response;
    }
  } catch (err: any) {
    console.warn('[ROPA n8n] Production webhook failed:', err.message);
  }

  // Fallback to test webhook (works when manually listening in n8n UI)
  try {
    console.log('[ROPA n8n] Trying test webhook...');
    const response = await fetchWithTimeout(N8N_TEST_WEBHOOK_URL, payload, N8N_TIMEOUT);
    if (response) {
      console.log('[ROPA n8n] Test webhook responded successfully');
      return response;
    }
  } catch (err: any) {
    console.warn('[ROPA n8n] Test webhook also failed:', err.message);
  }

  return null;
}

/**
 * Check if n8n is available by pinging the webhook
 */
export async function isN8nAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'ping', userId: 'system' }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Helper: fetch with timeout
 */
async function fetchWithTimeout(url: string, payload: any, timeout: number): Promise<N8nResponse | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as N8nResponse;
    
    if (data.success && data.response) {
      return data;
    }
    
    return null;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}
