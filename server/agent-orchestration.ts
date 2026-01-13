import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

/**
 * Agent Orchestration System
 * Allows ROPA to create, manage, and coordinate specialized AI agents
 */

// Agent types
export type AgentType = "email" | "phone" | "sms" | "social_media" | "research" | "analytics";
export type AgentStatus = "idle" | "active" | "busy" | "error" | "training";

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: string[];
  performance: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    lastActive: string;
  };
  assignedCampaigns: number[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentTask {
  id: string;
  agentId: string;
  campaignId: number;
  type: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed" | "failed";
  input: any;
  output?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

// In-memory agent storage (replace with database in production)
const agents: Map<string, Agent> = new Map();
const agentTasks: Map<string, AgentTask> = new Map();

// Initialize default agents
function initializeDefaultAgents() {
  const defaultAgents: Agent[] = [
    {
      id: "agent-email-001",
      name: "Email Campaign Agent",
      type: "email",
      status: "idle",
      capabilities: ["compose_email", "send_bulk_email", "track_opens", "follow_up"],
      performance: {
        tasksCompleted: 0,
        successRate: 0,
        averageResponseTime: 0,
        lastActive: new Date().toISOString(),
      },
      assignedCampaigns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "agent-phone-001",
      name: "Phone Outreach Agent",
      type: "phone",
      status: "idle",
      capabilities: ["make_call", "script_generation", "objection_handling", "schedule_callback"],
      performance: {
        tasksCompleted: 0,
        successRate: 0,
        averageResponseTime: 0,
        lastActive: new Date().toISOString(),
      },
      assignedCampaigns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "agent-research-001",
      name: "Market Research Agent",
      type: "research",
      status: "idle",
      capabilities: ["company_research", "lead_enrichment", "competitor_analysis", "market_trends"],
      performance: {
        tasksCompleted: 0,
        successRate: 0,
        averageResponseTime: 0,
        lastActive: new Date().toISOString(),
      },
      assignedCampaigns: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  defaultAgents.forEach(agent => agents.set(agent.id, agent));
}

// Initialize on module load
initializeDefaultAgents();

export const agentOrchestrationRouter = router({
  // ========== AGENT MANAGEMENT ==========

  getAllAgents: protectedProcedure.query(async () => {
    return {
      success: true,
      agents: Array.from(agents.values()),
    };
  }),

  getAgent: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      const agent = agents.get(input.agentId);
      if (!agent) {
        return { success: false, error: "Agent not found" };
      }
      return { success: true, agent };
    }),

  createAgent: protectedProcedure
    .input(z.object({
      name: z.string(),
      type: z.enum(["email", "phone", "sms", "social_media", "research", "analytics"]),
      capabilities: z.array(z.string()),
    }))
    .mutation(async ({ input }) => {
      const agentId = `agent-${input.type}-${Date.now()}`;
      const newAgent: Agent = {
        id: agentId,
        name: input.name,
        type: input.type,
        status: "idle",
        capabilities: input.capabilities,
        performance: {
          tasksCompleted: 0,
          successRate: 0,
          averageResponseTime: 0,
          lastActive: new Date().toISOString(),
        },
        assignedCampaigns: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      agents.set(agentId, newAgent);
      return { success: true, agent: newAgent };
    }),

  updateAgentStatus: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      status: z.enum(["idle", "active", "busy", "error", "training"]),
    }))
    .mutation(async ({ input }) => {
      const agent = agents.get(input.agentId);
      if (!agent) {
        return { success: false, error: "Agent not found" };
      }
      agent.status = input.status;
      agent.updatedAt = new Date().toISOString();
      agents.set(input.agentId, agent);
      return { success: true, agent };
    }),

  assignCampaignToAgent: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      campaignId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const agent = agents.get(input.agentId);
      if (!agent) {
        return { success: false, error: "Agent not found" };
      }
      if (!agent.assignedCampaigns.includes(input.campaignId)) {
        agent.assignedCampaigns.push(input.campaignId);
        agent.updatedAt = new Date().toISOString();
        agents.set(input.agentId, agent);
      }
      return { success: true, agent };
    }),

  // ========== TASK MANAGEMENT ==========

  createTask: protectedProcedure
    .input(z.object({
      agentId: z.string(),
      campaignId: z.number(),
      type: z.string(),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      input: z.any(),
    }))
    .mutation(async ({ input }) => {
      const agent = agents.get(input.agentId);
      if (!agent) {
        return { success: false, error: "Agent not found" };
      }

      const taskId = `task-${Date.now()}`;
      const newTask: AgentTask = {
        id: taskId,
        agentId: input.agentId,
        campaignId: input.campaignId,
        type: input.type,
        priority: input.priority,
        status: "pending",
        input: input.input,
        createdAt: new Date().toISOString(),
      };

      agentTasks.set(taskId, newTask);
      return { success: true, task: newTask };
    }),

  getAgentTasks: protectedProcedure
    .input(z.object({ agentId: z.string() }))
    .query(async ({ input }) => {
      const tasks = Array.from(agentTasks.values()).filter(
        task => task.agentId === input.agentId
      );
      return { success: true, tasks };
    }),

  updateTaskStatus: protectedProcedure
    .input(z.object({
      taskId: z.string(),
      status: z.enum(["pending", "in_progress", "completed", "failed"]),
      output: z.any().optional(),
      error: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const task = agentTasks.get(input.taskId);
      if (!task) {
        return { success: false, error: "Task not found" };
      }

      task.status = input.status;
      if (input.output) task.output = input.output;
      if (input.error) task.error = input.error;
      if (input.status === "completed" || input.status === "failed") {
        task.completedAt = new Date().toISOString();
      }

      agentTasks.set(input.taskId, task);

      // Update agent performance
      if (input.status === "completed") {
        const agent = agents.get(task.agentId);
        if (agent) {
          agent.performance.tasksCompleted++;
          agent.performance.lastActive = new Date().toISOString();
          agents.set(task.agentId, agent);
        }
      }

      return { success: true, task };
    }),

  // ========== ORCHESTRATION ==========

  assignOptimalAgent: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      taskType: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Find the best agent for this task type
      const availableAgents = Array.from(agents.values()).filter(
        agent => agent.status === "idle" || agent.status === "active"
      );

      if (availableAgents.length === 0) {
        return { success: false, error: "No available agents" };
      }

      // Simple selection: pick agent with highest success rate
      const bestAgent = availableAgents.reduce((best, current) =>
        current.performance.successRate > best.performance.successRate ? current : best
      );

      return { success: true, agent: bestAgent };
    }),

  getSystemMetrics: protectedProcedure.query(async () => {
    const allAgents = Array.from(agents.values());
    const allTasks = Array.from(agentTasks.values());

    return {
      success: true,
      metrics: {
        totalAgents: allAgents.length,
        activeAgents: allAgents.filter(a => a.status === "active").length,
        idleAgents: allAgents.filter(a => a.status === "idle").length,
        totalTasks: allTasks.length,
        pendingTasks: allTasks.filter(t => t.status === "pending").length,
        completedTasks: allTasks.filter(t => t.status === "completed").length,
        failedTasks: allTasks.filter(t => t.status === "failed").length,
      },
    };
  }),
});
