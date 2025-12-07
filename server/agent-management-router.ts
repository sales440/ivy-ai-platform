/**
 * Agent Management Router
 * 
 * CRUD operations for managing Ivy.AI agents
 */

import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { agents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const agentManagementRouter = router({
  /**
   * List all agents
   */
  listAgents: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        status: z.enum(['idle', 'active', 'training', 'error']).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      let query = db.select().from(agents);

      if (input.companyId) {
        query = query.where(eq(agents.companyId, input.companyId)) as any;
      }

      if (input.status) {
        query = query.where(eq(agents.status, input.status)) as any;
      }

      const allAgents = await query;

      return { agents: allAgents };
    }),

  /**
   * Get agent by ID
   */
  getAgent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!agent) {
        throw new Error('Agent not found');
      }

      return { agent };
    }),

  /**
   * Create new agent
   */
  createAgent: protectedProcedure
    .input(
      z.object({
        companyId: z.number().optional(),
        agentId: z.string(),
        name: z.string().min(1).max(100),
        type: z.enum(['prospect', 'closer', 'solve', 'logic', 'talent', 'insight']),
        department: z.enum(['sales', 'marketing', 'customer_service', 'operations', 'hr', 'strategy']),
        capabilities: z.array(z.string()),
        configuration: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const [newAgent] = await db.insert(agents).values({
        companyId: input.companyId,
        agentId: input.agentId,
        name: input.name,
        type: input.type,
        department: input.department,
        status: 'idle',
        capabilities: input.capabilities,
        kpis: {},
        configuration: input.configuration || {},
      });

      return {
        success: true,
        agentId: newAgent.insertId,
      };
    }),

  /**
   * Update agent
   */
  updateAgent: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(100).optional(),
        type: z.enum(['prospect', 'closer', 'solve', 'logic', 'talent', 'insight']).optional(),
        department: z.enum(['sales', 'marketing', 'customer_service', 'operations', 'hr', 'strategy']).optional(),
        status: z.enum(['idle', 'active', 'training', 'error']).optional(),
        capabilities: z.array(z.string()).optional(),
        configuration: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.type) updateData.type = input.type;
      if (input.department) updateData.department = input.department;
      if (input.status) updateData.status = input.status;
      if (input.capabilities) updateData.capabilities = input.capabilities;
      if (input.configuration) updateData.configuration = input.configuration;

      await db
        .update(agents)
        .set(updateData)
        .where(eq(agents.id, input.id));

      return { success: true };
    }),

  /**
   * Toggle agent status (activate/pause)
   */
  toggleAgentStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get current status
      const [agent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Toggle status
      const newStatus = agent.status === 'active' ? 'idle' : 'active';

      await db
        .update(agents)
        .set({ status: newStatus })
        .where(eq(agents.id, input.id));

      return {
        success: true,
        newStatus,
      };
    }),

  /**
   * Delete agent
   */
  deleteAgent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      await db
        .delete(agents)
        .where(eq(agents.id, input.id));

      return { success: true };
    }),

  /**
   * Clone agent (create copy with modified name)
   */
  cloneAgent: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        newName: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Get original agent
      const [originalAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id))
        .limit(1);

      if (!originalAgent) {
        throw new Error('Agent not found');
      }

      // Create clone
      const [clonedAgent] = await db.insert(agents).values({
        companyId: originalAgent.companyId,
        agentId: `${originalAgent.agentId}-clone-${Date.now()}`,
        name: input.newName,
        type: originalAgent.type,
        department: originalAgent.department,
        status: 'idle',
        capabilities: originalAgent.capabilities,
        kpis: {},
        configuration: originalAgent.configuration,
      });

      return {
        success: true,
        clonedAgentId: clonedAgent.insertId,
      };
    }),
});
