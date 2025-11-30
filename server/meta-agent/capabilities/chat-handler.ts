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
 */
function parseCommand(message: string): string | null {
  const lowerMessage = message.toLowerCase().trim();

  // Check each command category
  for (const [commandName, variants] of Object.entries(META_AGENT_COMMANDS)) {
    for (const variant of variants) {
      if (lowerMessage.includes(variant)) {
        return commandName;
      }
    }
  }

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
function handleHelpCommand(): Promise<{ response: string }> {
  const response = `
**Comandos del Meta-Agent** 🤖

**Estado y Monitoreo:**
- \`status\` - Ver estado del sistema
- \`audit\` - Ejecutar auditoría completa
- \`show tasks\` - Ver tareas activas
- \`show metrics\` - Ver métricas de performance
- \`show agents\` - Ver estado de agentes
- \`show errors\` - Ver errores TypeScript

**Acciones:**
- \`fix\` - Arreglar errores TypeScript automáticamente
- \`train agents\` - Entrenar todos los agentes
- \`auto train\` - Activar auto-training continuo
- \`heal\` - Sanar problemas de plataforma

**Otros:**
- \`help\` - Mostrar esta ayuda

También puedes hablar conmigo naturalmente. Entiendo español e inglés!
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
  conversationHistory: ChatMessage[]
): Promise<{ response: string }> {
  // Get current system status
  const status = metaAgent.getStatus();
  const health = await checkPlatformHealth();
  const tsStats = await getErrorStatistics();
  const performances = await analyzeAllAgentsPerformance();

  // Build conversation history string
  const historyString = conversationHistory
    .slice(-5) // Last 5 messages
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

  // Prepare prompt
  const prompt = LLM_PROMPTS.CHAT_RESPONSE
    .replace("{{conversationHistory}}", historyString)
    .replace("{{userMessage}}", userMessage)
    .replace("{{tsErrors}}", tsStats.total.toString())
    .replace("{{platformHealth}}", health.status)
    .replace("{{activeAgents}}", performances.length.toString())
    .replace("{{runningTasks}}", status.activeTasks.toString());

  try {
    // Call LLM to generate response
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are the Meta-Agent, an autonomous AI system." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      return {
        response: "Lo siento, no pude procesar tu mensaje. ¿Podrías reformularlo?",
      };
    }

    return { response: content };
  } catch (error: any) {
    console.error("[Chat Handler] Error generating conversational response:", error);
    return {
      response: "Disculpa, tuve un problema procesando tu mensaje. Intenta usar un comando específico como 'status' o 'help'.",
    };
  }
}
