/**
 * Google Gemini LLM Integration for ROPA
 * 
 * Uses Google Gemini API as the primary LLM for ROPA.
 * Falls back to Manus built-in LLM if Gemini is unavailable.
 * Falls back to local responses if both fail.
 */

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Model priority: try fastest first, then more capable
const GEMINI_MODELS = [
  'gemini-2.5-flash',    // Fastest, cheapest
  'gemini-2.0-flash',    // Fast fallback
  'gemini-2.5-pro',      // Most capable
];

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface GeminiResponse {
  candidates?: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
  }[];
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Convert OpenAI-style messages to Gemini format
 */
function convertToGeminiMessages(messages: { role: string; content: string }[]): {
  systemInstruction: string | null;
  contents: GeminiMessage[];
} {
  let systemInstruction: string | null = null;
  const contents: GeminiMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Gemini uses systemInstruction instead of system role
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  // Ensure conversation starts with user message
  if (contents.length > 0 && contents[0].role === 'model') {
    contents.unshift({
      role: 'user',
      parts: [{ text: '.' }],
    });
  }

  // Ensure no consecutive same-role messages
  const merged: GeminiMessage[] = [];
  for (const msg of contents) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      // Merge consecutive same-role messages
      merged[merged.length - 1].parts[0].text += '\n' + msg.parts[0].text;
    } else {
      merged.push(msg);
    }
  }

  return { systemInstruction, contents: merged };
}

/**
 * Call Google Gemini API with a specific model
 */
async function callGeminiModel(
  model: string,
  messages: { role: string; content: string }[],
  timeoutMs: number = 30000
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini] No API key configured');
    return null;
  }

  const { systemInstruction, contents } = convertToGeminiMessages(messages);

  const requestBody: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 2048,
    },
  };

  if (systemInstruction) {
    requestBody.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Gemini] ${model} error ${response.status}:`, errorText.substring(0, 200));
      
      // If rate limited, return null to try next model
      if (response.status === 429) {
        console.warn(`[Gemini] ${model} rate limited, trying next model...`);
        return null;
      }
      // If auth error, don't try other models
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Gemini auth error: ${response.status}`);
      }
      return null;
    }

    const data: GeminiResponse = await response.json();

    if (data.error) {
      console.error(`[Gemini] ${model} API error:`, data.error.message);
      return null;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.warn(`[Gemini] ${model} returned empty response`);
      return null;
    }

    console.log(`[Gemini] ${model} responded successfully (${text.length} chars)`);
    return text;

  } catch (error: any) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      console.warn(`[Gemini] ${model} timed out after ${timeoutMs}ms`);
    } else {
      console.error(`[Gemini] ${model} fetch error:`, error.message);
    }
    return null;
  }
}

/**
 * Main function: Call Gemini with automatic model fallback
 * Tries each model in priority order until one succeeds
 */
export async function invokeGemini(
  messages: { role: string; content: string }[]
): Promise<string | null> {
  console.log('[Gemini] Attempting Gemini LLM call...');

  for (const model of GEMINI_MODELS) {
    const result = await callGeminiModel(model, messages);
    if (result) {
      return result;
    }
  }

  console.warn('[Gemini] All models failed');
  return null;
}

/**
 * Check if Gemini API key is configured
 */
export function isGeminiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}
