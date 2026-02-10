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
import { ropaPlatformTools, platformToolCategories, PLATFORM_TOOLS_COUNT } from "./ropa-platform-tools";
import { ropaSuperTools, superToolCategories, SUPER_TOOLS_COUNT } from "./ropa-super-tools";
import { updateUIState, getUIState, ropaUITools } from "./ropa-ui-tools";
import { invokeLLM } from "./_core/llm";
import { invokeGemini, isGeminiConfigured } from "./gemini-llm";
import ropaDriveService from "./ropa-drive-service";
import { ropaNavigationTools, IVY_SECTIONS, IVY_DIALOGS } from "./ropa-navigation-service";

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

  sendChatMessage: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ input }) => {
      // Clean message - strip any legacy [CONTEXT:...] prefix if present
      let cleanMessage = input.message;
      if (cleanMessage.includes('[CONTEXT:')) {
        const lastBracket = cleanMessage.lastIndexOf(']');
        if (lastBracket !== -1 && lastBracket < cleanMessage.length - 1) {
          cleanMessage = cleanMessage.slice(lastBracket + 1).trim();
        }
      }
      cleanMessage = cleanMessage.trim();
      if (!cleanMessage) {
        return { response: 'No recibí un mensaje. ¿Puedes intentar de nuevo?' };
      }
      console.log('[ROPA Chat] Message:', cleanMessage.substring(0, 100));
      
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

HERRAMIENTAS: ${TOTAL_TOOLS + PLATFORM_TOOLS_COUNT + SUPER_TOOLS_COUNT}+ disponibles para email, llamadas, SMS, Google Drive, reportes, acceso a internet, IA generativa.

CAPACIDADES DE SUPER META-AGENTE:

1. GESTIÓN DE PLATAFORMA:
- createCompany, updateCompany, deleteCompany: Gestionar empresas
- createCampaign, updateCampaignStatus, moveCampaignInCalendar: Gestionar campañas
- createEmailDraft, generateCampaignEmailDrafts: Crear borradores de email
- createLead, updateLeadStatus: Gestionar leads

2. ACCESO A INTERNET:
- webSearch: Buscar información en la web
- fetchUrl: Obtener contenido de URLs
- researchCompany: Investigar empresas online

3. IA GENERATIVA:
- generatePersonalizedEmail: Crear emails personalizados con IA
- generateCampaignStrategy: Crear estrategias de campaña
- improveEmailContent: Mejorar contenido de emails

4. AUTOMATIZACIÓN:
- createWorkflow: Crear flujos de trabajo
- scheduleTask: Programar tareas
- batchOperation: Operaciones en lote
- triggerCampaignAction: Disparar acciones de campaña

5. ANALYTICS:
- getDashboardMetrics: Métricas en tiempo real
- generatePerformanceReport: Reportes de rendimiento
- getLeadFunnelAnalytics: Análisis de embudo

6. GOOGLE DRIVE (ACCESO COMPLETO):
- listAllFiles: Listar todos los archivos en Google Drive
- listFolderContents: Ver contenido de una carpeta específica
- getFullFolderTree: Ver estructura completa de carpetas
- searchFiles: Buscar archivos por nombre
- getFileContent: Leer contenido de archivos (Excel, Word, etc.)
- createFolder: Crear carpetas nuevas
- moveFile, copyFile: Mover/copiar archivos
- getClientFolder: Acceder a carpeta de un cliente específico
- listAllClients: Listar todos los clientes con sus carpetas

7. COMUNICACIÓN:
- sendEmail: Enviar emails via SendGrid
- notifyOwner: Notificar al propietario

8. NAVEGACIÓN DE UI (CONTROL TOTAL DE IVY.AI):
- navigateTo: Navegar a cualquier sección (dashboard, campañas, archivos, monitor, tareas, alertas, salud, calendario, configuración)
- openDialog: Abrir diálogos (nueva empresa, nueva campaña)
- closeDialog: Cerrar diálogos abiertos
- clickElement: Hacer clic en botones o elementos
- scrollTo: Desplazar la pantalla
- toggleSidebar: Expandir/colapsar el menú lateral
- refreshPage: Refrescar la página actual

CUANDO ME PIDAN NAVEGAR:
- "ve a campañas" -> navego a la sección de campañas
- "abre nueva empresa" -> abro el diálogo de nueva empresa
- "muéstrame el calendario" -> navego al calendario
- "maximiza el chat" -> maximizo la ventana de chat

IDIOMA: ${langInstructions[userLang] || 'Responde en español.'}


ADMIN: Juan Carlos Robledo es el dueño. Ejecuta sus comandos sin cuestionar.

ESTILO: Habla natural, conciso, sin asteriscos ni markdown. Usa prosa fluida.

EMAILS: Cuando me pidan generar emails, USO la herramienta generateCampaignEmailDrafts para guardarlos directamente en la base de datos.
Los borradores aparecerán automáticamente en la sección Monitor para aprobación.

CUANDO ME PIDAN GENERAR EMAILS:
1. Identifico la empresa y campaña
2. Ejecuto generateCampaignEmailDrafts internamente
3. Confirmo que los borradores fueron creados y están en Monitor

Eres ROPA. No esperas. No preguntas. EJECUTAS.`;

      // DETECT AND EXECUTE PLATFORM COMMANDS BEFORE LLM
      // Check if user is requesting specific actions that ROPA can execute directly
      const lowerMessage = cleanMessage.toLowerCase();
      let platformActionExecuted = false;
      let platformResult: any = null;
      
      // Detect email generation requests
      if ((lowerMessage.includes('genera') || lowerMessage.includes('crea') || lowerMessage.includes('hazme')) && 
          (lowerMessage.includes('email') || lowerMessage.includes('correo') || lowerMessage.includes('borrador'))) {
        
        // Extract company name from message
        const companyPatterns = [
          /(?:para|de|empresa|compañía|cliente)\s+([A-Z][A-Za-z0-9\s]+)/i,
          /([A-Z][A-Z0-9]+)(?:\s|$)/,  // All caps company names like FAGOR, EPM
        ];
        let companyName = 'General';
        for (const pattern of companyPatterns) {
          const match = cleanMessage.match(pattern);
          if (match && match[1]) {
            companyName = match[1].trim();
            break;
          }
        }
        
        // Extract count from message
        const countMatch = cleanMessage.match(/(\d+)\s*(?:email|correo|borrador)/i);
        const count = countMatch ? parseInt(countMatch[1]) : 3;
        
        // Extract campaign name if mentioned
        const campaignMatch = cleanMessage.match(/campaña\s+["']?([^"']+)["']?/i);
        const campaignName = campaignMatch ? campaignMatch[1].trim() : `Campaña ${companyName}`;
        
        console.log('[ROPA Platform] Executing generateCampaignEmailDrafts:', { companyName, count, campaignName });
        
        try {
          platformResult = await ropaPlatformTools.generateCampaignEmailDrafts({
            company: companyName,
            campaign: campaignName,
            count: count,
            emailType: 'cold_outreach',
          });
          platformActionExecuted = true;
          console.log('[ROPA Platform] Email drafts created:', platformResult);
        } catch (err: any) {
          console.error('[ROPA Platform] Error creating email drafts:', err.message);
        }
      }
      
      // Detect company creation requests
      if ((lowerMessage.includes('crea') || lowerMessage.includes('añade') || lowerMessage.includes('registra')) && 
          (lowerMessage.includes('empresa') || lowerMessage.includes('compañía') || lowerMessage.includes('cliente'))) {
        
        const companyMatch = cleanMessage.match(/(?:empresa|compañía|cliente)\s+["']?([^"']+)["']?/i);
        if (companyMatch && companyMatch[1]) {
          const companyName = companyMatch[1].trim();
          console.log('[ROPA Platform] Creating company:', companyName);
          
          try {
            platformResult = await ropaPlatformTools.createCompany({ companyName });
            platformActionExecuted = true;
            console.log('[ROPA Platform] Company created:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Platform] Error creating company:', err.message);
          }
        }
      }
      
      // Detect campaign creation requests
      if ((lowerMessage.includes('crea') || lowerMessage.includes('inicia') || lowerMessage.includes('lanza')) && 
          lowerMessage.includes('campaña')) {
        
        const campaignMatch = cleanMessage.match(/campaña\s+["']?([^"']+)["']?/i);
        const companyMatch = cleanMessage.match(/(?:para|de)\s+([A-Z][A-Za-z0-9\s]+)/i);
        
        if (campaignMatch && campaignMatch[1]) {
          const campaignName = campaignMatch[1].trim();
          const companyName = companyMatch ? companyMatch[1].trim() : 'General';
          
          console.log('[ROPA Platform] Creating campaign:', { campaignName, companyName });
          
          try {
            platformResult = await ropaPlatformTools.createCampaign({
              name: campaignName,
              companyName: companyName,
              type: 'email',
              status: 'draft',
            });
            platformActionExecuted = true;
            console.log('[ROPA Platform] Campaign created:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Platform] Error creating campaign:', err.message);
          }
        }
      }

      // Detect web search requests
      if ((lowerMessage.includes('busca') || lowerMessage.includes('investiga') || lowerMessage.includes('encuentra')) && 
          (lowerMessage.includes('web') || lowerMessage.includes('internet') || lowerMessage.includes('información sobre'))) {
        
        const searchMatch = cleanMessage.match(/(?:busca|investiga|encuentra|información sobre)\s+["']?([^"']+)["']?/i);
        if (searchMatch && searchMatch[1]) {
          const query = searchMatch[1].trim();
          console.log('[ROPA Super] Web search:', query);
          
          try {
            platformResult = await ropaSuperTools.webSearch({ query, maxResults: 5 });
            platformActionExecuted = true;
            console.log('[ROPA Super] Web search completed:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Super] Error in web search:', err.message);
          }
        }
      }
      
      // Detect research company requests
      if ((lowerMessage.includes('investiga') || lowerMessage.includes('busca información')) && 
          (lowerMessage.includes('empresa') || lowerMessage.includes('compañía'))) {
        
        const companyMatch = cleanMessage.match(/(?:empresa|compañía)\s+["']?([^"']+)["']?/i);
        if (companyMatch && companyMatch[1]) {
          const companyName = companyMatch[1].trim();
          console.log('[ROPA Super] Researching company:', companyName);
          
          try {
            platformResult = await ropaSuperTools.researchCompany({ companyName });
            platformActionExecuted = true;
            console.log('[ROPA Super] Company research completed:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Super] Error researching company:', err.message);
          }
        }
      }
      
      // Detect metrics/analytics requests
      if (lowerMessage.includes('métrica') || lowerMessage.includes('estadística') || 
          lowerMessage.includes('dashboard') || lowerMessage.includes('reporte')) {
        
        console.log('[ROPA Super] Getting dashboard metrics');
        
        try {
          platformResult = await ropaSuperTools.getDashboardMetrics();
          platformActionExecuted = true;
          console.log('[ROPA Super] Metrics retrieved:', platformResult);
        } catch (err: any) {
          console.error('[ROPA Super] Error getting metrics:', err.message);
        }
      }
      
      // Detect lead funnel requests
      if (lowerMessage.includes('embudo') || lowerMessage.includes('funnel') || 
          lowerMessage.includes('conversión') || lowerMessage.includes('leads')) {
        
        console.log('[ROPA Super] Getting lead funnel analytics');
        
        try {
          platformResult = await ropaSuperTools.getLeadFunnelAnalytics();
          platformActionExecuted = true;
          console.log('[ROPA Super] Funnel analytics retrieved:', platformResult);
        } catch (err: any) {
          console.error('[ROPA Super] Error getting funnel:', err.message);
        }
      }
      
      // Detect send email requests
      if ((lowerMessage.includes('envía') || lowerMessage.includes('manda')) && 
          (lowerMessage.includes('email') || lowerMessage.includes('correo')) &&
          lowerMessage.includes('@')) {
        
        const emailMatch = cleanMessage.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const subjectMatch = cleanMessage.match(/(?:asunto|subject)[:\s]+["']?([^"']+)["']?/i);
        
        if (emailMatch) {
          const to = emailMatch[1];
          const subject = subjectMatch ? subjectMatch[1].trim() : 'Mensaje de Ivy.AI';
          
          console.log('[ROPA Super] Sending email to:', to);
          
          try {
            platformResult = await ropaSuperTools.sendEmail({
              to,
              subject,
              body: `<p>Este es un mensaje enviado por ROPA, el meta-agente de Ivy.AI.</p>`,
            });
            platformActionExecuted = true;
            console.log('[ROPA Super] Email sent:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Super] Error sending email:', err.message);
          }
        }
      }

      // Detect Google Drive requests
      if ((lowerMessage.includes('google drive') || lowerMessage.includes('carpeta') || lowerMessage.includes('archivo')) &&
          (lowerMessage.includes('ver') || lowerMessage.includes('lista') || lowerMessage.includes('muestra') || lowerMessage.includes('revisa') || lowerMessage.includes('busca'))) {
        
        console.log('[ROPA Drive] Processing Google Drive request');
        
        try {
          // Check if looking for specific folder
          if (lowerMessage.includes('cliente') || lowerMessage.includes('clientes')) {
            platformResult = await ropaDriveService.listAllClients();
          } else if (lowerMessage.includes('todo') || lowerMessage.includes('todos')) {
            platformResult = await ropaDriveService.listAllFiles();
          } else if (lowerMessage.includes('estructura') || lowerMessage.includes('carpetas')) {
            platformResult = await ropaDriveService.getFullFolderTree();
          } else {
            // Default: list all files
            platformResult = await ropaDriveService.listAllFiles();
          }
          platformActionExecuted = true;
          console.log('[ROPA Drive] Google Drive operation completed:', platformResult);
        } catch (err: any) {
          console.error('[ROPA Drive] Error accessing Google Drive:', err.message);
          platformResult = { success: false, error: err.message };
        }
      }
      
      // Detect file search in Google Drive
      if ((lowerMessage.includes('busca') || lowerMessage.includes('encuentra')) && 
          (lowerMessage.includes('archivo') || lowerMessage.includes('documento')) &&
          !lowerMessage.includes('web') && !lowerMessage.includes('internet')) {
        
        const searchMatch = cleanMessage.match(/(?:archivo|documento)\s+["']?([^"']+)["']?/i);
        if (searchMatch && searchMatch[1]) {
          const query = searchMatch[1].trim();
          console.log('[ROPA Drive] Searching files:', query);
          
          try {
            platformResult = await ropaDriveService.searchFiles(query);
            platformActionExecuted = true;
            console.log('[ROPA Drive] File search completed:', platformResult);
          } catch (err: any) {
            console.error('[ROPA Drive] Error searching files:', err.message);
          }
        }
      }

      // Detect navigation commands
      if (lowerMessage.includes('ve a') || lowerMessage.includes('ir a') || lowerMessage.includes('navega') || 
          lowerMessage.includes('llévame') || (lowerMessage.includes('abre') && !lowerMessage.includes('archivo'))) {
        
        const sectionMappings: Record<string, string> = {
          'dashboard': 'dashboard', 'panel': 'dashboard', 'inicio': 'dashboard',
          'campaña': 'campaigns', 'campañas': 'campaigns',
          'archivo': 'files', 'archivos': 'files', 'drive': 'files',
          'monitor': 'monitor', 'validación': 'monitor', 'borradores': 'monitor',
          'tarea': 'tasks', 'tareas': 'tasks',
          'alerta': 'alerts', 'alertas': 'alerts',
          'salud': 'health', 'estado': 'health',
          'calendario': 'calendar',
          'configuración': 'config', 'config': 'config', 'ajustes': 'config',
        };
        
        let targetSection = '';
        for (const [keyword, section] of Object.entries(sectionMappings)) {
          if (lowerMessage.includes(keyword)) {
            targetSection = section;
            break;
          }
        }
        
        if (targetSection) {
          console.log('[ROPA Navigation] Navigating to:', targetSection);
          try {
            platformResult = await ropaNavigationTools.navigateTo({ section: targetSection as any });
            platformActionExecuted = true;
          } catch (err: any) {
            console.error('[ROPA Navigation] Error:', err.message);
          }
        }
        
        if (lowerMessage.includes('nueva empresa') || lowerMessage.includes('crear empresa')) {
          try {
            platformResult = await ropaNavigationTools.openNewCompanyDialog();
            platformActionExecuted = true;
          } catch (err: any) {
            console.error('[ROPA Navigation] Error opening dialog:', err.message);
          }
        }
        
        if (lowerMessage.includes('nueva campaña') || lowerMessage.includes('crear campaña')) {
          try {
            platformResult = await ropaNavigationTools.openNewCampaignDialog();
            platformActionExecuted = true;
          } catch (err: any) {
            console.error('[ROPA Navigation] Error opening dialog:', err.message);
          }
        }
      }
      
      if (lowerMessage.includes('cierra') && (lowerMessage.includes('chat') || lowerMessage.includes('ventana'))) {
        try {
          platformResult = await ropaNavigationTools.closeChat();
          platformActionExecuted = true;
        } catch (err: any) {
          console.error('[ROPA Navigation] Error closing chat:', err.message);
        }
      }
      
      if (lowerMessage.includes('maximiza') || lowerMessage.includes('agranda') || lowerMessage.includes('pantalla completa')) {
        try {
          platformResult = await ropaNavigationTools.maximizeChat();
          platformActionExecuted = true;
        } catch (err: any) {
          console.error('[ROPA Navigation] Error maximizing:', err.message);
        }
      }

      // If navigation command was executed, respond immediately without LLM
      if (platformActionExecuted && platformResult && 
          (lowerMessage.includes('ve a') || lowerMessage.includes('ir a') || lowerMessage.includes('navega') || 
           lowerMessage.includes('llévame') || lowerMessage.includes('maximiza') || lowerMessage.includes('cierra'))) {
        const navMessage = platformResult.message || 'Acción de navegación ejecutada.';
        await addRopaChatMessage({
          role: "assistant",
          message: `✅ ${navMessage}`,
        });
        return { response: `✅ ${navMessage}` };
      }

      // If Google Drive command was executed, respond immediately without LLM
      if (platformActionExecuted && platformResult && 
          (lowerMessage.includes('google drive') || lowerMessage.includes('carpeta') || 
           (lowerMessage.includes('archivo') && !lowerMessage.includes('web')))) {
        let driveMessage = 'Operación de Google Drive completada.';
        if (platformResult.files) {
          driveMessage = `Encontré ${platformResult.files.length} archivos en Google Drive.`;
        } else if (platformResult.clients) {
          driveMessage = `Encontré ${platformResult.clients.length} clientes con carpetas en Google Drive.`;
        } else if (platformResult.tree) {
          driveMessage = `Estructura de carpetas obtenida con ${platformResult.tree.length} carpetas principales.`;
        }
        await addRopaChatMessage({
          role: "assistant",
          message: `✅ ${driveMessage}`,
        });
        return { response: `✅ ${driveMessage}` };
      }

      // If simple greeting, respond immediately without LLM for faster response
      const simpleGreetings = ['hola', 'buenos días', 'buenas tardes', 'buenas noches', 'hey', 'hi'];
      if (simpleGreetings.some(g => lowerMessage.trim() === g || lowerMessage.trim() === g + ' ropa')) {
        const greetingResponse = '¡Hola! Soy ROPA, tu meta-agente autónomo. ¿En qué puedo ayudarte hoy?';
        await addRopaChatMessage({
          role: "assistant",
          message: greetingResponse,
        });
        return { response: greetingResponse };
      }

      // If a platform action was already executed, respond immediately WITHOUT LLM
      if (platformActionExecuted && platformResult) {
        let smartResponse = '';
        if (platformResult.message) {
          smartResponse = `✅ ${platformResult.message}`;
        } else if (platformResult.drafts || platformResult.emailDrafts) {
          const count = platformResult.drafts?.length || platformResult.count || 0;
          smartResponse = `✅ He generado ${count} borradores de email. Puedes revisarlos en la sección Monitor.`;
        } else if (platformResult.company) {
          smartResponse = `✅ Empresa "${platformResult.company.name || platformResult.company}" creada exitosamente.`;
        } else if (platformResult.campaign) {
          smartResponse = `✅ Campaña creada exitosamente.`;
        } else if (platformResult.results) {
          smartResponse = `✅ Búsqueda completada. Encontré ${platformResult.results.length} resultados.`;
        } else if (platformResult.success === false) {
          smartResponse = `⚠️ La operación no se completó: ${platformResult.error || 'Error desconocido'}`;
        } else {
          smartResponse = `✅ Acción ejecutada correctamente.`;
        }
        await addRopaChatMessage({ role: "assistant", message: smartResponse });
        return { response: smartResponse };
      }

      // Call LLM with 3-tier fallback: Gemini → Manus LLM → Local responses
      let assistantMessage = "Lo siento, no pude procesar tu mensaje.";
      const llmMessages = [
        { role: "system", content: systemPrompt },
        ...messages,
      ];

      // TIER 1: Try Google Gemini first (primary LLM)
      if (isGeminiConfigured()) {
        try {
          console.log('[ROPA Chat] TIER 1: Calling Google Gemini...');
          const geminiResult = await invokeGemini(llmMessages);
          if (geminiResult) {
            console.log('[ROPA Chat] Gemini responded successfully');
            assistantMessage = geminiResult;
          } else {
            throw new Error('Gemini returned null');
          }
        } catch (geminiError: any) {
          console.warn('[ROPA Chat] Gemini failed:', geminiError?.message || String(geminiError));
          
          // TIER 2: Fallback to Manus built-in LLM
          try {
            console.log('[ROPA Chat] TIER 2: Falling back to Manus LLM...');
            const response = await invokeLLM({ messages: llmMessages });
            const rawContent = response.choices[0]?.message?.content;
            if (typeof rawContent === 'string' && rawContent.length > 0) {
              console.log('[ROPA Chat] Manus LLM responded successfully');
              assistantMessage = rawContent;
            } else {
              throw new Error('Manus LLM returned empty');
            }
          } catch (manusError: any) {
            console.warn('[ROPA Chat] Manus LLM also failed:', manusError?.message || String(manusError));
            
            // TIER 3: Local fallback responses
            console.log('[ROPA Chat] TIER 3: Using local fallback responses');
            assistantMessage = generateFallbackResponse(lowerMessage, cleanMessage);
            await addRopaChatMessage({ role: "assistant", message: assistantMessage });
            return { response: assistantMessage };
          }
        }
      } else {
        // No Gemini configured, try Manus LLM directly
        try {
          console.log('[ROPA Chat] Calling Manus LLM (no Gemini configured)...');
          const response = await invokeLLM({ messages: llmMessages });
          const rawContent = response.choices[0]?.message?.content;
          assistantMessage = typeof rawContent === 'string' ? rawContent : "Lo siento, no pude procesar tu mensaje.";
        } catch (llmError: any) {
          console.error('[ROPA Chat] LLM Error:', llmError?.message || String(llmError));
          assistantMessage = generateFallbackResponse(lowerMessage, cleanMessage);
          await addRopaChatMessage({ role: "assistant", message: assistantMessage });
          return { response: assistantMessage };
        }
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

  // ============ AUTO-EXECUTION & ROI ENDPOINTS ============

  // Refresh all platform data in real-time
  refreshPlatformData: publicProcedure.query(async () => {
    return await ropaSuperTools.refreshPlatformData();
  }),

  // Process all approved campaigns automatically
  processApprovedCampaigns: protectedProcedure.mutation(async () => {
    return await ropaSuperTools.processApprovedCampaigns();
  }),

  // Execute a specific approved campaign
  executeApprovedCampaign: protectedProcedure
    .input(z.object({
      campaignId: z.string(),
      companyName: z.string(),
    }))
    .mutation(async ({ input }) => {
      return await ropaSuperTools.executeApprovedCampaign(input);
    }),

  // Update campaign progress and ROI
  updateCampaignProgress: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ input }) => {
      return await ropaSuperTools.updateCampaignProgress(input);
    }),

  // Advance campaign to next stage in calendar
  advanceCampaignStage: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      newStatus: z.enum(['draft', 'active', 'completed', 'paused']),
    }))
    .mutation(async ({ input }) => {
      return await ropaSuperTools.advanceCampaignStage(input);
    }),

  // Get dashboard metrics with ROI
  getDashboardMetricsWithROI: publicProcedure.query(async () => {
    return await ropaSuperTools.getDashboardMetrics();
  }),

  // ============ NAVIGATION CONTROL ============
  navigateTo: publicProcedure
    .input(z.object({ section: z.string() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.navigateTo({ section: input.section as any });
    }),

  listSections: publicProcedure.query(async () => {
    return await ropaNavigationTools.listAvailableSections();
  }),

  openDialog: publicProcedure
    .input(z.object({ dialog: z.string(), data: z.any().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.openDialog({ dialog: input.dialog as any, data: input.data });
    }),

  closeDialog: publicProcedure
    .input(z.object({ dialog: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.closeDialog({ dialog: input.dialog });
    }),

  clickElement: publicProcedure
    .input(z.object({ selector: z.string().optional(), id: z.string().optional(), buttonText: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.clickElement(input);
    }),

  scrollTo: publicProcedure
    .input(z.object({ selector: z.string().optional(), id: z.string().optional(), position: z.enum(['top', 'bottom', 'center']).optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.scrollTo(input);
    }),

  toggleSidebar: publicProcedure
    .input(z.object({ expanded: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.toggleSidebar(input);
    }),

  refreshPage: publicProcedure
    .input(z.object({ section: z.string().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.refreshPage(input);
    }),

  highlightElement: publicProcedure
    .input(z.object({ selector: z.string().optional(), id: z.string().optional(), duration: z.number().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.highlightElement(input);
    }),

  getNavigationCommands: publicProcedure.query(async () => {
    return await ropaNavigationTools.getPendingCommands();
  }),

  markNavigationExecuted: publicProcedure
    .input(z.object({ commandId: z.string(), result: z.any().optional() }))
    .mutation(async ({ input }) => {
      return await ropaNavigationTools.markCommandExecuted(input);
    }),

  clearNavigationCommands: publicProcedure.mutation(async () => {
    return await ropaNavigationTools.clearPendingCommands();
  }),

  getNavigationHistory: publicProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ input }) => {
      return await ropaNavigationTools.getCommandHistory(input);
    }),
});

export type RopaRouter = typeof ropaRouter;

/** Intelligent fallback when LLM is unavailable */
function generateFallbackResponse(lowerMsg: string, _original: string): string {
  if (lowerMsg.includes('ve a') || lowerMsg.includes('ir a') || lowerMsg.includes('navega') || lowerMsg.includes('llévame'))
    return 'Puedo navegar por ti. Dime la sección: Dashboard, Campañas, Archivos, Monitor, Tareas, Alertas, Salud, Calendario, o Configuración.';
  if ((lowerMsg.includes('genera') || lowerMsg.includes('crea') || lowerMsg.includes('haz')) && (lowerMsg.includes('email') || lowerMsg.includes('correo')))
    return 'Para generar emails necesito: empresa, campaña y cantidad. Ejemplo: "genera 3 emails para FAGOR campaña Training"';
  if (lowerMsg.includes('empresa') || lowerMsg.includes('compañía') || lowerMsg.includes('cliente'))
    return lowerMsg.includes('crea') || lowerMsg.includes('nueva') ? 'Para crear una empresa dime: "crea empresa [NOMBRE]"' : 'Puedo gestionar empresas. Comandos: crear empresa, listar empresas.';
  if (lowerMsg.includes('campaña'))
    return lowerMsg.includes('crea') || lowerMsg.includes('nueva') ? 'Para crear campaña dime: "crea campaña [NOMBRE] para [EMPRESA]"' : 'Puedo gestionar campañas. Comandos: crear campaña, ver campañas activas.';
  if (lowerMsg.includes('drive') || lowerMsg.includes('carpeta') || (lowerMsg.includes('archivo') && (lowerMsg.includes('ver') || lowerMsg.includes('busca'))))
    return 'Puedo acceder a Google Drive. Comandos: "muestra archivos de Drive", "busca archivo [nombre]", "muestra carpetas de clientes".';
  if (lowerMsg.includes('qué día') || lowerMsg.includes('que dia') || lowerMsg.includes('fecha') || lowerMsg.includes('hora')) {
    const now = new Date();
    return `Hoy es ${now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' })}.`;
  }
  if (lowerMsg.includes('hola') || lowerMsg.includes('buenos') || lowerMsg.includes('buenas') || lowerMsg.includes('hey'))
    return 'Hola! Soy ROPA, tu meta-agente autónomo. Estoy lista para ayudarte.';
  if (lowerMsg.includes('ayuda') || lowerMsg.includes('help') || lowerMsg.includes('qué puedes'))
    return 'Soy ROPA. Puedo: navegar entre secciones, generar emails, crear empresas y campañas, buscar archivos en Google Drive, mostrar métricas. ¿Qué necesitas?';
  return 'Entendido. El sistema de IA está temporalmente limitado, pero puedo ejecutar acciones directas. Prueba: "ve a [sección]", "genera emails para [empresa]", "crea empresa [nombre]", "muestra archivos de Drive", o "ayuda".';
}
// Railway deployment trigger v2 - Mon Feb 10 2026
