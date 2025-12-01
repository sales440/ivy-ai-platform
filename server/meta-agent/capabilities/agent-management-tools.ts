/**
 * Agent Management Tools
 * 
 * Advanced tools for managing AI agents
 */

import { getDb } from "../../db";
import { agents } from "../../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

/**
 * Pause an agent
 */
export async function pauseAgentTool(params: {
  agentId: string;
  reason?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Update agent status to idle
    await db
      .update(agents)
      .set({ 
        status: 'idle',
        configuration: JSON.stringify({ paused: true, pauseReason: params.reason || 'Manual pause' })
      })
      .where(eq(agents.agentId, params.agentId));

    return {
      success: true,
      message: `✅ Agente ${params.agentId} pausado${params.reason ? `: ${params.reason}` : ''}`,
    };
  } catch (error: any) {
    console.error("[Agent Management] Pause agent error:", error);
    return {
      success: false,
      message: `❌ Error pausando agente: ${error.message}`,
    };
  }
}

/**
 * Restart an agent
 */
export async function restartAgentTool(params: {
  agentId: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Get current agent
    const result = await db
      .select()
      .from(agents)
      .where(eq(agents.agentId, params.agentId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: `❌ Agente ${params.agentId} no encontrado`,
      };
    }

    // Reset agent to idle, clear error state
    await db
      .update(agents)
      .set({ 
        status: 'idle',
        configuration: JSON.stringify({ ...JSON.parse(result[0].configuration || '{}'), paused: false })
      })
      .where(eq(agents.agentId, params.agentId));

    return {
      success: true,
      message: `✅ Agente ${params.agentId} reiniciado exitosamente`,
    };
  } catch (error: any) {
    console.error("[Agent Management] Restart agent error:", error);
    return {
      success: false,
      message: `❌ Error reiniciando agente: ${error.message}`,
    };
  }
}

/**
 * Clone an agent configuration
 */
export async function cloneAgentTool(params: {
  sourceAgentId: string;
  newName: string;
}): Promise<{ success: boolean; message: string; newAgentId?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Get source agent
    const result = await db
      .select()
      .from(agents)
      .where(eq(agents.agentId, params.sourceAgentId))
      .limit(1);

    if (result.length === 0) {
      return {
        success: false,
        message: `❌ Agente fuente ${params.sourceAgentId} no encontrado`,
      };
    }

    const sourceAgent = result[0];
    const newAgentId = `${sourceAgent.type}-${Date.now()}`;

    // Create new agent with same configuration
    await db.insert(agents).values({
      agentId: newAgentId,
      name: params.newName,
      type: sourceAgent.type,
      department: sourceAgent.department,
      status: 'idle',
      capabilities: sourceAgent.capabilities,
      kpis: JSON.stringify({}), // Reset KPIs
      configuration: sourceAgent.configuration,
    });

    return {
      success: true,
      message: `✅ Agente clonado: ${params.newName} (${newAgentId})`,
      newAgentId,
    };
  } catch (error: any) {
    console.error("[Agent Management] Clone agent error:", error);
    return {
      success: false,
      message: `❌ Error clonando agente: ${error.message}`,
    };
  }
}

/**
 * Delete an agent
 */
export async function deleteAgentTool(params: {
  agentId: string;
  confirm?: boolean;
}): Promise<{ success: boolean; message: string }> {
  try {
    if (!params.confirm) {
      return {
        success: false,
        message: "⚠️ Confirmación requerida para eliminar agente. Usa confirm: true",
      };
    }

    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Delete agent
    const result = await db
      .delete(agents)
      .where(eq(agents.agentId, params.agentId));

    return {
      success: true,
      message: `✅ Agente ${params.agentId} eliminado`,
    };
  } catch (error: any) {
    console.error("[Agent Management] Delete agent error:", error);
    return {
      success: false,
      message: `❌ Error eliminando agente: ${error.message}`,
    };
  }
}

/**
 * Bulk update agents
 */
export async function bulkUpdateAgentsTool(params: {
  agentIds: string[];
  updates: {
    status?: 'idle' | 'active' | 'training' | 'error';
    department?: string;
  };
}): Promise<{ success: boolean; message: string; updatedCount?: number }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    if (params.agentIds.length === 0) {
      return {
        success: false,
        message: "❌ No se especificaron agentes para actualizar",
      };
    }

    // Build update object
    const updateData: any = {};
    if (params.updates.status) updateData.status = params.updates.status;
    if (params.updates.department) updateData.department = params.updates.department;

    // Update agents
    await db
      .update(agents)
      .set(updateData)
      .where(inArray(agents.agentId, params.agentIds));

    return {
      success: true,
      message: `✅ ${params.agentIds.length} agentes actualizados`,
      updatedCount: params.agentIds.length,
    };
  } catch (error: any) {
    console.error("[Agent Management] Bulk update error:", error);
    return {
      success: false,
      message: `❌ Error actualizando agentes: ${error.message}`,
    };
  }
}
