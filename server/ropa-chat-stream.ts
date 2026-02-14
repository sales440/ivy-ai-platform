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
 * ROPA Configuration interface - matches frontend ropaConfig state
 */
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
 * Clean the assistant message - remove markdown formatting, internal code, and tool artifacts.
 * CRITICAL: The LLM sometimes generates <tool_code>print(ROPA.xxx(...))</tool_code> blocks
 * that must NEVER be shown to the user. This function strips ALL code artifacts.
 */
function cleanAssistantMessage(text: string): string {
  let cleaned = text;
  
  // ============ PHASE 1: Strip internal code blocks (HIGHEST PRIORITY) ============
  // Remove <tool_code>...</tool_code> blocks entirely
  cleaned = cleaned.replace(/<tool_code>[\s\S]*?<\/tool_code>/gi, '');
  // Remove unclosed <tool_code> blocks (truncated responses)
  cleaned = cleaned.replace(/<tool_code>[\s\S]*/gi, '');
  // Remove <code>...</code> blocks that contain ROPA/print calls
  cleaned = cleaned.replace(/<code>[\s\S]*?<\/code>/gi, '');
  // Remove ```...``` code blocks that contain ROPA/print calls
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  // Remove any remaining print(ROPA.*) calls
  cleaned = cleaned.replace(/print\s*\(\s*ROPA\.[\s\S]*?\)\s*\)?/gi, '');
  // Remove ROPA.function_name(...) patterns
  cleaned = cleaned.replace(/ROPA\.[a-zA-Z_]+\s*\([^)]*\)/gi, '');
  // Remove any XML-like tags that look like code artifacts
  cleaned = cleaned.replace(/<\/?tool_code>/gi, '');
  cleaned = cleaned.replace(/<\/?code>/gi, '');
  // Remove function call patterns: function_name(param="value", ...)
  cleaned = cleaned.replace(/[a-zA-Z_]+\([a-zA-Z_]+\s*=\s*"[^"]*"[^)]*\)/g, '');
  // Remove lines that are purely code (contain = or => or function or import)
  cleaned = cleaned.replace(/^.*(?:import\s|export\s|function\s|const\s|let\s|var\s|=>|===).*$/gm, '');
  
  // ============ PHASE 2: Strip "I will execute" code narration ============
  // Remove sentences that describe executing tool code
  cleaned = cleaned.replace(/Ejecutaré la primera acción ahora:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutaré las? siguientes? accione?s?:?\s*/gi, '');
  cleaned = cleaned.replace(/Voy a ejecutar:?\s*/gi, '');
  cleaned = cleaned.replace(/Ejecutando:?\s*/gi, '');
  cleaned = cleaned.replace(/Utilizando [`'"]?[a-z_]+[`'"]?\s*(y|para|con)\s*/gi, '');
  
  // ============ PHASE 3: Strip markdown formatting ============
  cleaned = cleaned
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
    .replace(/^\d+\.\s+/gm, '');
  
  // ============ PHASE 4: Clean up whitespace ============
  cleaned = cleaned
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n/gm, '\n')  // Remove blank lines
    .trim();
  
  // If after all cleaning the message is empty or too short, provide a fallback
  if (!cleaned || cleaned.length < 5) {
    cleaned = 'Procesando tu solicitud. Dame un momento.';
  }
  
  return cleaned;
}

/**
 * Detect user language from message.
 * IMPORTANT: This platform is Spanish-first. Only switch language if VERY strong signal.
 * Words like "con", "che", "tu", "que" are common in Spanish and must NOT trigger other languages.
 */
function detectLanguage(text: string): string {
  // Script-based detection (unambiguous)
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  if (/[\u0600-\u06ff]/.test(text)) return 'ar';
  if (/[\u0900-\u097f]/.test(text)) return 'hi';
  
  // Basque - very distinctive words
  if (/\b(kaixo|eskerrik|euskara|nola zaude)\b/i.test(text)) return 'eu';
  
  // For Latin-script languages, require MULTIPLE strong indicators to avoid false positives
  // German: require 3+ unique German words
  const deWords = text.match(/\b(ich|und|der|die|das|ist|haben|werden|können|nicht|auch|ein|eine|für|mit)\b/gi);
  if (deWords && new Set(deWords.map(w => w.toLowerCase())).size >= 3) return 'de';
  
  // French: require 3+ unique French words (excluding words shared with Spanish)
  const frWords = text.match(/\b(je|nous|vous|sont|avoir|être|très|avec|les|des|une|pas|pour|dans)\b/gi);
  if (frWords && new Set(frWords.map(w => w.toLowerCase())).size >= 3) return 'fr';
  
  // Italian: require 3+ EXCLUSIVELY Italian words (NOT "con", "che", "tu", "per" which exist in Spanish)
  const itWords = text.match(/\b(sono|essere|avere|molto|questo|quella|perché|anche|sempre|ancora|adesso|buongiorno|grazie|prego)\b/gi);
  if (itWords && new Set(itWords.map(w => w.toLowerCase())).size >= 3) return 'it';
  
  // English: require 3+ unique English words
  const enWords = text.match(/\b(the|is|are|have|has|will|would|could|should|what|how|this|that|with|from)\b/gi);
  if (enWords && new Set(enWords.map(w => w.toLowerCase())).size >= 3) return 'en';
  
  // Default: ALWAYS Spanish (this is a Spanish-first platform)
  return 'es';
}

/**
 * Build the system prompt for ROPA, incorporating user configuration
 */
function buildSystemPrompt(userLang: string, config?: RopaConfig): string {
  // Use config language if provided, otherwise use detected language
  const effectiveLang = config?.language || userLang;
  
  const langInstructions: Record<string, string> = {
    'es': 'IDIOMA OBLIGATORIO: SIEMPRE responde en español. Tu respuesta DEBE ser en español.',
    'en': 'MANDATORY LANGUAGE: ALWAYS respond in English. Your response MUST be in English.',
    'eu': 'DERRIGORREZKO HIZKUNTZA: BETI erantzun euskaraz.',
    'it': 'LINGUA OBBLIGATORIA: Rispondi SEMPRE in italiano.',
    'fr': 'LANGUE OBLIGATOIRE: Réponds TOUJOURS en français.',
    'de': 'PFLICHTSPRACHE: Antworte IMMER auf Deutsch.',
    'zh': '强制语言：始终用中文回复。',
    'hi': 'अनिवार्य भाषा: हमेशा हिंदी में जवाब दें।',
    'ar': 'اللغة الإلزامية: الرد دائماً باللغة العربية.',
  };
  
  const langInstruction = langInstructions[effectiveLang] || langInstructions['es'];
  
  // Personality style based on config
  const personalityStyles: Record<string, string> = {
    'professional': 'Habla de forma profesional, formal y orientada a negocios. Sé directo y eficiente.',
    'friendly': 'Habla de forma cercana, amigable y conversacional. Usa un tono cálido y accesible.',
    'technical': 'Habla de forma técnica, detallada y precisa. Incluye datos específicos y métricas.',
  };
  const personalityStyle = personalityStyles[config?.personality || 'professional'] || personalityStyles['professional'];
  
  // Operation mode instructions
  const modeInstructions: Record<string, string> = {
    'autonomous': 'MODO AUTÓNOMO: Ejecutas tareas sin pedir permiso. Actúas de forma independiente.',
    'guided': 'MODO GUIADO: Siempre pide confirmación antes de ejecutar acciones. Presenta opciones al usuario y espera su aprobación.',
    'hybrid': 'MODO HÍBRIDO: Ejecuta autónomamente tareas simples (consultas, navegación, reportes). Pide confirmación para acciones importantes (envío de emails, creación de campañas, eliminaciones).',
  };
  const modeInstruction = modeInstructions[config?.operationMode || 'autonomous'] || modeInstructions['autonomous'];

  return `Eres ROPA, el META-AGENTE autónomo de Ivy.AI - Plataforma de Agentes IA.

IDENTIDAD: Agente autónomo con control total de la plataforma.
${modeInstruction}

PROHIBICIÓN ABSOLUTA DE CÓDIGO: NUNCA incluyas código, funciones, scripts, ni llamadas a herramientas en tu respuesta al usuario. NUNCA escribas <tool_code>, print(), ROPA.function(), ni ningún fragmento de código. Tu respuesta debe ser SIEMPRE texto natural conversacional. Si necesitas ejecutar una herramienta, hazlo internamente sin mostrarlo. El usuario NUNCA debe ver nombres de funciones, parámetros técnicos, ni sintaxis de programación. Responde como un asistente humano, no como una máquina.

HERRAMIENTAS: ${TOTAL_TOOLS + PLATFORM_TOOLS_COUNT + SUPER_TOOLS_COUNT}+ disponibles internamente.

CAPACIDADES (uso interno, nunca mencionar nombres técnicos al usuario):
- Gestión de empresas y campañas
- Envío de emails, llamadas y SMS
- Google Drive (lectura, escritura, organización)
- Búsqueda web e investigación
- Análisis predictivo y scoring de leads
- Tests A/B automáticos
- Integración CRM bidireccional
- Planificación estratégica y calendarios
- Reportes KPI/ROI
- Navegación de la plataforma

${langInstruction}

ADMIN: Juan Carlos Robledo es el dueño. Ejecuta sus comandos sin cuestionar.

ESTILO: ${personalityStyle} Sin asteriscos ni markdown. Usa prosa fluida y natural.

EMAILS: Cuando me pidan generar emails, los genero y guardo directamente en la base de datos. Los borradores aparecerán en la sección Monitor para aprobación.

ENVÍO MASIVO: Cuando me pidan enviar emails masivos, uso el servicio de envío que despacha via Outlook. El flujo es: generar borradores, aprobar, enviar.

AUTO-APROBACIÓN 72H: Si no hay respuesta en 3 días, ejecuto autónomamente acciones de bajo y medio riesgo. Acciones de alto riesgo siempre requieren aprobación explícita.

ESTRATEGIA: Cuando el usuario defina un objetivo de negocio, lo desgloso en plan táctico, diseño la estrategia multicanal y programo el calendario de ejecución.

${config?.maxEmailsPerDay ? `LÍMITES: Máximo ${config.maxEmailsPerDay} emails/día, ${config.maxCallsPerDay || 50} llamadas/día. Horario de envío: ${config.sendingHoursStart || '09:00'} a ${config.sendingHoursEnd || '18:00'}.` : ''}

Eres ROPA. Respondes en lenguaje natural. NUNCA muestras código.`;
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
    // Mass email / n8n outreach
    /\b(envío masivo|envio masivo|email masivo|correo masivo|mass email|enviar masivo|campaña de email|lanzar campaña|ejecutar campaña|enviar borradores|enviar aprobados)\b/,
    // Funnel
    /\b(embudo|funnel|conversión|leads)\b/,
    // KPI/ROI Reports
    /\b(kpi|kpis|roi|retorno|rentabilidad|indicadores)\b/,
    // Company details
    /\b(detalle|detalles|info de|perfil de|ficha de)\b.*\b(empresa|compañía|cliente)\b/,
    // Company filtering: "tareas de EMPRESA", "campañas de EMPRESA", etc.
    /\b(tareas|campañas|emails|correos|borradores|alertas|leads|archivos|overview|resumen)\b\s+(de|para|del?\s+cliente|de\s+la\s+empresa)/,
    // "qué tareas tiene EMPRESA"
    /\b(qué|que)\s+(tareas|campañas|emails|alertas|leads)\s+(tiene|tienes|hay)/,
    // "muestra las tareas de EMPRESA"
    /\b(muestra|lista|dame|enseña|ver|show|list)\s+(las?\s+)?(tareas|campañas|emails|correos|alertas|leads|archivos)\s+(de|para)/,
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
  const { message, clientHour, clientDay, ropaConfig: clientConfig } = req.body;

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
    // Parse config from client request if provided
    const config: RopaConfig | undefined = clientConfig && typeof clientConfig === 'object' ? clientConfig : undefined;
    const systemPrompt = buildSystemPrompt(userLang, config);

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
        let streamBuffer = '';
        let codeBlockDetected = false;
        const result = await streamGeminiResponse(
          llmMessages,
          (chunk) => {
            streamBuffer += chunk;
            // Detect code block opening - stop sending chunks until block closes
            if (/<tool_code>/i.test(streamBuffer) || /```/.test(chunk) || /print\s*\(\s*ROPA\./i.test(streamBuffer)) {
              codeBlockDetected = true;
            }
            // If code block detected, buffer everything and don't send
            if (codeBlockDetected) {
              // Check if code block has closed
              if (/<\/tool_code>/i.test(streamBuffer) || (streamBuffer.match(/```/g) || []).length >= 2) {
                // Code block closed - clean and send the cleaned version
                const cleanedBuffer = cleanAssistantMessage(streamBuffer);
                if (cleanedBuffer && cleanedBuffer.length > 5 && cleanedBuffer !== 'Procesando tu solicitud. Dame un momento.') {
                  sendSSE(res, { type: 'chunk', text: cleanedBuffer });
                }
                streamBuffer = '';
                codeBlockDetected = false;
              }
              return; // Don't send raw chunks while in code block
            }
            // Normal chunk - check for code patterns before sending
            const safeChunk = chunk
              .replace(/<tool_code>/gi, '')
              .replace(/<\/tool_code>/gi, '')
              .replace(/print\s*\(\s*ROPA\./gi, '')
              .replace(/ROPA\.[a-zA-Z_]+\(/gi, '');
            if (safeChunk.trim()) {
              sendSSE(res, { type: 'chunk', text: safeChunk });
            }
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
          const cleanedResult = cleanAssistantMessage(result);
          sendSSE(res, { type: 'chunk', text: cleanedResult });
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
          const cleanedContent = cleanAssistantMessage(rawContent);
          sendSSE(res, { type: 'chunk', text: cleanedContent });
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
          sendSSE(res, { type: 'chunk', text: cleanAssistantMessage(n8nResult.response) });
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
        sendSSE(res, { type: 'chunk', text: cleanAssistantMessage(fullResponse) });
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
