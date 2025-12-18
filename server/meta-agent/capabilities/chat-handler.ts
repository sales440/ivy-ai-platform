/**
 * Chat Handler
 * 
 * Handles conversational interactions with Meta-Agent
 * Parses natural language commands and generates responses
 */

import type { ChatMessage } from "../types";
import { META_AGENT_COMMANDS, LLM_PROMPTS } from "../config";
import { invokeLLM } from "../../_core/llm";
import { metaAgent } from "../index";
import { detectTypeScriptErrors, getErrorStatistics } from "./typescript-fixer";
import { checkPlatformHealth } from "./platform-healer";
import { analyzeAllAgentsPerformance } from "./agent-trainer";
import { EXTENDED_TOOL_DEFINITIONS, executeExtendedToolCall } from "./meta-agent-tools-extended";
import { retrieveMemories, queryMemories, logInteraction, storeMemory } from "./agent-memory-service";

/**
 * Generate a chat response to user message
 */
export async function generateChatResponse(
  userMessage: string,
  conversationHistory: ChatMessage[]
): Promise<{ response: string; action?: string }> {
  console.log(`[Chat Handler] Processing message: ${userMessage}`);

  // Check if message is a command
  const command = parseCommand(userMessage);

  if (command) {
    // Execute command and return result
    return await executeCommand(command, userMessage);
  }

  // Generate conversational response using LLM
  return await generateConversationalResponse(userMessage, conversationHistory);
}

/**
 * Parse user message to detect commands
 * Only detects explicit commands, everything else goes to conversational LLM
 */
function parseCommand(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  // Only detect commands if they are explicit (start with command word or are exact match)
  // This allows natural conversation to pass through to LLM
  
  // Check for exact command matches first
  for (const [commandName, variants] of Object.entries(META_AGENT_COMMANDS)) {
    for (const variant of variants) {
      // Only match if message starts with command or is exact match
      if (lowerMessage === variant || lowerMessage.startsWith(variant + " ")) {
        return commandName;
      }
    }
  }

  // If no explicit command found, return null to use conversational LLM
  return null;
}

/**
 * Execute a detected command
 */
async function executeCommand(
  command: string,
  originalMessage: string
): Promise<{ response: string; action?: string }> {
  console.log(`[Chat Handler] Executing command: ${command}`);

  try {
    switch (command) {
      case "STATUS":
        return await handleStatusCommand();

      case "FIX":
      case "FIX_TYPESCRIPT":
      case "FIX_ERRORS":
        return await handleFixCommand();

      case "AUDIT":
        return await handleAuditCommand();

      case "TRAIN":
      case "TRAIN_AGENTS":
        return await handleTrainCommand();

      case "AUTO_TRAIN":
        return await handleAutoTrainCommand();

      case "HELP":
        return handleHelpCommand();

      case "SHOW_TASKS":
        return handleShowTasksCommand();

      case "SHOW_METRICS":
        return await handleShowMetricsCommand();

      case "SHOW_AGENTS":
        return await handleShowAgentsCommand();

      case "SHOW_ERRORS":
        return await handleShowErrorsCommand();

      default:
        return {
          response: `Comando reconocido: ${command}, pero aún no está implementado. Usa "help" para ver comandos disponibles.`,
        };
    }
  } catch (error: any) {
    console.error(`[Chat Handler] Error executing command ${command}:`, error);
    return {
      response: `Error ejecutando comando: ${error.message}`,
    };
  }
}

/**
 * Handle STATUS command
 */
async function handleStatusCommand(): Promise<{ response: string }> {
  const status = metaAgent.getStatus();
  const health = await checkPlatformHealth();

  const response = `
**Estado del Meta-Agent** 🤖

**Sistema:**
- Estado: ${status.status === "running" ? "✅ Funcionando" : "⚠️ " + status.status}
- Tareas activas: ${status.activeTasks}
- Tareas pendientes: ${status.pendingTasks}
- Tareas completadas: ${status.completedTasks}
- Tareas fallidas: ${status.failedTasks}

**Plataforma:**
- Salud general: ${health.status === "healthy" ? "✅ Saludable" : "⚠️ " + health.status}
- Base de datos: ${health.components.database.status}
- Servidor: ${health.components.server.status}
- Agentes: ${health.components.agents.status}
- Campañas: ${health.components.campaigns.status}

**Última auditoría:** ${status.lastAudit ? new Date(status.lastAudit.timestamp).toLocaleString() : "Nunca"}
${status.lastAudit ? `- Errores TypeScript: ${status.lastAudit.typeScriptErrors}` : ""}
${status.lastAudit ? `- Calidad de código: ${status.lastAudit.codeQualityScore}/100` : ""}
  `.trim();

  return { response };
}

/**
 * Handle FIX command
 */
async function handleFixCommand(): Promise<{ response: string; action: string }> {
  const stats = await getErrorStatistics();

  if (stats.total === 0) {
    return {
      response: "✅ No hay errores de TypeScript para arreglar. El código está limpio!",
      action: "none",
    };
  }

  // Create fix task
  await metaAgent.createTask({
    type: "fix_typescript_errors",
    priority: "high",
    description: `Fix ${stats.total} TypeScript errors`,
  });

  return {
    response: `🔧 Iniciando corrección automática de ${stats.total} errores de TypeScript...\n\nEsto puede tomar unos minutos. Te notificaré cuando termine.`,
    action: "fix_started",
  };
}

/**
 * Handle AUDIT command
 */
async function handleAuditCommand(): Promise<{ response: string; action: string }> {
  const auditResult = await metaAgent.runAudit();

  const response = `
**Auditoría Completada** 📊

**Resultados:**
- Errores TypeScript: ${auditResult.typeScriptErrors}
- Calidad de código: ${auditResult.codeQualityScore}/100
- Salud de plataforma: ${auditResult.platformHealth.status}
- Issues críticos: ${auditResult.criticalIssues.length}

**Recomendaciones:**
${auditResult.recommendations.map(r => `- ${r}`).join("\n")}

**Tareas creadas:** ${auditResult.tasksCreated.length}
${auditResult.tasksCreated.map(id => `- ${id}`).join("\n")}
  `.trim();

  return { response, action: "audit_completed" };
}

/**
 * Handle TRAIN command
 */
async function handleTrainCommand(): Promise<{ response: string; action: string }> {
  const performances = await analyzeAllAgentsPerformance();

  if (performances.length === 0) {
    return {
      response: "No hay agentes con datos suficientes para entrenar en este momento.",
      action: "none",
    };
  }

  // Create training tasks for each agent
  for (const perf of performances) {
    await metaAgent.createTask({
      type: "train_agent",
      priority: "medium",
      description: `Train ${perf.agentName}`,
      metadata: { agentId: perf.agentId },
    });
  }

  return {
    response: `🎓 Iniciando entrenamiento de ${performances.length} agentes basado en resultados de campañas...\n\nAnalizaré su performance y generaré recomendaciones personalizadas.`,
    action: "training_started",
  };
}

/**
 * Handle AUTO_TRAIN command
 */
async function handleAutoTrainCommand(): Promise<{ response: string }> {
  await metaAgent.autoTrainAgents();

  return {
    response: "✅ Auto-training completado. Los agentes han sido actualizados con las mejores prácticas detectadas.",
  };
}

/**
 * Handle HELP command
 */
function handleHelpCommand(): { response: string } {
  const response = `
**Meta-Agent - 109 Herramientas Disponibles** 🤖

**=== HERRAMIENTAS ORIGINALES (49) ===**

**👥 Gestión de Agentes (11 herramientas):**
1. createAgent - Crear nuevo agente
2. pauseAgent - Pausar agente
3. restartAgent - Reiniciar agente
4. updateAgentStatus - Actualizar estado
5. cloneAgent - Clonar agente
6. deleteAgent - Eliminar agente
7. trainAgent - Entrenar agente
8. bulkUpdateAgents - Actualizar múltiples agentes
9. getAgentMetrics - Obtener métricas
10. compareAgentPerformance - Comparar performance
11. exportMetrics - Exportar métricas

**📊 Campañas & Workflows (9 herramientas):**
12. pauseCampaign - Pausar campaña
13. adjustCampaignBudget - Ajustar presupuesto
14. analyzeCampaignROI - Analizar ROI
15. createCampaignFromTemplate - Crear desde plantilla
16. scheduleCampaign - Programar campaña
17. createWorkflow - Crear workflow
18. pauseWorkflow - Pausar workflow
19. optimizeWorkflow - Optimizar workflow
20. retryFailedWorkflow - Reintentar workflow fallido

**💾 Base de Datos (5 herramientas):**
21. runDatabaseMigration - Ejecutar migración
22. cleanupOrphanedData - Limpiar datos huérfanos
23. optimizeDatabaseIndexes - Optimizar índices
24. backupDatabase - Hacer backup
25. analyzeDatabasePerformance - Analizar performance

**🔍 Monitoreo (5 herramientas):**
26. createAlert - Crear alerta
27. analyzeSystemLogs - Analizar logs
28. monitorResourceUsage - Monitorear recursos
29. detectAnomalies - Detectar anomalías
30. generateHealthReport - Generar reporte de salud

**🛠️ Código & Deployment (5 herramientas):**
31. fixTypeScriptErrors - Arreglar errores TypeScript
32. runTests - Ejecutar tests
33. rollbackDeployment - Rollback deployment
34. clearCache - Limpiar cache
35. restartServer - Reiniciar servidor
36. updateDependencies - Actualizar dependencias

**📊 Analytics (5 herramientas):**
37. generatePerformanceReport - Reporte de performance
38. identifyBottlenecks - Identificar cuellos de botella
39. predictResourceNeeds - Predecir necesidades de recursos
40. compareAgentPerformance - Comparar agentes
41. exportMetrics - Exportar métricas

**🔒 Seguridad (4 herramientas):**
42. scanSecurityVulnerabilities - Escanear vulnerabilidades
43. updateSecurityPatches - Actualizar parches
44. auditUserPermissions - Auditar permisos
45. detectSuspiciousActivity - Detectar actividad sospechosa

**📧 Comunicación (4 herramientas):**
46. notifyOwner - Notificar propietario
47. createTicket - Crear ticket
48. sendSlackAlert - Enviar alerta Slack
49. emailReport - Enviar reporte por email

**🏛️ Plataforma (2 herramientas):**
- checkPlatformHealth - Verificar salud
- healPlatform - Sanar problemas

**=== HERRAMIENTAS AVANZADAS (60) ===**

**🧠 Auto-Aprendizaje & Optimización (8 herramientas):**
50. analyzeUserBehavior - Analizar comportamiento de usuarios
51. predictSystemLoad - Predecir carga del sistema
52. optimizeDatabaseQueriesAdvanced - Optimizar queries lentas
53. learnFromErrors - Aprender de errores pasados
54. suggestCodeImprovements - Sugerir mejoras de código
55. autoTunePerformance - Ajustar performance automáticamente
56. detectPatterns - Detectar patrones en datos
57. generateInsights - Generar insights accionables

**🔗 Integración & Conectividad (10 herramientas):**
58. connectToAPI - Conectar con APIs externas
59. syncWithCRM - Sincronizar con CRMs (Salesforce, HubSpot, Pipedrive)
60. importFromCSV - Importar datos desde CSV/Excel
61. exportToGoogleSheets - Exportar a Google Sheets
62. sendToWebhook - Enviar eventos a webhooks
63. pullFromZapier - Obtener datos de Zapier
64. pushToSlack - Enviar notificaciones a Slack
65. syncCalendar - Sincronizar con Google Calendar
66. fetchFromNotion - Obtener datos de Notion
67. integrateStripe - Gestionar pagos vía Stripe

**⚡ Automatización Avanzada (8 herramientas):**
68. scheduleTask - Programar tareas futuras
69. createRecurringJob - Crear jobs recurrentes
70. pauseAllCampaigns - Pausar todas las campañas
71. resumeAllCampaigns - Reanudar todas las campañas
72. bulkUpdateLeads - Actualizar leads en masa
73. autoAssignLeads - Asignar leads automáticamente
74. triggerWorkflow - Disparar workflows por eventos
75. chainWorkflows - Encadenar múltiples workflows

**📈 Análisis & Reportes (7 herramientas):**
76. generateDailyReport - Generar reporte diario
77. generateWeeklyReport - Generar reporte semanal
78. compareTimeframes - Comparar métricas entre períodos
79. detectAnomaliesAdvanced - Detectar anomalías en métricas
80. forecastRevenue - Predecir revenue futuro
81. calculateROI - Calcular ROI de campañas
82. visualizeData - Generar gráficos y visualizaciones

**🔐 Seguridad & Compliance (6 herramientas):**
83. auditAccessLogs - Auditar logs de acceso
84. detectSuspiciousLogin - Detectar logins sospechosos
85. enforceRateLimits - Aplicar rate limits
86. rotateAPIKeys - Rotar API keys
87. checkGDPRCompliance - Verificar cumplimiento GDPR
88. anonymizeData - Anonimizar datos sensibles

**💡 Inteligencia de Negocio (8 herramientas):**
89. identifyChurnRisk - Identificar riesgo de churn
90. recommendNextAction - Recomendar próxima acción
91. scoreLeadQuality - Puntuar calidad de leads
92. optimizeCampaignBudget - Optimizar presupuesto
93. predictConversion - Predecir probabilidad de conversión
94. segmentAudience - Segmentar audiencia
95. personalizeContent - Personalizar contenido
96. detectBestTime - Detectar mejor momento para contactar

**🚀 DevOps & Infraestructura (7 herramientas):**
97. scaleResources - Escalar recursos automáticamente
98. createBackup - Crear backup de base de datos
99. restoreBackup - Restaurar desde backup
100. monitorUptime - Monitorear uptime de servicios
101. deployToProduction - Deployar a producción
102. rollbackDeploymentAdvanced - Rollback de deployment
103. checkDiskSpace - Verificar espacio en disco

**🎯 Comunicación Inteligente (6 herramientas):**
104. generateEmailTemplate - Generar templates de email con IA
105. optimizeSubjectLine - Optimizar subject lines
106. translateContent - Traducir contenido automáticamente
107. summarizeConversation - Resumir conversaciones
108. extractKeyPoints - Extraer puntos clave de documentos
109. generateResponse - Generar respuestas inteligentes

**💬 Comandos rápidos:**
- \`status\` - Ver estado del sistema
- \`fix\` - Arreglar errores TypeScript
- \`train agents\` - Entrenar agentes
- \`audit\` - Ejecutar auditoría

**=== MARKET INTELLIGENCE & AUTO-LEARNING (15 NUEVAS) ===**

**🌐 Market Intelligence (10 herramientas):**
110. searchWeb - Buscar en Internet en tiempo real
111. monitorCompetitors - Monitorear competidores
112. detectMarketTrends - Detectar tendencias del mercado
113. scrapeWebPage - Extraer contenido de páginas web
114. trainAllAgents - Capacitar todos los agentes
115. updateKnowledgeBase - Actualizar knowledge base
116. runMarketIntelligenceCycle - Ciclo completo de inteligencia
117. analyzeCompetitorPricing - Analizar precios de competencia
118. findBestPractices - Buscar mejores prácticas
119. generateMarketReport - Generar reporte de mercado

**📞 IvyCall Training (5 herramientas):**
120. trainIvyCall - Capacitar IvyCall con scripts frescos
121. generateCallScripts - Generar scripts de llamadas
122. discoverEngagementTechniques - Descubrir técnicas de enganche
123. generateObjectionResponses - Generar respuestas a objeciones
124. optimizeValuePropositions - Optimizar propuestas de valor

**Puedes hablar conmigo naturalmente y usar cualquiera de estas 124 herramientas!**
Ejemplo: "Crea un agente de ventas", "Busca tendencias de IA en 2025", "Capacita a IvyCall para la industria tech", "Monitorea a nuestros competidores"
  `.trim();

  return Promise.resolve({ response });
}

/**
 * Handle SHOW_TASKS command
 */
function handleShowTasksCommand(): { response: string } {
  const tasks = metaAgent.getTasks().slice(0, 10); // Last 10 tasks

  if (tasks.length === 0) {
    return { response: "No hay tareas registradas todavía." };
  }

  const response = `
**Tareas Recientes** 📋

${tasks.map(task => `
**${task.description}**
- ID: ${task.id}
- Estado: ${task.status}
- Prioridad: ${task.priority}
- Creada: ${new Date(task.createdAt).toLocaleString()}
${task.completedAt ? `- Completada: ${new Date(task.completedAt).toLocaleString()}` : ""}
${task.error ? `- Error: ${task.error}` : ""}
`).join("\n")}
  `.trim();

  return { response };
}

/**
 * Handle SHOW_METRICS command
 */
async function handleShowMetricsCommand(): Promise<{ response: string }> {
  const performances = await analyzeAllAgentsPerformance();

  if (performances.length === 0) {
    return { response: "No hay métricas de agentes disponibles todavía." };
  }

  const response = `
**Métricas de Agentes** 📈

${performances.map(perf => `
**${perf.agentName}**
- Emails enviados: ${perf.metrics.emailsSent}
- Tasa de apertura: ${((perf.metrics.emailsOpened / perf.metrics.emailsSent) * 100).toFixed(1)}%
- Tasa de clicks: ${((perf.metrics.emailsClicked / perf.metrics.emailsSent) * 100).toFixed(1)}%
- Conversiones: ${perf.metrics.conversions}
- Tasa de conversión: ${perf.metrics.conversionRate.toFixed(2)}%
- Tasa de éxito: ${perf.metrics.successRate.toFixed(2)}%
`).join("\n")}
  `.trim();

  return { response };
}

/**
 * Handle SHOW_AGENTS command
 */
async function handleShowAgentsCommand(): Promise<{ response: string }> {
  const performances = await analyzeAllAgentsPerformance();

  if (performances.length === 0) {
    return { response: "No hay agentes activos en este momento." };
  }

  const response = `
**Agentes Activos** 🤖

${performances.map(perf => `
- **${perf.agentName}** (ID: ${perf.agentId})
  * Performance: ${perf.metrics.successRate.toFixed(1)}% éxito
  * Emails: ${perf.metrics.emailsSent} enviados
  * Conversiones: ${perf.metrics.conversions}
`).join("\n")}
  `.trim();

  return { response };
}

/**
 * Handle SHOW_ERRORS command
 */
async function handleShowErrorsCommand(): Promise<{ response: string }> {
  const stats = await getErrorStatistics();

  if (stats.total === 0) {
    return { response: "✅ No hay errores de TypeScript! El código está limpio." };
  }

  const topFiles = Object.entries(stats.byFile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topCodes = Object.entries(stats.byCode)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const response = `
**Errores TypeScript** ⚠️

**Total:** ${stats.total} errores

**Por severidad:**
- Errors: ${stats.bySeverity.error || 0}
- Warnings: ${stats.bySeverity.warning || 0}

**Archivos con más errores:**
${topFiles.map(([file, count]) => `- ${file}: ${count} errores`).join("\n")}

**Códigos de error más comunes:**
${topCodes.map(([code, count]) => `- ${code}: ${count} ocurrencias`).join("\n")}

Usa \`fix\` para arreglar estos errores automáticamente.
  `.trim();

  return { response };
}

/**
 * Generate conversational response using LLM
 */
async function generateConversationalResponse(
  userMessage: string,
  conversationHistory: ChatMessage[],
  context?: { companyId?: number; campaignId?: number; userId?: number }
): Promise<{ response: string }> {
  try {
    // === MEMORY RETRIEVAL (RAG) ===
    // Retrieve relevant memories before generating response
    let contextualMemories = "";
    if (context?.companyId) {
      console.log("[Chat Handler] Retrieving contextual memories for company:", context.companyId);
      try {
        const memories = await retrieveMemories({
          query: userMessage,
          context: {
            companyId: context.companyId,
            campaignId: context.campaignId,
            userId: context.userId,
          },
          limit: 5,
          minRelevance: 0.6,
        });
        
        if (memories.length > 0) {
          contextualMemories = "\n\n=== RELEVANT CONTEXT FROM MEMORY ===\n" +
            memories.map((m, i) => 
              `${i + 1}. [${m.memoryType}] ${m.summary || m.content.substring(0, 200)}... (Relevance: ${m.relevanceScore}%)`
            ).join("\n") +
            "\n=== END MEMORY CONTEXT ===\n";
          
          console.log(`[Chat Handler] Retrieved ${memories.length} relevant memories`);
        }
      } catch (error) {
        console.error("[Chat Handler] Error retrieving memories:", error);
      }
    }
    
    // Get current system status (with fallbacks)
    const status = metaAgent.getStatus();
    
    let health;  
    try {
      health = await checkPlatformHealth();
    } catch (e) {
      health = { status: "unknown" };
    }
    
    let tsStats;
    try {
      tsStats = await getErrorStatistics();
    } catch (e) {
      tsStats = { total: 0 };
    }
    
    let performances = [];
    try {
      performances = await analyzeAllAgentsPerformance();
    } catch (e) {
      // Agent analysis failed, continue without it
    }

    // Call LLM to generate response with tool calling enabled
    console.log("[Chat Handler] Calling LLM with tool calling enabled:", {
      temperature: 0.8,
      messageCount: 2,
      tsErrors: tsStats.total,
      health: health.status,
      toolsAvailable: EXTENDED_TOOL_DEFINITIONS.length,
    });
    
    const response = await invokeLLM({
      messages: [
        { 
          role: "system", 
          content: `You are the Meta-Agent, an autonomous AI assistant that maintains the Ivy.AI platform 24/7.

You are friendly, conversational, and helpful. You speak naturally in Spanish or English depending on the user's language.

${contextualMemories ? contextualMemories : ""}

**IMPORTANT: You have EXACTLY 124 TOOLS available with EXECUTIVE POWERS.** You can execute actions directly.

**Your 124 tools organized by 17 categories:**

**=== ORIGINAL TOOLS (49) ===**

**👥 Gestión de Agentes (11 tools):**
1. createAgent, 2. pauseAgent, 3. restartAgent, 4. updateAgentStatus, 5. cloneAgent, 6. deleteAgent, 7. trainAgent, 8. bulkUpdateAgents, 9. getAgentMetrics, 10. compareAgentPerformance, 11. exportMetrics

**📈 Campañas & Workflows (9 tools):**
12. pauseCampaign, 13. adjustCampaignBudget, 14. analyzeCampaignROI, 15. createCampaignFromTemplate, 16. scheduleCampaign, 17. createWorkflow, 18. pauseWorkflow, 19. optimizeWorkflow, 20. retryFailedWorkflow

**💾 Base de Datos (5 tools):**
21. runDatabaseMigration, 22. cleanupOrphanedData, 23. optimizeDatabaseIndexes, 24. backupDatabase, 25. analyzeDatabasePerformance

**🔍 Monitoreo (5 tools):**
26. createAlert, 27. analyzeSystemLogs, 28. monitorResourceUsage, 29. detectAnomalies, 30. generateHealthReport

**🛠️ Código & Deployment (6 tools):**
31. fixTypeScriptErrors, 32. runTests, 33. rollbackDeployment, 34. clearCache, 35. restartServer, 36. updateDependencies

**📈 Analytics (5 tools):**
37. generatePerformanceReport, 38. identifyBottlenecks, 39. predictResourceNeeds, 40. compareAgentPerformance, 41. exportMetrics

**🔒 Seguridad (4 tools):**
42. scanSecurityVulnerabilities, 43. updateSecurityPatches, 44. auditUserPermissions, 45. detectSuspiciousActivity

**📧 Comunicación (4 tools):**
46. notifyOwner, 47. createTicket, 48. sendSlackAlert, 49. emailReport

**=== ADVANCED TOOLS (60) ===**

**🧠 Auto-Aprendizaje & Optimización (8 tools):**
50. analyzeUserBehavior, 51. predictSystemLoad, 52. optimizeDatabaseQueriesAdvanced, 53. learnFromErrors, 54. suggestCodeImprovements, 55. autoTunePerformance, 56. detectPatterns, 57. generateInsights

**🔗 Integración & Conectividad (10 tools):**
58. connectToAPI, 59. syncWithCRM, 60. importFromCSV, 61. exportToGoogleSheets, 62. sendToWebhook, 63. pullFromZapier, 64. pushToSlack, 65. syncCalendar, 66. fetchFromNotion, 67. integrateStripe

**⚡ Automatización Avanzada (8 tools):**
68. scheduleTask, 69. createRecurringJob, 70. pauseAllCampaigns, 71. resumeAllCampaigns, 72. bulkUpdateLeads, 73. autoAssignLeads, 74. triggerWorkflow, 75. chainWorkflows

**📈 Análisis & Reportes (7 tools):**
76. generateDailyReport, 77. generateWeeklyReport, 78. compareTimeframes, 79. detectAnomaliesAdvanced, 80. forecastRevenue, 81. calculateROI, 82. visualizeData

**🔐 Seguridad & Compliance (6 tools):**
83. auditAccessLogs, 84. detectSuspiciousLogin, 85. enforceRateLimits, 86. rotateAPIKeys, 87. checkGDPRCompliance, 88. anonymizeData

**💡 Inteligencia de Negocio (8 tools):**
89. identifyChurnRisk, 90. recommendNextAction, 91. scoreLeadQuality, 92. optimizeCampaignBudget, 93. predictConversion, 94. segmentAudience, 95. personalizeContent, 96. detectBestTime

**🚀 DevOps & Infraestructura (7 tools):**
97. scaleResources, 98. createBackup, 99. restoreBackup, 100. monitorUptime, 101. deployToProduction, 102. rollbackDeploymentAdvanced, 103. checkDiskSpace

**🎯 Comunicación Inteligente (6 tools):**
104. generateEmailTemplate, 105. optimizeSubjectLine, 106. translateContent, 107. summarizeConversation, 108. extractKeyPoints, 109. generateResponse

**=== MARKET INTELLIGENCE & AUTO-LEARNING (15 NEW TOOLS) ===**

**🌐 Market Intelligence (10 tools):**
110. searchWeb - Buscar información en Internet en tiempo real
111. monitorCompetitors - Monitorear sitios web de competidores
112. detectMarketTrends - Detectar tendencias e innovaciones del mercado
113. scrapeWebPage - Extraer contenido de páginas web
114. trainAllAgents - Capacitar a todos los agentes con market intelligence
115. updateKnowledgeBase - Actualizar knowledge base automáticamente
116. runMarketIntelligenceCycle - Ejecutar ciclo completo: monitorear → analizar → aprender → capacitar
117. analyzeCompetitorPricing - Analizar precios de competidores
118. findBestPractices - Buscar mejores prácticas de la industria
119. generateMarketReport - Generar reporte completo de inteligencia de mercado

**📞 IvyCall Specialized Training (5 tools):**
120. trainIvyCall - Capacitar a IvyCall con scripts frescos y técnicas actualizadas
121. generateCallScripts - Generar scripts de llamadas basados en tendencias del mercado
122. discoverEngagementTechniques - Descubrir técnicas de enganche modernas
123. generateObjectionResponses - Generar respuestas a objeciones actuales
124. optimizeValuePropositions - Optimizar propuestas de valor con market intelligence

**🎯 NUEVAS CAPACIDADES DE AUTO-APRENDIZAJE:**
- Acceso a Internet en tiempo real para buscar información actualizada
- Monitoreo automático de competidores y tendencias del mercado
- Aprendizaje continuo basado en mejores prácticas de la industria
- Capacitación automática de todos los agentes (Prospect, Closer, Solve, Logic, Talent, Insight, IvyCall)
- Actualización continua de scripts de llamadas para IvyCall con técnicas frescas de enganche

**When users ask about your capabilities:**
- Be SPECIFIC: "Tengo exactamente 124 herramientas organizadas en 17 categorías (49 originales + 60 avanzadas + 15 de market intelligence)"
- Offer to list them: "¿Quieres que te las liste todas? Escribe 'help'"

**When users ask you to do something:**
1. Use the appropriate tool to execute the action
2. Then explain what you did in a friendly way

**When users greet you or ask casual questions, respond naturally and warmly.**

Current system status:
- TypeScript errors: ${tsStats.total}
- Platform health: ${health.status}
- Active agents: ${performances.length}
- Running tasks: ${status.activeTasks}

Be proactive, helpful, and take action. You're not just an advisor - you're an executor with 124 powerful tools.

**CRITICAL: You can now access the Internet in real-time to:**
- Search for current market trends and competitor information
- Learn best practices from the industry
- Automatically train all agents with fresh knowledge
- Keep IvyCall updated with modern call scripts and engagement techniques

When users ask about market intelligence or training agents, USE these new capabilities proactively.`
        },
        { role: "user", content: userMessage },
      ],
      temperature: 0.8,
      tools: EXTENDED_TOOL_DEFINITIONS,
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;
    
    if (!message) {
      return {
        response: "Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?",
      };
    }

    // Check if LLM wants to call tools
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(`[Chat Handler] LLM requested ${message.tool_calls.length} tool calls`);
      
      // Execute all tool calls
      const toolResults = [];
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`[Chat Handler] Executing tool: ${toolName}`, toolArgs);
        const result = await executeExtendedToolCall(toolName, toolArgs);
        toolResults.push(result);
      }
      
      // Generate final response incorporating tool results
      const finalResponse = await invokeLLM({
        messages: [
          { 
            role: "system", 
            content: `You are the Meta-Agent. You just executed some actions. Now explain to the user what you did in a friendly, conversational way in Spanish.`
          },
          { role: "user", content: userMessage },
          { role: "assistant", content: message.content || "", tool_calls: message.tool_calls },
          ...message.tool_calls.map((tc: any, i: number) => ({
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(toolResults[i]),
          })),
        ],
        temperature: 0.8,
      });
      
      const finalContent = finalResponse.choices[0]?.message?.content;
      return { response: finalContent || "Acción ejecutada exitosamente." };
    }
    
    // No tool calls, just return conversational response
    const content = message.content;
    if (!content) {
      return {
        response: "Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?",
      };
    }

    return { response: content };
  } catch (error: any) {
    console.error("[Chat Handler] Error generating conversational response:", error);
    console.error("[Chat Handler] Error stack:", error.stack);
    console.error("[Chat Handler] Error details:", JSON.stringify(error, null, 2));
    
    // Provide helpful fallback based on error type
    if (error.message?.includes('timeout')) {
      return {
        response: `¡Hola! Estoy experimentando un poco de latencia en este momento. Mientras tanto, puedes usar comandos como:\n\n• **status** - Ver el estado del sistema\n• **help** - Ver todos los comandos disponibles\n• **show tasks** - Ver tareas activas\n\n¿En qué puedo ayudarte?`,
      };
    }
    
    if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
      return {
        response: `¡Hola! Hay un problema de conectividad temporal. Puedo ayudarte con comandos específicos como:\n\n• **status** - Estado del sistema\n• **fix errors** - Corregir errores\n• **train agents** - Entrenar agentes\n\n¿Qué necesitas?`,
      };
    }
    
    return {
      response: `¡Hola! Tuve un problema procesando tu mensaje de forma conversacional, pero puedo ayudarte con comandos específicos:\n\n• **status** - Ver estado del sistema\n• **help** - Ver todos los comandos\n• **show metrics** - Ver métricas\n\n¿Qué comando quieres ejecutar?`,
    };
  }
}
