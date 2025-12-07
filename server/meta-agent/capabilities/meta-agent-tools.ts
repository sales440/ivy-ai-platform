/**
 * Meta-Agent Tools
 * 
 * Executable functions that the Meta-Agent can invoke to perform actions
 * These tools enable the Meta-Agent to execute tasks automatically instead of just giving instructions
 */

import { getDb } from "../../db";
import { agents } from "../../../drizzle/schema";
import { detectTypeScriptErrors, fixTypeScriptErrors } from "./typescript-fixer";
import { checkPlatformHealth, healPlatform } from "./platform-healer";
import { analyzeAllAgentsPerformance, trainAgent } from "./agent-trainer";
import { eq } from "drizzle-orm";

/**
 * Tool: Create a new agent
 */
export async function createAgentTool(params: {
  name: string;
  type: 'prospect' | 'closer' | 'solve' | 'logic' | 'talent' | 'insight';
  department: 'sales' | 'marketing' | 'customer_service' | 'operations' | 'hr' | 'strategy';
}): Promise<{ success: boolean; agentId?: string; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Generate agent ID
    const agentId = `${params.type}-${Date.now()}`;

    // Define capabilities based on agent type
    const capabilitiesMap: Record<string, string[]> = {
      prospect: ['lead_generation', 'email_outreach', 'lead_qualification'],
      closer: ['deal_negotiation', 'proposal_generation', 'objection_handling'],
      solve: ['ticket_resolution', 'knowledge_base_search', 'escalation'],
      logic: ['demand_prediction', 'inventory_optimization', 'purchase_orders'],
      talent: ['cv_screening', 'candidate_matching', 'cultural_fit'],
      insight: ['competitive_analysis', 'market_opportunities', 'executive_reports'],
    };

    // Create agent in database
    const result = await db.insert(agents).values({
      agentId,
      name: params.name,
      type: params.type,
      department: params.department,
      status: 'idle',
      capabilities: JSON.stringify(capabilitiesMap[params.type] || []),
      kpis: JSON.stringify({}),
      configuration: JSON.stringify({
        autoStart: false,
        maxConcurrentTasks: 5,
      }),
    });

    return {
      success: true,
      agentId,
      message: `✅ Agente creado exitosamente: ${params.name} (${params.type}) en departamento ${params.department}`,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error creating agent:", error);
    return {
      success: false,
      message: `❌ Error creando agente: ${error.message}`,
    };
  }
}

/**
 * Tool: Fix TypeScript errors
 */
export async function fixTypeScriptErrorsTool(): Promise<{ success: boolean; message: string }> {
  try {
    const errors = await detectTypeScriptErrors();
    
    if (errors.length === 0) {
      return {
        success: true,
        message: "✅ No hay errores de TypeScript para corregir",
      };
    }

    const result = await fixTypeScriptErrors();
    
    return {
      success: true,
      message: `✅ Corrección de errores TypeScript iniciada. Se encontraron ${errors.length} errores.`,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error fixing TypeScript errors:", error);
    return {
      success: false,
      message: `❌ Error corrigiendo errores TypeScript: ${error.message}`,
    };
  }
}

/**
 * Tool: Check platform health
 */
export async function checkPlatformHealthTool(): Promise<{ 
  success: boolean; 
  health: string;
  message: string;
  details?: any;
}> {
  try {
    const health = await checkPlatformHealth();
    
    return {
      success: true,
      health: health.status,
      message: `Estado de la plataforma: ${health.status}`,
      details: health,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error checking platform health:", error);
    return {
      success: false,
      health: "unknown",
      message: `❌ Error verificando salud de la plataforma: ${error.message}`,
    };
  }
}

/**
 * Tool: Heal platform issues
 */
export async function healPlatformTool(): Promise<{ success: boolean; message: string }> {
  try {
    const result = await healPlatform();
    
    return {
      success: true,
      message: `✅ Sanación de plataforma completada. ${result.issuesFixed} problemas resueltos.`,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error healing platform:", error);
    return {
      success: false,
      message: `❌ Error sanando plataforma: ${error.message}`,
    };
  }
}

/**
 * Tool: Update agent status
 */
export async function updateAgentStatusTool(params: {
  agentId: string;
  status: 'idle' | 'active' | 'training' | 'error';
}): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    await db
      .update(agents)
      .set({ status: params.status })
      .where(eq(agents.agentId, params.agentId));

    return {
      success: true,
      message: `✅ Estado del agente ${params.agentId} actualizado a: ${params.status}`,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error updating agent status:", error);
    return {
      success: false,
      message: `❌ Error actualizando estado del agente: ${error.message}`,
    };
  }
}

/**
 * Tool: Train an agent
 */
export async function trainAgentTool(params: {
  agentId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const result = await trainAgent(params.agentId);
    
    return {
      success: true,
      message: `✅ Entrenamiento del agente ${params.agentId} completado. Performance mejorada.`,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error training agent:", error);
    return {
      success: false,
      message: `❌ Error entrenando agente: ${error.message}`,
    };
  }
}

/**
 * Tool: Get agent performance metrics
 */
export async function getAgentMetricsTool(): Promise<{ 
  success: boolean; 
  message: string;
  metrics?: any[];
}> {
  try {
    const performances = await analyzeAllAgentsPerformance();
    
    if (performances.length === 0) {
      return {
        success: true,
        message: "No hay agentes con métricas disponibles todavía.",
        metrics: [],
      };
    }

    return {
      success: true,
      message: `Se encontraron métricas de ${performances.length} agentes.`,
      metrics: performances,
    };
  } catch (error: any) {
    console.error("[Meta-Agent Tools] Error getting agent metrics:", error);
    return {
      success: false,
      message: `❌ Error obteniendo métricas de agentes: ${error.message}`,
    };
  }
}

/**
 * Tool definitions for OpenAI function calling
 */
export const META_AGENT_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "createAgent",
      description: "Crea un nuevo agente en la plataforma Ivy.AI. Usa esto cuando el usuario pida crear un agente.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre del agente (ej: 'Ivy-Prospect-FAGOR')",
          },
          type: {
            type: "string",
            enum: ["prospect", "closer", "solve", "logic", "talent", "insight"],
            description: "Tipo de agente: prospect (prospección), closer (ventas), solve (soporte), logic (operaciones), talent (RRHH), insight (estrategia)",
          },
          department: {
            type: "string",
            enum: ["sales", "marketing", "customer_service", "operations", "hr", "strategy"],
            description: "Departamento al que pertenece el agente",
          },
        },
        required: ["name", "type", "department"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "fixTypeScriptErrors",
      description: "Corrige errores de TypeScript en el código automáticamente. Usa esto cuando el usuario pida arreglar errores o cuando detectes problemas de código.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "checkPlatformHealth",
      description: "Verifica el estado de salud de la plataforma (base de datos, servidor, agentes, campañas). Usa esto cuando el usuario pregunte sobre el estado del sistema.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "healPlatform",
      description: "Intenta sanar problemas detectados en la plataforma automáticamente. Usa esto cuando se detecten problemas de salud.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateAgentStatus",
      description: "Actualiza el estado de un agente (idle, active, training, error). Usa esto cuando el usuario pida cambiar el estado de un agente.",
      parameters: {
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "ID del agente a actualizar",
          },
          status: {
            type: "string",
            enum: ["idle", "active", "training", "error"],
            description: "Nuevo estado del agente",
          },
        },
        required: ["agentId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "trainAgent",
      description: "Entrena un agente específico para mejorar su performance. Usa esto cuando el usuario pida entrenar un agente.",
      parameters: {
        type: "object",
        properties: {
          agentId: {
            type: "string",
            description: "ID del agente a entrenar",
          },
        },
        required: ["agentId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getAgentMetrics",
      description: "Obtiene métricas de performance de todos los agentes. Usa esto cuando el usuario pregunte sobre el rendimiento de los agentes.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

/**
 * Execute a tool call from OpenAI
 */
export async function executeToolCall(
  toolName: string,
  toolArgs: any
): Promise<any> {
  console.log(`[Meta-Agent Tools] Executing tool: ${toolName}`, toolArgs);

  switch (toolName) {
    case "createAgent":
      return await createAgentTool(toolArgs);
    
    case "fixTypeScriptErrors":
      return await fixTypeScriptErrorsTool();
    
    case "checkPlatformHealth":
      return await checkPlatformHealthTool();
    
    case "healPlatform":
      return await healPlatformTool();
    
    case "updateAgentStatus":
      return await updateAgentStatusTool(toolArgs);
    
    case "trainAgent":
      return await trainAgentTool(toolArgs);
    
    case "getAgentMetrics":
      return await getAgentMetricsTool();
    
    default:
      return {
        success: false,
        message: `Tool not found: ${toolName}`,
      };
  }
}
