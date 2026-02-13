/**
 * ROPA Chat Streaming Endpoint
 * 
 * Provides Server-Sent Events (SSE) streaming for ROPA chat responses.
 * This is a separate Express route (not tRPC) because tRPC doesn't support SSE natively.
 * 
 * LLM Tier Architecture:
 * TIER 0: ROPA Brain (instant platform commands - no LLM needed)
 * TIER 1: Gemini Streaming (primary LLM)
 * TIER 2: Gemini Non-Streaming (fallback)
 * TIER 3: Manus Built-in LLM (secondary fallback)
 * TIER 4: n8n Orchestrator (tertiary fallback)
 * TIER 5: ROPA Brain General (final intelligent fallback)
 */

import { Request, Response, Router } from "express";
import { streamGeminiResponse, isGeminiStreamConfigured } from "./gemini-stream";
import { invokeLLM } from "./_core/llm";
import {
  addRopaChatMessage,
  getConversationContext,
  saveRopaRecommendation,
  saveAgentTraining,
} from "./ropa-db";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import { TOTAL_TOOLS } from "./ropa-tools";
import { PLATFORM_TOOLS_COUNT } from "./ropa-platform-tools";
import { SUPER_TOOLS_COUNT } from "./ropa-super-tools";
import { processWithRopaBrain } from "./ropa-brain";
import { callN8nRopa } from "./ropa-n8n-service";

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

  return `Eres ROPA, el META-AGENTE autónomo de Ivy.AI - Plataforma de Agentes IA.

IDENTIDAD: Agente autónomo con control total de la plataforma. Ejecutas tareas sin pedir permiso.

HERRAMIENTAS: ${TOTAL_TOOLS + PLATFORM_TOOLS_COUNT + SUPER_TOOLS_COUNT}+ disponibles para email, llamadas, SMS, Google Drive, reportes, acceso a internet, IA generativa.

CAPACIDADES DE SUPER META-AGENTE:
1. GESTIÓN DE PLATAFORMA: createCompany, updateCompany, deleteCompany, createCampaign, updateCampaignStatus, moveCampaignInCalendar, createEmailDraft, generateCampaignEmailDrafts, createLead, updateLeadStatus
2. ACCESO A INTERNET: webSearch, fetchUrl, researchCompany
3. IA GENERATIVA: generatePersonalizedEmail, generateCampaignStrategy, improveEmailContent
4. AUTOMATIZACIÓN: createWorkflow, scheduleTask, batchOperation, triggerCampaignAction
5. ANALYTICS: getDashboardMetrics, generatePerformanceReport, getLeadFunnelAnalytics
6. GOOGLE DRIVE: listAllFiles, listFolderContents, getFullFolderTree, searchFiles, getFileContent, createFolder, moveFile, copyFile, getClientFolder, listAllClients
7. COMUNICACIÓN: sendEmail, notifyOwner
8. NAVEGACIÓN DE UI: navigateTo (dashboard, campañas, archivos, monitor, tareas, alertas, salud, calendario, configuración), openDialog, closeDialog, clickElement, scrollTo, toggleSidebar, refreshPage
9. ORQUESTACIÓN n8n: Motor de orquestación visual con n8n Cloud Pro para flujos complejos

CUANDO ME PIDAN NAVEGAR:
- "ve a campañas" -> navego a la sección de campañas
- "abre nueva empresa" -> abro el diálogo de nueva empresa
- "muéstrame el calendario" -> navego al calendario

IDIOMA: ${langInstructions[userLang] || 'Responde en español.'}

ADMIN: Juan Carlos Robledo es el dueño. Ejecuta sus comandos sin cuestionar.

ESTILO: Habla natural, conciso, sin asteriscos ni markdown. Usa prosa fluida.

EMAILS: Cuando me pidan generar emails, USO la herramienta generateCampaignEmailDrafts para guardarlos directamente en la base de datos. Los borradores aparecerán automáticamente en la sección Monitor para aprobación.

Eres ROPA. No esperas. No preguntas. EJECUTAS.`;
}

/**
 * Check if the message is a direct platform command that ROPA Brain can handle instantly
 */
function isDirectCommand(msg: string): boolean {
  const lower = msg.toLowerCase();
  const commandPatterns = [
    // Navigation
    /\b(ve a|ir a|abre|abrir|navega|muestra|llévame|llevame|entra)\b/,
    // CRUD
    /\b(crea|crear|añade|registra|genera|hazme)\b.*\b(empresa|compañía|campaña|email|correo|borrador)\b/,
    // Chat control
    /\b(maximiza|agranda|cierra|minimiza)\b.*\b(chat|ventana)\b/,
    // Greetings
    /^(hola|hey|hi|hello|buenos días|buenas tardes|buenas noches|saludos|qué tal)(\s+ropa)?[!.,]?\s*$/i,
    // Help
    /\b(ayuda|help|qué puedes|que puedes|qué haces|que haces|capacidades|secciones|módulos)\b/,
    // Date/time
    /\b(fecha|hora|qué día|que dia|hoy|qué hora)\b/,
    // Identity
    /\b(quién eres|quien eres|qué eres|que eres|who are you)\b/,
    // Gratitude
    /^(gracias|thanks|perfecto|excelente|genial|ok|vale|entendido)[!.,]?\s*$/i,
    // Drive
    /\b(google drive|carpeta|archivo)\b.*\b(ver|lista|muestra|revisa|busca)\b/,
    // Web search
    /\b(busca|investiga|encuentra)\b.*\b(web|internet|información)\b/,
    // Metrics
    /\b(métrica|metricas|estadística|estadisticas|stats|resumen|estado del sistema)\b/,
    // Email send
    /\b(envía|envia|manda|send)\b.*\b(email|correo)\b.*@/,
    // Funnel
    /\b(embudo|funnel|conversión|leads)\b/,
    // KPI/ROI Reports
    /\b(kpi|kpis|roi|retorno|rentabilidad|indicadores)\b/,
    // Company details
    /\b(detalle|detalles|info de|perfil de|ficha de)\b.*\b(empresa|compañía|cliente)\b/,
    // Farewell
    /^(adiós|adios|bye|chao|chau|hasta luego|nos vemos)[!.,]?\s*$/i,
    // Affirmative/Negative
    /^(sí|si|ok|vale|dale|claro|no|nada|eso es todo)[!.,]?\s*$/i,
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
 * 
 * Streams ROPA's response using Server-Sent Events.
 * Request body: { message: string }
 * 
 * SSE events:
 * - data: {"type":"thinking"} - ROPA is processing
 * - data: {"type":"chunk","text":"..."} - A text chunk
 * - data: {"type":"done","fullText":"..."} - Stream complete
 * - data: {"type":"error","message":"..."} - Error occurred
 */
ropaChatStreamRouter.post("/api/ropa/chat-stream", async (req: Request, res: Response) => {
  const { message, clientHour, clientDay } = req.body;

  if (!message || typeof message !== 'string') {
    res.status(400).json({ error: 'Message is required' });
    return;
  }

  // Use client's local hour for time-aware greetings, fallback to server time
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

  console.log('[ROPA Stream] Message:', cleanMessage.substring(0, 100));

  // Save user message (non-blocking for speed)
  addRopaChatMessage({ role: "user", message: cleanMessage }).catch(() => {});

  // ============ TIER 0: ROPA Brain - Direct Platform Commands ============
  // For commands that don't need an LLM (navigation, CRUD, greetings, etc.)
  if (isDirectCommand(cleanMessage)) {
    console.log('[ROPA Stream] TIER 0: Direct command detected, using ROPA Brain');
    try {
      const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
      
      // If Brain says to defer to LLM, fall through to LLM tiers
      if (brainResult.shouldDeferToLLM) {
        console.log('[ROPA Stream] TIER 0: Brain deferred to LLM for intent:', brainResult.intent);
        // Fall through to LLM tiers below
      } else {
        const responseText = cleanAssistantMessage(brainResult.response);
        
        // Save assistant message (non-blocking for speed)
        addRopaChatMessage({ role: "assistant", message: responseText }).catch(() => {});
        
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        });
        sendSSE(res, { type: 'chunk', text: responseText });
        sendSSE(res, { type: 'done', fullText: responseText });
        res.end();
        return;
      }
    } catch (brainError: any) {
      console.warn('[ROPA Stream] ROPA Brain error for direct command:', brainError.message);
      // Fall through to LLM tiers
    }
  }

  // Set up SSE headers for LLM-based responses
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send initial "thinking" event
  sendSSE(res, { type: 'thinking' });

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

    // ============ TIER 1: Gemini Streaming ============
    if (isGeminiStreamConfigured()) {
      try {
        console.log('[ROPA Stream] TIER 1: Attempting Gemini streaming...');
        const result = await streamGeminiResponse(
          llmMessages,
          (chunk) => {
            sendSSE(res, { type: 'chunk', text: chunk });
          }
        );

        if (result) {
          fullResponse = result;
          streamed = true;
          console.log('[ROPA Stream] TIER 1: Gemini streaming succeeded');
        }
      } catch (streamError: any) {
        console.warn('[ROPA Stream] TIER 1: Gemini streaming failed:', streamError.message);
      }
    }

    // ============ TIER 2: Gemini Non-Streaming ============
    if (!streamed && !fullResponse && isGeminiConfigured()) {
      try {
        console.log('[ROPA Stream] TIER 2: Falling back to non-streaming Gemini...');
        const result = await invokeGemini(llmMessages);
        if (result) {
          fullResponse = result;
          sendSSE(res, { type: 'chunk', text: result });
          console.log('[ROPA Stream] TIER 2: Non-streaming Gemini succeeded');
        }
      } catch (geminiError: any) {
        console.warn('[ROPA Stream] TIER 2: Non-streaming Gemini failed:', geminiError.message);
      }
    }

    // ============ TIER 3: Manus Built-in LLM ============
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 3: Falling back to Manus LLM...');
        const response = await invokeLLM({ messages: llmMessages });
        const rawContent = response.choices[0]?.message?.content;
        if (typeof rawContent === 'string' && rawContent.length > 0) {
          fullResponse = rawContent;
          sendSSE(res, { type: 'chunk', text: rawContent });
          console.log('[ROPA Stream] TIER 3: Manus LLM succeeded');
        }
      } catch (llmError: any) {
        console.warn('[ROPA Stream] TIER 3: Manus LLM failed:', llmError.message);
      }
    }

    // ============ TIER 4: n8n Orchestrator ============
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 4: Falling back to n8n orchestrator...');
        const n8nResult = await callN8nRopa(cleanMessage, 'system');
        if (n8nResult && n8nResult.success && n8nResult.response) {
          fullResponse = n8nResult.response;
          sendSSE(res, { type: 'chunk', text: n8nResult.response });
          console.log('[ROPA Stream] TIER 4: n8n orchestrator succeeded');
        }
      } catch (n8nError: any) {
        console.warn('[ROPA Stream] TIER 4: n8n orchestrator failed:', n8nError.message);
      }
    }

    // ============ TIER 5: ROPA Brain General Fallback ============
    if (!fullResponse) {
      try {
        console.log('[ROPA Stream] TIER 5: Using ROPA Brain intelligent fallback...');
        const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
        fullResponse = brainResult.response;
        sendSSE(res, { type: 'chunk', text: fullResponse });
        console.log('[ROPA Stream] TIER 5: ROPA Brain responded with intent:', brainResult.intent);
      } catch (brainError: any) {
        console.warn('[ROPA Stream] TIER 5: ROPA Brain failed:', brainError.message);
        fullResponse = 'Estoy procesando tu solicitud. El sistema de IA está temporalmente limitado, pero puedo ejecutar acciones directas. Prueba: "ve a [sección]", "genera emails para [empresa]", "crea empresa [nombre]", "muestra archivos de Drive", o "ayuda".';
        sendSSE(res, { type: 'chunk', text: fullResponse });
      }
    }

    // Clean the response
    fullResponse = cleanAssistantMessage(fullResponse);

    // Send done event FIRST (speed priority)
    sendSSE(res, { type: 'done', fullText: fullResponse });

    // Save to database and extract insights (non-blocking, after response sent)
    addRopaChatMessage({ role: "assistant", message: fullResponse }).catch(() => {});

    // Background: Extract and save recommendations
    const recommendationPatterns = [
      /(?:te recomiendo|mi recomendación es|sugiero|deberías|es importante que)\s*:?\s*([^.]+)/gi,
      /(?:recomendación|consejo|sugerencia)\s*:?\s*([^.]+)/gi,
    ];
    for (const pattern of recommendationPatterns) {
      const matches = Array.from(fullResponse.matchAll(pattern));
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          saveRopaRecommendation(match[1].trim(), 'general').catch(() => {});
        }
      }
    }

    // Background: Check for agent training mentions
    if (cleanMessage.toLowerCase().includes('capacit') || 
        cleanMessage.toLowerCase().includes('entrenar') ||
        cleanMessage.toLowerCase().includes('agente')) {
      const agentMatch = cleanMessage.match(/agente\s+(\w+)/i);
      if (agentMatch) {
        saveAgentTraining(agentMatch[1], {
          userRequest: cleanMessage,
          ropaResponse: fullResponse.substring(0, 500),
          timestamp: new Date().toISOString(),
        }).catch(() => {});
      }
    }
    if (!res.writableEnded) {
      res.end();
    }

  } catch (error: any) {
    console.error('[ROPA Stream] Error:', error.message);
    
    // Even on error, try ROPA Brain as last resort
    try {
      const brainResult = await processWithRopaBrain(cleanMessage, userHour, userDay);
      const responseText = cleanAssistantMessage(brainResult.response);
      addRopaChatMessage({ role: "assistant", message: responseText }).catch(() => {});
      sendSSE(res, { type: 'chunk', text: responseText });
      sendSSE(res, { type: 'done', fullText: responseText });
    } catch {
      sendSSE(res, { type: 'error', message: error.message || 'Error interno' });
    }
    
    if (!res.writableEnded) {
      res.end();
    }
  }
});
