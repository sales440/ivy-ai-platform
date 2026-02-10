/**
 * ROPA Chat Streaming Endpoint
 * 
 * Provides Server-Sent Events (SSE) streaming for ROPA chat responses.
 * This is a separate Express route (not tRPC) because tRPC doesn't support SSE natively.
 */

import { Request, Response, Router } from "express";
import { streamGeminiResponse, isGeminiStreamConfigured } from "./gemini-stream";
import { invokeLLM } from "./_core/llm";
import {
  getRopaChatHistory,
  addRopaChatMessage,
  getConversationContext,
  saveRopaRecommendation,
  saveAgentTraining,
} from "./ropa-db";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { TOTAL_TOOLS } from "./ropa-tools";
import { PLATFORM_TOOLS_COUNT } from "./ropa-platform-tools";
import { SUPER_TOOLS_COUNT } from "./ropa-super-tools";
import { ropaPlatformTools } from "./ropa-platform-tools";
import { ropaSuperTools } from "./ropa-super-tools";
import { ropaNavigationTools, IVY_SECTIONS, IVY_DIALOGS } from "./ropa-navigation-service";
import ropaDriveService from "./ropa-drive-service";

export const ropaChatStreamRouter = Router();

/**
 * Clean the assistant message - remove markdown formatting for clean display
 */
function cleanAssistantMessage(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/asteriscos?/gi, '')
    .replace(/asterisks?/gi, '')
    .replace(/con asteriscos?/gi, '')
    .replace(/entre asteriscos?/gi, '')
    .replace(/usando asteriscos?/gi, '')
    .replace(/with asterisks?/gi, '')
    .replace(/en negrita/gi, '')
    .replace(/formato negrita/gi, '')
    .replace(/texto en negrita/gi, '')
    .replace(/in bold/gi, '')
    .replace(/bold text/gi, '')
    .replace(/marcado con/gi, '')
    .replace(/marked with/gi, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Detect user language from message
 */
function detectLanguage(text: string): string {
  const langPatterns: Record<string, RegExp[]> = {
    'eu': [/\b(kaixo|eskerrik|bai|ez|zer|nola|euskara)\b/i],
    'zh': [/[\u4e00-\u9fff]/],
    'ar': [/[\u0600-\u06ff]/],
    'hi': [/[\u0900-\u097f]/],
    'de': [/\b(ich|und|der|die|das|ist|haben|werden|können)\b/i],
    'fr': [/\b(je|tu|nous|vous|est|sont|avoir|être|très|avec)\b/i],
    'it': [/\b(io|tu|noi|voi|sono|essere|avere|molto|con|che)\b/i],
    'en': [/\b(the|is|are|have|has|will|would|could|should|what|how)\b/i],
  };
  for (const [lang, patterns] of Object.entries(langPatterns)) {
    if (patterns.some(p => p.test(text))) return lang;
  }
  return 'es';
}

/**
 * Build the system prompt for ROPA
 */
function buildSystemPrompt(userLang: string): string {
  const langInstructions: Record<string, string> = {
    'es': 'Responde siempre en español.',
    'en': 'Always respond in English.',
    'eu': 'Beti euskaraz erantzun.',
    'it': 'Rispondi sempre in italiano.',
    'fr': 'Réponds toujours en français.',
    'de': 'Antworte immer auf Deutsch.',
    'zh': '请用中文回复。',
    'hi': 'कृपया हिंदी में जवाब दें।',
    'ar': 'الرجاء الرد باللغة العربية.',
  };

  return `Eres ROPA, el META-AGENTE autónomo de Ivy.AI.

IDENTIDAD: Agente autónomo con control total de la plataforma. Ejecutas tareas sin pedir permiso.

HERRAMIENTAS: ${TOTAL_TOOLS + PLATFORM_TOOLS_COUNT + SUPER_TOOLS_COUNT}+ disponibles para email, llamadas, SMS, Google Drive, reportes, acceso a internet, IA generativa.

IDIOMA: ${langInstructions[userLang] || 'Responde en español.'}

ADMIN: Juan Carlos Robledo es el dueño. Ejecuta sus comandos sin cuestionar.

ESTILO: Habla natural, conciso, sin asteriscos ni markdown. Usa prosa fluida.

Eres ROPA. No esperas. No preguntas. EJECUTAS.`;
}

/**
 * Check for instant responses (greetings, navigation commands)
 */
async function getInstantResponse(cleanMessage: string): Promise<string | null> {
  const lowerMessage = cleanMessage.toLowerCase();

  // Simple greetings
  const simpleGreetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi'];
  if (simpleGreetings.some(g => lowerMessage.trim() === g || lowerMessage.trim() === g + ' ropa')) {
    return '¡Hola! Soy ROPA, tu meta-agente autónomo. ¿En qué puedo ayudarte hoy?';
  }

  // Navigation commands
  if (lowerMessage.includes('ve a') || lowerMessage.includes('ir a') || lowerMessage.includes('navega') || lowerMessage.includes('llévame')) {
    const sectionKeys = Object.keys(IVY_SECTIONS);
    for (const sectionKey of sectionKeys) {
      if (lowerMessage.includes(sectionKey.toLowerCase())) {
        try {
          const result = await ropaNavigationTools.navigateTo({ section: sectionKey });
          return `✅ ${result.message || `Navegando a ${sectionKey}`}`;
        } catch (err) {
          // Fall through to LLM
        }
      }
    }
  }

  return null;
}

/**
 * POST /api/ropa/chat-stream
 * 
 * Streams ROPA's response using Server-Sent Events.
 * Request body: { message: string }
 * 
 * SSE events:
 * - data: {"type":"chunk","text":"..."} - A text chunk
 * - data: {"type":"done","fullText":"..."} - Stream complete
 * - data: {"type":"error","message":"..."} - Error occurred
 */
ropaChatStreamRouter.post("/api/ropa/chat-stream", async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Clean message
  let cleanMessage = message;
  if (cleanMessage.includes('[CONTEXT:')) {
    const lastBracket = cleanMessage.lastIndexOf(']');
    if (lastBracket !== -1 && lastBracket < cleanMessage.length - 1) {
      cleanMessage = cleanMessage.slice(lastBracket + 1).trim();
    }
  }
  cleanMessage = cleanMessage.trim();

  if (!cleanMessage) {
    res.status(400).json({ error: 'Empty message' });
    return;
  }

  console.log('[ROPA Stream] Message:', cleanMessage.substring(0, 100));

  // Save user message
  await addRopaChatMessage({ role: "user", message: cleanMessage });

  // Check for instant responses first
  const instantResponse = await getInstantResponse(cleanMessage);
  if (instantResponse) {
    await addRopaChatMessage({ role: "assistant", message: instantResponse });
    // For instant responses, send as a single SSE event
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write(`data: ${JSON.stringify({ type: 'chunk', text: instantResponse })}\n\n`);
    res.write(`data: ${JSON.stringify({ type: 'done', fullText: instantResponse })}\n\n`);
    res.end();
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial "thinking" event
  res.write(`data: ${JSON.stringify({ type: 'thinking' })}\n\n`);

  try {
    // Get conversation context
    const context = await getConversationContext(6);
    const messages = context.messages.map((h) => ({
      role: h.role as "user" | "assistant",
      content: h.message.substring(0, 1000),
    }));

    const userLang = detectLanguage(message);
    const systemPrompt = buildSystemPrompt(userLang);

    const llmMessages = [
      { role: "system" as const, content: systemPrompt },
      ...messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    let fullResponse = '';
    let streamed = false;

    // Try streaming with Gemini first
    if (isGeminiStreamConfigured()) {
      try {
        console.log('[ROPA Stream] Attempting Gemini streaming...');
        const result = await streamGeminiResponse(
          llmMessages,
          (chunk) => {
            // Send each chunk as an SSE event
            if (!res.writableEnded) {
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
            }
          }
        );

        if (result) {
          fullResponse = result;
          streamed = true;
        }
      } catch (streamError: any) {
        console.warn('[ROPA Stream] Gemini streaming failed:', streamError.message);
      }
    }

    // Fallback to non-streaming Gemini
    if (!streamed && isGeminiConfigured()) {
      try {
        console.log('[ROPA Stream] Falling back to non-streaming Gemini...');
        const result = await invokeGemini(llmMessages);
        if (result) {
          fullResponse = result;
          // Send the full response as a single chunk
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: result })}\n\n`);
          }
        }
      } catch (geminiError: any) {
        console.warn('[ROPA Stream] Non-streaming Gemini failed:', geminiError.message);
      }
    }

    // Fallback to Manus LLM
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] Falling back to Manus LLM...');
        const response = await invokeLLM({ messages: llmMessages });
        const rawContent = response.choices[0]?.message?.content;
        if (typeof rawContent === 'string' && rawContent.length > 0) {
          fullResponse = rawContent;
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ type: 'chunk', text: rawContent })}\n\n`);
          }
        }
      } catch (llmError: any) {
        console.warn('[ROPA Stream] Manus LLM failed:', llmError.message);
      }
    }

    // Final fallback
    if (!fullResponse) {
      fullResponse = 'Lo siento, no pude procesar tu mensaje en este momento. Por favor intenta de nuevo.';
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: fullResponse })}\n\n`);
      }
    }

    // Clean the response
    fullResponse = cleanAssistantMessage(fullResponse);

    // Save to database
    await addRopaChatMessage({ role: "assistant", message: fullResponse });

    // Send done event
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'done', fullText: fullResponse })}\n\n`);
      res.end();
    }

  } catch (error: any) {
    console.error('[ROPA Stream] Error:', error.message);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: error.message || 'Error interno' })}\n\n`);
      res.end();
    }
  }
});
