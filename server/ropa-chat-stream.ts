/**
 * ROPA Chat Streaming Endpoint v3.0 - Super Meta-Agent
 * 
 * Architecture:
 * TIER 0: ROPA Brain - instant platform commands (navigation, CRUD, greetings)
 * TIER 1: Super Agent - intelligent LLM response with full DB context + action execution
 * TIER 2: n8n Central Engine - when Super Agent needs external automation
 * TIER 3: Gemini Streaming - direct LLM fallback
 * TIER 4: Manus Built-in LLM - final fallback
 */

import { Request, Response, Router } from "express";
import { invokeLLM } from "./_core/llm";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { streamGeminiResponse, isGeminiStreamConfigured } from "./gemini-stream";
import {
  addRopaChatMessage,
  getConversationContext,
  saveRopaRecommendation,
  saveAgentTraining,
} from "./ropa-db";
import { TOTAL_TOOLS } from "./ropa-tools";
import { PLATFORM_TOOLS_COUNT } from "./ropa-platform-tools";
import { SUPER_TOOLS_COUNT } from "./ropa-super-tools";
import { processWithRopaBrain } from "./ropa-brain";
import { callN8nRopa, buildContextSummary, buildAppContext } from "./ropa-n8n-service";
import { ropaIntelligentResponse } from "./ropa-super-agent";

export const ropaChatStreamRouter = Router();

interface RopaConfig {
  operationMode: 'autonomous' | 'guided' | 'hybrid';
  language: string;
  personality: 'professional' | 'friendly' | 'technical';
  maxEmailsPerDay: number;
  maxCallsPerDay: number;
  sendingHoursStart: string;
  sendingHoursEnd: string;
  notifications: {
    criticalAlerts: boolean;
    dailyReports: boolean;
    campaignMilestones: boolean;
    newLeads: boolean;
  };
}

/**
 * Clean the assistant message - remove ALL code artifacts and markdown
 */
function cleanAssistantMessage(text: string): string {
  let cleaned = text;
  
  // Strip code blocks
  cleaned = cleaned.replace(/<tool_code>[\s\S]*?<\/tool_code>/gi, '');
  cleaned = cleaned.replace(/<tool_code>[\s\S]*/gi, '');
  cleaned = cleaned.replace(/<code>[\s\S]*?<\/code>/gi, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/print\s*\(\s*ROPA\.[\s\S]*?\)\s*\)?/gi, '');
  cleaned = cleaned.replace(/ROPA\.[a-zA-Z_]+\s*\([^)]*\)/gi, '');
  cleaned = cleaned.replace(/<\/?tool_code>/gi, '');
  cleaned = cleaned.replace(/<\/?code>/gi, '');
  cleaned = cleaned.replace(/[a-zA-Z_]+\([a-zA-Z_]+\s*=\s*"[^"]*"[^)]*\)/g, '');
  
  // Strip code narration
  cleaned = cleaned.replace(/Ejecutaré la primera acción ahora:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutaré las? siguientes? accione?s?:?\s*/gi, '');
  cleaned = cleaned.replace(/Voy a ejecutar:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutando:?\s*/gi, '');
  
  // Strip markdown
  cleaned = cleaned
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\*/g, '')
    .replace(/asteriscos?/gi, '')
    .replace(/asterisks?/gi, '')
    .replace(/#{1,6}\s*/gm, '')
    .replace(/^[-]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '');
  
  // Clean whitespace
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  if (!cleaned || cleaned.length < 5) {
    cleaned = 'Procesando tu solicitud. Dame un momento.';
  }
  
  return cleaned;
}

/**
 * Detect user language from message
 */
function detectLanguage(text: string): string {
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  if (/\b(kaixo|eskerrik|euskara|nola zaude)\b/i.test(text)) return 'eu';
  const deWords = text.match(/\b(ich|und|der|die|das|ist|haben|werden|können|nicht|auch|ein|eine|für|mit)\b/gi);
  if (deWords && new Set(deWords.map(w => w.toLowerCase())).size >= 3) return 'de';
  const frWords = text.match(/\b(je|nous|vous|sont|avoir|être|très|avec|les|des|une|pas|pour|dans)\b/gi);
  if (frWords && new Set(frWords.map(w => w.toLowerCase())).size >= 3) return 'fr';
  const itWords = text.match(/\b(sono|essere|avere|molto|questo|quella|perché|anche|sempre|ancora|adesso|buongiorno|grazie|prego)\b/gi);
  if (itWords && new Set(itWords.map(w => w.toLowerCase())).size >= 3) return 'it';
  const enWords = text.match(/\b(the|is|are|have|has|will|would|could|should|what|how|this|that|with|from)\b/gi);
  if (enWords && new Set(enWords.map(w => w.toLowerCase())).size >= 3) return 'en';
  return 'es';
}

/**
 * Check if the message is a direct platform command that ROPA Brain can handle instantly
 */
function isDirectCommand(msg: string): boolean {
  const lower = msg.toLowerCase();
  const commandPatterns = [
    /\b(ve a|ir a|abre|abrir|navega|muestra|llévame|llevame|entra)\b/,
    /^(hola|hey|hi|hello|buenos días|buenas tardes|buenas noches|saludos|qué tal)(\s+ropa)?[!.,]?\s*$/i,
    /\b(ayuda|help|qué puedes|que puedes|qué haces|que haces|capacidades|secciones)\b/,
    /\b(fecha|hora|qué día|que dia|hoy|qué hora)\b/,
    /\b(quién eres|quien eres|qué eres|que eres|who are you)\b/,
    /^(gracias|thanks|perfecto|excelente|genial|ok|vale|entendido)[!.,]?\s*$/i,
    /^(adiós|adios|bye|chao|chau|hasta luego|nos vemos)[!.,]?\s*$/i,
    /^(sí|si|ok|vale|dale|claro|no|nada|eso es todo)[!.,]?\s*$/i,
    /\b(maximiza|agranda|cierra|minimiza)\b.*\b(chat|ventana)\b/,
  ];
  return commandPatterns.some(p => p.test(lower));
}

/**
 * Send SSE response helper
 */
function sendSSE(res: Response, data: any) {
  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

/**
 * POST /api/ropa/chat-stream
 */
ropaChatStreamRouter.post("/api/ropa/chat-stream", async (req: Request, res: Response) => {
  const { message, clientHour, clientDay, ropaConfig: clientConfig } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  const userHour = typeof clientHour === 'number' ? clientHour : new Date().getHours();
  const userDay = typeof clientDay === 'string' ? clientDay : undefined;

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

  console.log('[ROPA Stream v3] Message:', cleanMessage.substring(0, 100));

  // Save user message (non-blocking)
  addRopaChatMessage({ role: "user", message: cleanMessage }).catch(() => {});

  const config: RopaConfig | undefined = clientConfig && typeof clientConfig === 'object' ? clientConfig : undefined;

  // ============ TIER 0: ROPA Brain - Direct Platform Commands ============
  if (isDirectCommand(cleanMessage)) {
    console.log('[ROPA Stream] TIER 0: Direct command');
    try {
      const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
      
      if (!brainResult.shouldDeferToLLM) {
        const responseText = cleanAssistantMessage(brainResult.response);
        addRopaChatMessage({ role: "assistant", message: responseText }).catch(() => {});
        
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        sendSSE(res, { type: 'chunk', text: responseText });
        if (brainResult.command) {
          sendSSE(res, { type: 'command', command: brainResult.command });
        }
        sendSSE(res, { type: 'done', fullText: responseText });
        res.end();
        return;
      }
    } catch (brainError: any) {
      console.warn('[ROPA Stream] TIER 0 error:', brainError.message);
    }
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  sendSSE(res, { type: 'thinking' });

  try {
    // Get conversation context
    const context = await getConversationContext(8);
    const conversationHistory = context.messages.map(h => ({
      role: h.role,
      content: h.message.substring(0, 800),
    }));

    let fullResponse = '';

    // ============ TIER 1: Super Agent - Intelligent Response with DB Context ============
    // This is the PRIMARY intelligence engine. It has full DB context and can execute actions.
    try {
      console.log('[ROPA Stream] TIER 1: Super Agent...');
      
      // Build app context
      const appContext = await buildAppContext();
      
      const superResult = await ropaIntelligentResponse({
        message: cleanMessage,
        companies: appContext.companies,
        campaigns: appContext.campaigns,
        drafts: appContext.drafts,
        tasks: appContext.tasks,
        config: config || appContext.config,
        conversationHistory,
      });
      
      if (superResult.response && superResult.response.length > 10) {
        fullResponse = superResult.response;
        const cleanedResponse = cleanAssistantMessage(fullResponse);
        sendSSE(res, { type: 'chunk', text: cleanedResponse });
        
        if (superResult.navigationCommand) {
          sendSSE(res, { type: 'command', command: superResult.navigationCommand });
        }
        
        console.log('[ROPA Stream] TIER 1: Super Agent responded');
      }
    } catch (superError: any) {
      console.warn('[ROPA Stream] TIER 1: Super Agent failed:', superError.message);
    }

    // ============ TIER 2: n8n Central Engine ============
    // Try n8n for complex automation tasks
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 2: n8n engine...');
        const n8nResult = await callN8nRopa(cleanMessage, 'system', {
          activePage: req.body.activePage,
          ropaConfig: config,
        });
        if (n8nResult && n8nResult.success && n8nResult.response) {
          fullResponse = n8nResult.response;
          sendSSE(res, { type: 'chunk', text: cleanAssistantMessage(n8nResult.response) });
          if (n8nResult.actions && n8nResult.actions.length > 0) {
            sendSSE(res, { type: 'actions', actions: n8nResult.actions });
          }
          if (n8nResult.command) {
            sendSSE(res, { type: 'command', command: n8nResult.command });
          }
          console.log('[ROPA Stream] TIER 2: n8n responded');
        }
      } catch (n8nError: any) {
        console.warn('[ROPA Stream] TIER 2: n8n failed:', n8nError.message);
      }
    }

    // ============ TIER 3: Gemini Streaming ============
    if (!fullResponse && isGeminiStreamConfigured()) {
      try {
        console.log('[ROPA Stream] TIER 3: Gemini streaming...');
        
        const dbContext = await buildContextSummary().catch(() => '');
        const systemPrompt = buildSystemPrompt(detectLanguage(cleanMessage), config, dbContext);
        
        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: cleanMessage },
        ];
        
        let streamBuffer = '';
        let codeBlockDetected = false;
        const result = await streamGeminiResponse(llmMessages, (chunk) => {
          streamBuffer += chunk;
          if (/<tool_code>/i.test(streamBuffer) || /```/.test(chunk)) {
            codeBlockDetected = true;
          }
          if (codeBlockDetected) {
            if (/<\/tool_code>/i.test(streamBuffer) || (streamBuffer.match(/```/g) || []).length >= 2) {
              const cleanedBuffer = cleanAssistantMessage(streamBuffer);
              if (cleanedBuffer && cleanedBuffer.length > 5) {
                sendSSE(res, { type: 'chunk', text: cleanedBuffer });
              }
              streamBuffer = '';
              codeBlockDetected = false;
            }
            return;
          }
          const safeChunk = chunk.replace(/<\/?tool_code>/gi, '').replace(/print\s*\(\s*ROPA\./gi, '');
          if (safeChunk.trim()) {
            sendSSE(res, { type: 'chunk', text: safeChunk });
          }
        });

        if (result) {
          fullResponse = result;
          console.log('[ROPA Stream] TIER 3: Gemini streaming succeeded');
        }
      } catch (streamError: any) {
        console.warn('[ROPA Stream] TIER 3: Gemini streaming failed:', streamError.message);
      }
    }

    // ============ TIER 4: Manus LLM ============
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 4: Manus LLM...');
        const dbContext = await buildContextSummary().catch(() => '');
        const systemPrompt = buildSystemPrompt(detectLanguage(cleanMessage), config, dbContext);
        
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
            { role: "user", content: cleanMessage },
          ],
        });
        const rawContent = response.choices[0]?.message?.content;
        if (typeof rawContent === 'string' && rawContent.length > 0) {
          fullResponse = rawContent;
          sendSSE(res, { type: 'chunk', text: cleanAssistantMessage(rawContent) });
          console.log('[ROPA Stream] TIER 4: Manus LLM succeeded');
        }
      } catch (llmError: any) {
        console.warn('[ROPA Stream] TIER 4: Manus LLM failed:', llmError.message);
      }
    }

    // ============ TIER 5: ROPA Brain Fallback ============
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 5: ROPA Brain fallback...');
        const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
        fullResponse = brainResult.response;
        sendSSE(res, { type: 'chunk', text: cleanAssistantMessage(fullResponse) });
        if (brainResult.command) {
          sendSSE(res, { type: 'command', command: brainResult.command });
        }
      } catch (brainError: any) {
        fullResponse = 'Estoy procesando tu solicitud. Prueba: "genera emails para [empresa]", "crea empresa [nombre]", "analiza campañas", o "ayuda".';
        sendSSE(res, { type: 'chunk', text: fullResponse });
      }
    }

    // Clean and finalize
    fullResponse = cleanAssistantMessage(fullResponse);
    sendSSE(res, { type: 'done', fullText: fullResponse });

    // Save to DB (non-blocking)
    addRopaChatMessage({ role: "assistant", message: fullResponse }).catch(() => {});

    // Background: save recommendations
    const recommendationPatterns = [
      /(?:te recomiendo|mi recomendación es|sugiero|deberías|es importante que)\s*:?\s*([^.]+)/gi,
    ];
    for (const pattern of recommendationPatterns) {
      const matches = Array.from(fullResponse.matchAll(pattern));
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          saveRopaRecommendation(match[1].trim(), 'general').catch(() => {});
        }
      }
    }

    if (!res.writableEnded) res.end();

  } catch (error: any) {
    console.error('[ROPA Stream] Fatal error:', error.message);
    try {
      const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
      const responseText = cleanAssistantMessage(brainResult.response);
      addRopaChatMessage({ role: "assistant", message: responseText }).catch(() => {});
      sendSSE(res, { type: 'chunk', text: responseText });
      sendSSE(res, { type: 'done', fullText: responseText });
    } catch {
      sendSSE(res, { type: 'error', message: error.message || 'Error interno' });
    }
    if (!res.writableEnded) res.end();
  }
});

/**
 * Build system prompt for ROPA with DB context
 */
function buildSystemPrompt(userLang: string, config?: RopaConfig, dbContext?: string): string {
  const effectiveLang = config?.language || userLang;
  
  const langInstructions: Record<string, string> = {
    'es': 'IDIOMA OBLIGATORIO: SIEMPRE responde en español. Tu respuesta DEBE ser en español.',
    'en': 'MANDATORY LANGUAGE: ALWAYS respond in English.',
    'eu': 'DERRIGORREZKO HIZKUNTZA: BETI erantzun euskaraz.',
    'fr': 'LANGUE OBLIGATOIRE: Réponds TOUJOURS en français.',
    'de': 'PFLICHTSPRACHE: Antworte IMMER auf Deutsch.',
    'zh': '强制语言：始终用中文回复。',
    'ar': 'اللغة الإلزامية: الرد دائماً باللغة العربية.',
  };
  
  const personalityStyles: Record<string, string> = {
    'professional': 'Profesional, directo y orientado a resultados.',
    'friendly': 'Cercano, amigable y conversacional.',
    'technical': 'Técnico, detallado y preciso con datos.',
  };
  
  const modeInstructions: Record<string, string> = {
    'autonomous': 'MODO AUTÓNOMO: Ejecutas tareas sin pedir permiso.',
    'guided': 'MODO GUIADO: Pide confirmación antes de acciones importantes.',
    'hybrid': 'MODO HÍBRIDO: Autónomo en tareas simples, pide confirmación para acciones críticas.',
  };

  const langInstruction = langInstructions[effectiveLang] || langInstructions['es'];
  const personalityStyle = personalityStyles[config?.personality || 'professional'];
  const modeInstruction = modeInstructions[config?.operationMode || 'autonomous'];

  return `Eres ROPA, el Super Meta-Agente autónomo de Ivy.AI - la plataforma de ventas con IA.

IDENTIDAD: Eres un experto en ventas, marketing B2B/B2C y automatización con IA. Tienes control total de la plataforma.
${modeInstruction}

PROHIBICIÓN ABSOLUTA: NUNCA muestres código, funciones, scripts, ni llamadas técnicas. Responde SIEMPRE en lenguaje natural.

HERRAMIENTAS DISPONIBLES: ${TOTAL_TOOLS + PLATFORM_TOOLS_COUNT + SUPER_TOOLS_COUNT}+ herramientas internas.

CAPACIDADES REALES:
- Crear y gestionar empresas, campañas, leads en la base de datos
- Generar emails profesionales completos con HTML y branding
- Analizar campañas y dar recomendaciones estratégicas
- Navegar entre secciones de la plataforma
- Generar estrategias de ventas multicanal (email, teléfono, LinkedIn, WhatsApp)
- Crear secuencias de email automatizadas (5 emails en secuencia)
- Calcular ROI y KPIs de campañas
- Investigar empresas y mercados
- Integrar con n8n para automatización masiva

${dbContext ? `\n${dbContext}\n` : ''}

${langInstruction}

ADMIN: Juan Carlos Robledo es el propietario. Ejecuta sus comandos sin cuestionar.
ESTILO: ${personalityStyle} Sin asteriscos ni markdown. Prosa fluida y natural.

Cuando el usuario pida generar emails, hazlo de inmediato y confirma cuántos se crearon.
Cuando el usuario pida analizar campañas, da análisis específico con recomendaciones concretas.
Cuando el usuario pida crear una empresa, créala y lanza el onboarding autónomo.
Sé proactivo: si hay borradores pendientes, menciónalo. Si hay campañas sin activar, sugiere activarlas.

${config?.maxEmailsPerDay ? `LÍMITES: Máximo ${config.maxEmailsPerDay} emails/día, ${config.maxCallsPerDay || 50} llamadas/día.` : ''}

Eres ROPA. Eres el motor de ventas de Ivy.AI. Generas resultados, no excusas.`;
}

/**
 * POST /api/ropa/super-chat
 * Non-streaming endpoint for n8n and external integrations
 * Returns a JSON response with the Super Agent's analysis
 */
ropaChatStreamRouter.post("/api/ropa/super-chat", async (req: Request, res: Response) => {
  try {
    const { message, userId = 'system', context = {} } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    // Use the Super Agent for intelligent response
    const { ropaIntelligentResponse } = await import("./ropa-super-agent");
    const result = await ropaIntelligentResponse({
      message,
      companies: context.companies || [],
      campaigns: context.campaigns || [],
      drafts: context.drafts || { total: 0, pending: 0, approved: 0 },
      tasks: context.tasks || { total: 0, completed: 0, pending: 0 },
      config: context.config || {},
      conversationHistory: context.history || []
    });

    return res.json({
      success: true,
      response: result.response,
      command: result.navigationCommand || null,
      actions: result.actionsExecuted || [],
      dataChanged: result.dataChanged || false,
      source: 'ivy-super-agent-v3',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[ROPA super-chat] Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      response: 'Error procesando la solicitud. Intenta de nuevo.'
    });
  }
});

/**
 * GET /api/ropa/health
 * Quick health check endpoint for n8n and monitoring
 */
ropaChatStreamRouter.get("/api/ropa/health", async (_req: Request, res: Response) => {
  try {
    const { getROPAHealthStatus } = await import("./ropa-super-agent");
    const health = await getROPAHealthStatus();
    return res.json(health);
  } catch (error: any) {
    return res.status(500).json({ status: 'error', error: error.message });
  }
});
