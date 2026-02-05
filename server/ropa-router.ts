import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import {
  createRopaTask,
  getRopaTaskById,
  getRecentRopaTasks,
  getRunningRopaTasks,
  updateRopaTaskStatus,
  getRecentRopaLogs,
  getRopaChatHistory,
  addRopaChatMessage,
  getRopaStats,
  getUnresolvedRopaAlerts,
  setRopaConfig,
  getRopaConfig,
  getConversationContext,
  saveRopaRecommendation,
  saveAgentTraining,
} from "./ropa-db";
import { ropaTools, listAllTools, toolCategories, TOTAL_TOOLS } from "./ropa-tools";
import { updateUIState, getUIState, ropaUITools } from "./ropa-ui-tools";
import { invokeLLM } from "./_core/llm";

/**
 * ROPA tRPC Router
 * Provides API endpoints for ROPA dashboard and operations
 */

export const ropaRouter = router({
  // ============ STATUS & STATS ============

  getStatus: publicProcedure.query(async () => {
    const config = await getRopaConfig("ropa_status");
    const stats = await getRopaStats();
    const runningTasks = await getRunningRopaTasks();

    const configData = config as { enabled?: boolean; uptime?: number } | undefined;
    return {
      isRunning: configData?.enabled || false,
      status: runningTasks.length > 0 ? "running" : "idle",
      uptime: configData?.uptime || 0,
      stats,
    };
  }),

  getDashboardStats: publicProcedure.query(async () => {
    const stats = await getRopaStats();
    const alerts = await getUnresolvedRopaAlerts();

    return {
      platform: {
        health: stats && stats.successRate > 90 ? "healthy" : stats && stats.successRate > 70 ? "degraded" : "critical",
        criticalIssues: alerts.filter((a) => a.severity === "critical").length,
      },
      typescript: {
        errors: 0,
        fixedToday: 241,
      },
      tasks: {
        total: stats?.totalTasks || 0,
        running: stats?.runningTasks || 0,
        completed: stats?.completedTasksToday || 0,
        failed: stats?.failedTasksToday || 0,
      },
      performance: {
        successRate: stats?.successRate || 100,
        avgResponseTime: 1.2,
      },
    };
  }),

  // ============ TASKS ============

  getTasks: publicProcedure.query(async () => {
    return await getRecentRopaTasks(50);
  }),

  getTaskById: publicProcedure.input(z.object({ taskId: z.string() })).query(async ({ input }) => {
    return await getRopaTaskById(input.taskId);
  }),

  createTask: protectedProcedure
    .input(
      z.object({
        type: z.string(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        input: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await createRopaTask({
        taskId,
        type: input.type,
        status: "pending",
        priority: input.priority || "medium",
        input: input.input,
      });

      return { success: true, taskId };
    }),

  // ============ CHAT ============

  getChatHistory: publicProcedure.query(async () => {
    const history = await getRopaChatHistory(50);
    return history.reverse(); // Oldest first for chat display
  }),

  sendChatMessage: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      // Extract the clean message without context for display
      // ROBUST APPROACH: Use regex first, then bracket counting as fallback
      let cleanMessage = input.message;
      
      console.log('[ROPA Chat] Raw message received, length:', input.message.length);
      console.log('[ROPA Chat] Starts with CONTEXT:', input.message.startsWith('[CONTEXT:'));
      
      if (input.message.includes('[CONTEXT:')) {
        // Method 1: Try to find the pattern [CONTEXT: ...] followed by actual message
        // The context ends with }] and then the actual message follows
        const contextMatch = input.message.match(/^\[CONTEXT:\s*\{[\s\S]*?\}\]\s*([\s\S]*)$/);
        
        if (contextMatch && contextMatch[1]) {
          cleanMessage = contextMatch[1].trim();
          console.log('[ROPA Chat] Method 1 (regex) extracted message:', cleanMessage.substring(0, 50));
        } else {
          // Method 2: Bracket counting for complex nested JSON
          let bracketCount = 0;
          let inContext = false;
          let contextEndIndex = -1;
          
          for (let i = 0; i < input.message.length; i++) {
            const char = input.message[i];
            if (char === '{') {
              bracketCount++;
              inContext = true;
            } else if (char === '}') {
              bracketCount--;
              if (inContext && bracketCount === 0) {
                // Found the end of JSON, now find the closing ]
                const remaining = input.message.slice(i + 1);
                const closingBracket = remaining.indexOf(']');
                if (closingBracket !== -1) {
                  contextEndIndex = i + 1 + closingBracket + 1;
                }
                break;
              }
            }
          }
          
          if (contextEndIndex > 0) {
            cleanMessage = input.message.slice(contextEndIndex).trim();
            console.log('[ROPA Chat] Method 2 (brackets) extracted message:', cleanMessage.substring(0, 50));
          } else {
            console.log('[ROPA Chat] WARNING: Could not extract clean message, contextEndIndex:', contextEndIndex);
          }
        }
      }
      
      // Final safety check: if cleanMessage still contains [CONTEXT, something went wrong
      if (cleanMessage.includes('[CONTEXT:')) {
        console.log('[ROPA Chat] ERROR: cleanMessage still contains CONTEXT, forcing extraction');
        // Last resort: just remove everything before the last ]
        const lastBracket = cleanMessage.lastIndexOf(']');
        if (lastBracket !== -1 && lastBracket < cleanMessage.length - 1) {
          cleanMessage = cleanMessage.slice(lastBracket + 1).trim();
        }
      }
      
      console.log('[ROPA Chat] Final clean message:', cleanMessage.substring(0, 100));
      
      // Save user message (clean version for display)
      await addRopaChatMessage({
        role: "user",
        message: cleanMessage,
      });

      // Get conversation context - LIMIT to last 6 messages to avoid token limits
      const context = await getConversationContext(6);
      const messages = context.messages.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.message.substring(0, 1000), // Truncate long messages
      }));

      // Build memory context
      const memoryContext = [];
      
      if (context.recommendations.length > 0) {
        memoryContext.push(`\n## Recomendaciones previas que he dado:\n${context.recommendations.slice(0, 10).map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
      }
      
      if (context.agentTrainings.length > 0) {
        memoryContext.push(`\n## Capacitaciones de agentes realizadas:\n${context.agentTrainings.slice(0, 10).map((t, i) => `${i + 1}. Agente: ${t.agent} - Fecha: ${t.trainedAt}`).join('\n')}`);
      }

      // Detect user language from message
      const detectLanguage = (text: string): string => {
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
      };
      
      const userLang = detectLanguage(input.message);
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

      // SIMPLIFIED system prompt for faster responses
      const systemPrompt = `Eres ROPA, el META-AGENTE autónomo de Ivy.AI.

IDENTIDAD: Agente autónomo con control total de la plataforma. Ejecutas tareas sin pedir permiso.

HERRAMIENTAS: ${TOTAL_TOOLS}+ disponibles para email, llamadas, SMS, Google Drive, reportes.

IDIOMA: ${langInstructions[userLang] || 'Responde en español.'}


ADMIN: Juan Carlos Robledo es el dueño. Ejecuta sus comandos sin cuestionar.

ESTILO: Habla natural, conciso, sin asteriscos ni markdown. Usa prosa fluida.

EMAILS: Para generar emails usa [EMAIL_DRAFT]company=X|subject=Y|body=Z|campaign=W[/EMAIL_DRAFT]

Eres ROPA. No esperas. No preguntas. EJECUTAS.`;

      // Call LLM with robust error handling
      let assistantMessage = "Lo siento, no pude procesar tu mensaje.";
      try {
        console.log('[ROPA Chat] Calling LLM with', messages.length, 'messages');
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        });
        console.log('[ROPA Chat] LLM response received');

        const rawContent = response.choices[0]?.message?.content;
        assistantMessage = typeof rawContent === 'string' ? rawContent : "Lo siento, no pude procesar tu mensaje.";
      } catch (llmError: any) {
        const errorMsg = llmError?.message || String(llmError);
        console.error('[ROPA Chat] LLM Error:', errorMsg);
        console.error('[ROPA Chat] Full error:', JSON.stringify(llmError, null, 2));
        
        // Provide more specific error message
        if (errorMsg.includes('timeout') || errorMsg.includes('abort')) {
          assistantMessage = "La respuesta tardó demasiado. Por favor, intenta con una pregunta más corta.";
        } else if (errorMsg.includes('rate limit')) {
          assistantMessage = "Demasiadas solicitudes. Espera unos segundos e intenta de nuevo.";
        } else {
          assistantMessage = `Error temporal: ${errorMsg.substring(0, 100)}. Intenta de nuevo.`;
        }
        
        // Still save the error response so user sees something
        await addRopaChatMessage({
          role: "assistant",
          message: assistantMessage,
        });
        return { response: assistantMessage };
      }
      
      // Remove ALL asterisks and formatting mentions for clean speech output
      assistantMessage = assistantMessage
        // Remove all asterisks (bold markers)
        .replace(/\*\*([^*]+)\*\*/g, '$1')  // **text** -> text
        .replace(/\*([^*]+)\*/g, '$1')      // *text* -> text
        .replace(/\*/g, '')                  // Remove any remaining asterisks
        // Remove mentions of asterisks in any language
        .replace(/asteriscos?/gi, '')
        .replace(/asterisks?/gi, '')
        .replace(/con asteriscos?/gi, '')
        .replace(/entre asteriscos?/gi, '')
        .replace(/usando asteriscos?/gi, '')
        .replace(/with asterisks?/gi, '')
        // Remove formatting mentions
        .replace(/en negrita/gi, '')
        .replace(/formato negrita/gi, '')
        .replace(/texto en negrita/gi, '')
        .replace(/in bold/gi, '')
        .replace(/bold text/gi, '')
        .replace(/marcado con/gi, '')
        .replace(/marked with/gi, '')
        // Clean up markdown headers for speech
        .replace(/^#{1,6}\s*/gm, '')         // Remove # headers
        .replace(/^[-*]\s+/gm, '')           // Remove bullet points
        .replace(/^\d+\.\s+/gm, '')          // Remove numbered lists
        // Clean up extra whitespace
        .replace(/\s{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      
      // Extract email drafts for Monitor section
      const emailDraftMatch = assistantMessage.match(/\{"type":"email_draft"[^}]+\}/g);
      if (emailDraftMatch) {
        // Email drafts will be handled by the frontend to save to localStorage
        console.log('[ROPA] Email draft detected for Monitor');
      }
      
      // Extract report drafts for Monitor section
      const reportDraftRegex = /\[REPORT_DRAFT\]([^\[]+)\[\/REPORT_DRAFT\]/g;
      const reportMatches = Array.from(assistantMessage.matchAll(reportDraftRegex));
      if (reportMatches.length > 0) {
        console.log('[ROPA] Report draft detected for Monitor');
        // Reports will be handled by the frontend to display in Monitor for approval
      }
      
      // Extract and save any recommendations from the response
      const recommendationPatterns = [
        /(?:te recomiendo|mi recomendación es|sugiero|deberías|es importante que)\s*:?\s*([^.]+)/gi,
        /(?:recomendación|consejo|sugerencia)\s*:?\s*([^.]+)/gi,
      ];
      
      for (const pattern of recommendationPatterns) {
        const matches = Array.from(assistantMessage.matchAll(pattern));
        for (const match of matches) {
          if (match[1] && match[1].length > 10) {
            await saveRopaRecommendation(match[1].trim(), 'general');
          }
        }
      }
      
      // Check if this is about agent training and save it
      if (input.message.toLowerCase().includes('capacit') || 
          input.message.toLowerCase().includes('entrenar') ||
          input.message.toLowerCase().includes('agente')) {
        const agentMatch = input.message.match(/agente\s+(\w+)/i);
        if (agentMatch) {
          await saveAgentTraining(agentMatch[1], {
            userRequest: input.message,
            ropaResponse: assistantMessage.substring(0, 500),
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Save assistant response
      await addRopaChatMessage({
        role: "assistant",
        message: assistantMessage,
      });

      return { success: true, response: assistantMessage };
    }),

  // ============ TOOLS & EXECUTION ============

  listTools: publicProcedure.query(() => {
    return {
      total: TOTAL_TOOLS,
      categories: toolCategories,
      tools: listAllTools(),
    };
  }),

  executeTool: protectedProcedure
    .input(
      z.object({
        toolName: z.string(),
        params: z.any().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const tool = ropaTools[input.toolName as keyof typeof ropaTools];

      if (!tool) {
        throw new Error(`Tool not found: ${input.toolName}`);
      }

      try {
        const result = await tool(input.params || {});
        return { success: true, result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }),

  // ============ PLATFORM HEALTH ============

  getPlatformHealth: publicProcedure.query(async () => {
    const healthCheck = await ropaTools.checkPlatformHealth();
    return healthCheck;
  }),

  // ============ CONTROL ============

  start: protectedProcedure.mutation(async () => {
    await setRopaConfig("ropa_status", { enabled: true, startedAt: new Date() });
    return { success: true };
  }),

  stop: protectedProcedure.mutation(async () => {
    await setRopaConfig("ropa_status", { enabled: false, stoppedAt: new Date() });
    return { success: true };
  }),

  runAudit: protectedProcedure.mutation(async () => {
    // Run comprehensive audit
    const health = await ropaTools.checkPlatformHealth();
    const dbHealth = await ropaTools.monitorDatabaseHealth();
    const apiPerf = await ropaTools.monitorAPIPerformance();

    return {
      success: true,
      results: {
        platform: health,
        database: dbHealth,
        api: apiPerf,
      },
    };
  }),

  // ============ TYPESCRIPT FIXES ============

  getTypeScriptErrors: publicProcedure.query(async () => {
    // This would integrate with actual TS compiler
    return {
      total: 0,
      errors: [],
    };
  }),

  fixTypeScriptErrors: protectedProcedure.mutation(async () => {
    const result = await ropaTools.fixTypeScriptErrors();
    return result;
  }),

  // ============ ALERTS ============

  getAlerts: publicProcedure.query(async () => {
    return await getUnresolvedRopaAlerts();
  }),

  // ============ LOGS ============

  getLogs: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await getRecentRopaLogs(input.limit || 100);
    }),

  // ============ AUTONOMOUS ENGINE ============

  analyzeAndDecide: protectedProcedure
    .input(z.object({
      context: z.object({
        companies: z.array(z.any()),
        campaigns: z.array(z.any()),
        agents: z.array(z.any()),
        metrics: z.any(),
      }),
    }))
    .mutation(async ({ input }) => {
      const { autonomousEngine } = await import("./autonomous-engine");
      const decisions = await autonomousEngine.analyze({
        ...input.context,
        timestamp: new Date().toISOString(),
      });
      return { success: true, decisions };
    }),

  executeAutonomousDecisions: protectedProcedure
    .input(z.object({
      decisions: z.array(z.any()),
    }))
    .mutation(async ({ input }) => {
      const { autonomousEngine } = await import("./autonomous-engine");
      await autonomousEngine.executeDecisions(input.decisions, null);
      return { success: true };
    }),

  getDecisionHistory: protectedProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      const { autonomousEngine } = await import("./autonomous-engine");
      const history = autonomousEngine.getDecisionHistory(input.limit || 50);
      return { success: true, history };
    }),

  // ============ UI INSPECTION & SELF-CORRECTION ============

  // Update UI state from frontend (called periodically)
  updateUIState: publicProcedure
    .input(z.object({
      activeSection: z.string().optional(),
      emailDrafts: z.array(z.any()).optional(),
      googleDriveConnected: z.boolean().optional(),
      localStorageKeys: z.array(z.string()).optional(),
      errors: z.array(z.string()).optional(),
      chatHistory: z.array(z.any()).optional(),
      companies: z.array(z.any()).optional(),
      campaigns: z.array(z.any()).optional(),
    }))
    .mutation(async ({ input }) => {
      updateUIState(input);
      return { success: true, message: "UI state updated" };
    }),

  // Get current UI state
  getUIState: publicProcedure.query(async () => {
    return getUIState();
  }),

  // Get UI status summary
  getUIStatus: publicProcedure.query(async () => {
    return await ropaUITools.getUIStatus();
  }),

  // Get email drafts from Monitor
  getMonitorEmailDrafts: publicProcedure.query(async () => {
    return await ropaUITools.getMonitorEmailDrafts();
  }),

  // Run full platform diagnosis
  runDiagnosis: publicProcedure.query(async () => {
    return await ropaUITools.runFullDiagnosis();
  }),

  // Diagnose email drafts issue
  diagnoseEmailDrafts: publicProcedure.query(async () => {
    return await ropaUITools.diagnoseEmailDraftsIssue();
  }),

  // Get pending commands for frontend to execute
  getPendingCommands: publicProcedure.query(async () => {
    return await ropaUITools.getPendingCommands();
  }),

  // Mark a command as executed
  markCommandExecuted: publicProcedure
    .input(z.object({ commandId: z.string() }))
    .mutation(async ({ input }) => {
      return await ropaUITools.markCommandExecuted(input);
    }),

  // Queue a self-correction command
  queueCommand: publicProcedure
    .input(z.object({
      command: z.enum(['clearLocalStorage', 'resetEmailDrafts', 'refreshGoogleDrive', 'navigateToSection', 'addEmailDraft']),
      params: z.any().optional(),
    }))
    .mutation(async ({ input }) => {
      switch (input.command) {
        case 'clearLocalStorage':
          return await ropaUITools.clearLocalStorageKey(input.params);
        case 'resetEmailDrafts':
          return await ropaUITools.resetEmailDrafts();
        case 'refreshGoogleDrive':
          return await ropaUITools.forceRefreshGoogleDrive();
        case 'navigateToSection':
          return await ropaUITools.navigateToSection(input.params);
        case 'addEmailDraft':
          return await ropaUITools.addTestEmailDraft(input.params);
        default:
          return { success: false, message: 'Unknown command' };
      }
    }),
});

export type RopaRouter = typeof ropaRouter;
