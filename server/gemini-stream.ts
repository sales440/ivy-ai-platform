/**
 * Google Gemini Streaming Integration for ROPA
 * 
 * Provides streaming responses from Gemini API using Server-Sent Events.
 * Falls back to non-streaming if streaming fails.
 */

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || '';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-pro',
];

interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

function convertToGeminiMessages(messages: { role: string; content: string }[]): {
  systemInstruction: string | null;
  contents: GeminiMessage[];
} {
  let systemInstruction: string | null = null;
  const contents: GeminiMessage[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstruction = msg.content;
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  if (contents.length > 0 && contents[0].role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: '.' }] });
  }

  const merged: GeminiMessage[] = [];
  for (const msg of contents) {
    if (merged.length > 0 && merged[merged.length - 1].role === msg.role) {
      merged[merged.length - 1].parts[0].text += '\n' + msg.parts[0].text;
    } else {
      merged.push(msg);
    }
  }

  return { systemInstruction, contents: merged };
}

/**
 * Stream response from Gemini API using streamGenerateContent endpoint.
 * Calls onChunk for each text chunk received.
 * Returns the full concatenated response.
 */
export async function streamGeminiResponse(
  messages: { role: string; content: string }[],
  onChunk: (chunk: string) => void,
  timeoutMs: number = 60000
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    console.warn('[Gemini Stream] No API key configured');
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

  // Try each model in priority order
  for (const model of GEMINI_MODELS) {
    const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[Gemini Stream] Trying ${model}...`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Gemini Stream] ${model} error ${response.status}:`, errorText.substring(0, 200));
        if (response.status === 401 || response.status === 403) {
          throw new Error(`Gemini auth error: ${response.status}`);
        }
        continue; // Try next model
      }

      if (!response.body) {
        console.warn(`[Gemini Stream] ${model} returned no body`);
        continue;
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const data = JSON.parse(jsonStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullText += text;
                onChunk(text);
              }
            } catch (parseErr) {
              // Skip malformed JSON chunks
            }
          }
        }
      }

      if (fullText.length > 0) {
        console.log(`[Gemini Stream] ${model} streamed successfully (${fullText.length} chars)`);
        return fullText;
      }

      console.warn(`[Gemini Stream] ${model} returned empty stream`);
      continue;

    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        console.warn(`[Gemini Stream] ${model} timed out after ${timeoutMs}ms`);
      } else {
        console.error(`[Gemini Stream] ${model} error:`, error.message);
      }
      continue;
    }
  }

  console.warn('[Gemini Stream] All models failed');
  return null;
}

export function isGeminiStreamConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}
