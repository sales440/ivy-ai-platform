import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { leads, users, notifications } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Lead Assignment System
 * Automatically assigns qualified leads to available agents based on:
 * - Current workload (number of active leads)
 * - Agent availability status
 * - Lead score and priority
 */

/**
 * Calculate agent workload score (lower is better)
 */
async function calculateAgentWorkload(db: any, agentId: number): Promise<number> {
  const activeLeads = await db
    .select({ count: sql<number>`count(*)` })
    .from(leads)
    .where(
      and(
        eq(leads.assignedTo, agentId),
        sql`${leads.status} IN ('new', 'contacted', 'qualified')`
      )
    );

  return Number(activeLeads[0]?.count || 0);
}

/**
 * Find best available agent for lead assignment
 */
async function findBestAgent(db: any, leadScore: number): Promise<number | null> {
  // Get all users with role 'admin' or 'user' (potential agents)
  const availableAgents = await db
    .select()
    .from(users)
    .where(sql`${users.role} IN ('admin', 'user')`);

  if (availableAgents.length === 0) return null;

  // Calculate workload for each agent
  const agentWorkloads = await Promise.all(
    availableAgents.map(async (agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      workload: await calculateAgentWorkload(db, agent.id),
    }))
  );

  // Sort by workload (ascending) - assign to agent with least workload
  agentWorkloads.sort((a, b) => a.workload - b.workload);

  return agentWorkloads[0].agentId;
}

/**
 * Auto-assign lead to best available agent
 */
export async function autoAssignLead(leadId: number, leadScore: number): Promise<{
  success: boolean;
  assignedTo?: number;
  agentName?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false };

  try {
    // Find best agent
    const bestAgentId = await findBestAgent(db, leadScore);
    if (!bestAgentId) {
      console.warn(`[Lead Assignment] No available agents for lead ${leadId}`);
      return { success: false };
    }

    // Get agent details
    const agent = await db
      .select()
      .from(users)
      .where(eq(users.id, bestAgentId))
      .limit(1);

    if (agent.length === 0) return { success: false };

    // Assign lead
    await db
      .update(leads)
      .set({
        assignedTo: bestAgentId,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    // Get lead details for notification
    const leadDetails = await db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (leadDetails.length > 0) {
      const lead = leadDetails[0];

      // Create notification for assigned agent
      await db.insert(notifications).values({
        userId: bestAgentId,
        title: `New Lead Assigned: ${lead.name}`,
        message: `You've been assigned a ${leadScore >= 80 ? 'high-priority' : 'qualified'} lead from ${lead.company || 'Unknown Company'}. Score: ${leadScore}`,
        type: leadScore >= 80 ? "success" : "info",
        category: "lead",
        relatedId: lead.leadId,
        isRead: false,
      });

      // If high-priority lead (score >= 80), also notify owner
      if (leadScore >= 80) {
        await notifyOwner({
          title: `🔥 High-Priority Lead Assigned`,
          content: `Lead "${lead.name}" from ${lead.company || 'Unknown'} (Score: ${leadScore}) has been assigned to ${agent[0].name}. Immediate follow-up recommended.`,
        });
      }
    }

    console.log(`[Lead Assignment] Lead ${leadId} assigned to agent ${agent[0].name} (ID: ${bestAgentId})`);

    return {
      success: true,
      assignedTo: bestAgentId,
      agentName: agent[0].name || undefined,
    };
  } catch (error) {
    console.error(`[Lead Assignment] Error assigning lead ${leadId}:`, error);
    return { success: false };
  }
}

export const leadAssignmentRouter = router({
  /**
   * Get agent workload statistics
   */
  getAgentWorkloads: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const agents = await db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('admin', 'user')`);

    const workloads = await Promise.all(
      agents.map(async (agent) => {
        const workload = await calculateAgentWorkload(db, agent.id);
        
        // Get qualified leads count
        const qualifiedLeads = await db
          .select({ count: sql<number>`count(*)` })
          .from(leads)
          .where(
            and(
              eq(leads.assignedTo, agent.id),
              eq(leads.status, "qualified")
            )
          );

        return {
          agentId: agent.id,
          agentName: agent.name || "Unknown",
          agentEmail: agent.email,
          totalLeads: workload,
          qualifiedLeads: Number(qualifiedLeads[0]?.count || 0),
          capacity: Math.max(0, 20 - workload), // Assume max capacity of 20 leads per agent
        };
      })
    );

    return workloads.sort((a, b) => b.totalLeads - a.totalLeads);
  }),

  /**
   * Manually assign lead to specific agent
   */
  assignLead: protectedProcedure
    .input(
      z.object({
        leadId: z.number(),
        agentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update lead assignment
      await db
        .update(leads)
        .set({
          assignedTo: input.agentId,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, input.leadId));

      // Get lead and agent details
      const [lead] = await db
        .select()
        .from(leads)
        .where(eq(leads.id, input.leadId))
        .limit(1);

      const [agent] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.agentId))
        .limit(1);

      // Create notification
      if (lead && agent) {
        await db.insert(notifications).values({
          userId: input.agentId,
          title: `New Lead Assigned: ${lead.name}`,
          message: `You've been manually assigned a lead from ${lead.company || 'Unknown Company'}. Score: ${lead.qualificationScore || 0}`,
          type: "info",
          category: "lead",
          relatedId: lead.leadId,
          isRead: false,
        });
      }

      return { success: true };
    }),

  /**
   * Get assignment history
   */
  getAssignmentHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const assignments = await db
        .select({
          leadId: leads.id,
          leadName: leads.name,
          company: leads.company,
          score: leads.qualificationScore,
          assignedTo: leads.assignedTo,
          assignedAt: leads.updatedAt,
          status: leads.status,
        })
        .from(leads)
        .where(sql`${leads.assignedTo} IS NOT NULL`)
        .orderBy(desc(leads.updatedAt))
        .limit(input.limit);

      // Enrich with agent names
      const enriched = await Promise.all(
        assignments.map(async (assignment) => {
          if (!assignment.assignedTo) return { ...assignment, agentName: null };

          const [agent] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, assignment.assignedTo))
            .limit(1);

          return {
            ...assignment,
            agentName: agent?.name || "Unknown",
          };
        })
      );

      return enriched;
    }),
});
