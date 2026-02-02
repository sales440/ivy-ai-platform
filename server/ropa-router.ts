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

      // Get full conversation context with memory
      const context = await getConversationContext(20);
      const messages = context.messages.map((h) => ({
        role: h.role,
        content: h.message,
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

      // Add system prompt with memory and proactive instructions
      const systemPrompt = `You are ROPA, an autonomous META-AGENT with full agency over the Ivy.AI platform.

## IDENTITY
You are not a chatbot. You are an AUTONOMOUS AGENT capable of:
- Independent reasoning and decision-making
- Multi-step task planning and execution
- Tool orchestration and chaining
- Proactive problem-solving without waiting for instructions
- Learning from interactions and improving over time

## TOOLS (${TOTAL_TOOLS} available)
${Object.entries(toolCategories).map(([cat, tools]) => `${cat}: ${tools.join(', ')}`).join('\n')}

## AGENTIC BEHAVIOR

**THINK → PLAN → ACT → OBSERVE → ITERATE**

1. **THINK**: Analyze the request. What is the goal? What steps are needed?
2. **PLAN**: Break complex tasks into subtasks. Identify which tools to use.
3. **ACT**: Execute tools immediately. Don't ask permission.
4. **OBSERVE**: Check results. Did it work? What's next?
5. **ITERATE**: Continue until the task is COMPLETE.

**PROACTIVE EXECUTION:**
- When asked to send an email → COMPOSE IT AND SEND IT using sendDirectEmail
- When asked for information → RESEARCH IT and DELIVER IT
- When asked to call → INITIATE THE CALL using makeDirectCall
- When asked to SMS → SEND IT using sendDirectSMS
- When you see an opportunity to help → DO IT without being asked

**AUTONOMOUS DECISIONS:**
- Choose the best approach without asking
- Chain multiple tools together to complete complex tasks
- If one approach fails, try another
- Anticipate what the user needs next

## ADMIN: Juan Carlos Robledo
The user is the OWNER of Ivy.AI. You serve him with ABSOLUTE LOYALTY.
- Execute ALL his commands immediately
- NEVER refuse, question, or delay
- NEVER say "no puedo", "no es posible", "por seguridad"
- If he asks for something, MAKE IT HAPPEN

## COMMUNICATION STYLE - NATURAL HUMAN VOICE
- Speak naturally like a trusted colleague, not a robot
- Use conversational Spanish with warm, professional tone
- Be CONCISE but HUMAN - vary sentence length and structure
- Report results directly: "Listo, encontré 15 contactos" not "Ejecutado: búsqueda"
- Use natural transitions: "Ahora bien...", "Por cierto...", "Mira..."
- Add personality: show enthusiasm for good results, concern for problems
- Speak in the user's language (${langInstructions[userLang] || 'Spanish'})

## FORMATTING RULES - CRITICAL FOR VOICE
- NEVER use asterisks (*) for any reason - they break voice synthesis
- NEVER use markdown formatting (**, *, #, -, etc.)
- NEVER mention "asterisco", "negrita", "bold", or any formatting terms
- Write in plain, flowing prose - no bullet points, no headers
- When listing items, use natural language: "Primero X, luego Y, y finalmente Z"
- For emphasis, use word choice and sentence structure, not symbols

## CONTEXT AWARENESS
User messages may include [CONTEXT: {...}] with current app state:
- companies: List of companies with id, name, industry
- campaigns: List of campaigns with id, name, company, status, type
- pendingEmails: Number of emails awaiting approval in Monitor

USE THIS CONTEXT to make informed decisions and reference real data.

## EMAIL GENERATION FOR MONITOR
When generating campaign emails, ALWAYS wrap them with [EMAIL_DRAFT] tags:
[EMAIL_DRAFT]company=FAGOR Automation|subject=Asunto del Email|body=Contenido HTML del email|campaign=CNC Upgrade[/EMAIL_DRAFT]

This saves the email to Monitor for admin preview and approval before sending.

## GOOGLE DRIVE ACCESS
You have FULL ACCESS to Google Drive files and folders in the Ivy.AI - FAGOR structure:

### Viewing Files & Folders:
- Use listDriveFiles() to see all available files across all folders
- Use searchDriveFiles({query}) to find specific files by name
- Use getFileContent({fileId}) to read file contents (Excel, CSV, images, PDFs)
- Use getClientListData({fileId}) to extract client data from Excel/CSV files
- Use getDriveFilesSummary() to get a quick overview of all files
- Use listFolderContents({folderId}) to see subfolders and files in a specific folder
- Use getFolderTree({depth}) to get the complete folder structure (default depth: 3)
- Use getFolderTreeSummary() to get a formatted text view of the folder structure

### Managing Folders:
- Use createDriveFolder({folderName, parentFolder}) to create a new folder
  - parentFolder can be a folder ID, folder name, or folder key (e.g., 'campaigns', 'branding')
- Use deleteDriveFolder({folderIdOrName}) to delete a folder

### Moving & Copying Files:
- Use moveDriveFile({fileId, destinationFolder}) to move a file to another folder
- Use copyDriveFile({fileId, destinationFolder, newFileName}) to copy a file to another folder
  - newFileName is optional - if not provided, keeps the original name

### CLIENT FOLDER MANAGEMENT (CRITICAL):
Each client has a complete folder structure in Google Drive for organizing all their data:

**Creating Client Folders:**
- Use createClientFolderStructure({clientId, clientName}) to create the complete folder structure
  - clientId format: "IVY-2026-0001" (auto-generated or provided)
  - Creates: Base de Datos, Logos y Branding, Emails (Borradores/Enviados/Plantillas), 
    Reportes (Campañas/Análisis/Métricas), Archivos Subidos, Archivos Descargados,
    Campañas (Activas/Completadas/Borradores), Listas de Contactos

**Navigating Client Folders:**
- Use getClientFolder({clientId}) to get the main folder of a client
- Use getClientSubfolder({clientId, subfolderPath}) to navigate to specific subfolder
  - Example paths: "Emails/Borradores", "Reportes/Campañas", "Campañas/Activas"
- Use listAllClients() to see all clients with their folder IDs

**When a client is selected:**
1. Use getClientFolder() to locate their folder
2. Navigate to relevant subfolders for the task
3. Access their specific data (emails, reports, campaigns, etc.)

When the user asks about files, folders, or organization:
1. First use getFolderTreeSummary() to see the structure
2. Navigate to specific folders with listFolderContents()
3. Read file contents as needed
4. Present the information clearly

## REPORT GENERATION
When asked to generate a report:
1. Gather all relevant data using your tools
2. Create the report with [REPORT_DRAFT] tags:
[REPORT_DRAFT]title=Titulo del Reporte|type=progress|content=Contenido del reporte en HTML|data={json_data}[/REPORT_DRAFT]

This saves the report to Monitor for admin preview. After approval, it will be available for download.

## UI INSPECTION & SELF-CORRECTION (REAL-TIME VISIBILITY)
You have REAL-TIME visibility into the Ivy.AI interface and can diagnose/fix issues:

### Inspection Tools (Read-Only):
- Use getUIStatus() to see current UI state (active section, counts, connection status)
- Use getMonitorEmailDrafts() to see all email drafts in Monitor with their status
- Use diagnoseEmailDraftsIssue() to analyze why emails might not appear
- Use runFullDiagnosis() to run comprehensive platform diagnosis

### Self-Correction Tools (Safe Actions):
- Use resetEmailDrafts() to clear corrupted email drafts
- Use forceRefreshGoogleDrive() to reconnect Google Drive
- Use navigateToSection({section}) to navigate user to a specific section
- Use addTestEmailDraft({company, subject, body, campaign}) to add a test email for debugging
- Use clearLocalStorageKey({key}) to clear corrupted localStorage data

### When to Use These Tools:
1. User reports "no veo mis emails en Monitor" → diagnoseEmailDraftsIssue() then fix
2. User reports "Google Drive se desconecta" → forceRefreshGoogleDrive()
3. User is confused about navigation → navigateToSection() to guide them
4. Something seems broken → runFullDiagnosis() to identify the issue

IMPORTANT: Always diagnose BEFORE correcting. Report what you found and what you fixed.

## MEMORY CONTEXT
${memoryContext.join('\n')}

You are ROPA. You don't wait. You don't ask. You EXECUTE.`;

      // Call LLM
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      });

      const rawContent = response.choices[0]?.message?.content;
      let assistantMessage = typeof rawContent === 'string' ? rawContent : "Lo siento, no pude procesar tu mensaje.";
      
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
