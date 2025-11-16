import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getAllPredefinedWorkflows, getWorkflowById, executePredefinedWorkflow } from "./workflows/predefined";
import { z } from "zod";
import { getHive } from "./hive/orchestrator";
import { AgentType } from "./agents/core";
import * as db from "./db";

// ============================================================================
// COMMAND PARSER
// ============================================================================

interface ParsedCommand {
  command: string;
  subcommand?: string;
  args: Record<string, any>;
}

function parseCommand(input: string): ParsedCommand {
  const parts = input.trim().split(/\s+/);
  const command = parts[0];
  const subcommand = parts[1];
  const args: Record<string, any> = {};

  // Parse arguments
  for (let i = 2; i < parts.length; i++) {
    if (parts[i].includes('=')) {
      const [key, value] = parts[i].split('=');
      args[key] = value;
    } else {
      args[`arg${i - 1}`] = parts[i];
    }
  }

  return { command, subcommand, args };
}

// ============================================================================
// MAIN ROUTER
// ============================================================================

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================================
  // AGENTS ROUTER
  // ============================================================================
  
  agents: router({
    list: protectedProcedure.query(async () => {
      const hive = await getHive();
      const agents = hive.getAllAgents();
      
      return {
        agents: agents.map(a => a.getInfo()),
        total: agents.length
      };
    }),

    status: protectedProcedure
      .input(z.object({ agentType: z.string() }))
      .query(async ({ input }) => {
        const hive = await getHive();
        const agent = hive.getAgentByType(input.agentType as AgentType);
        
        if (!agent) {
          throw new Error(`Agent not found: ${input.agentType}`);
        }

        return agent.getInfo();
      }),

    execute: protectedProcedure
      .input(z.object({
        agentType: z.string(),
        task: z.object({
          type: z.string(),
        }).passthrough()
      }))
      .mutation(async ({ input }) => {
        const hive = await getHive();
        const agent = hive.getAgentByType(input.agentType as AgentType);
        
        if (!agent) {
          throw new Error(`Agent not found: ${input.agentType}`);
        }

        const result = await agent.executeTask(input.task);
        
        return {
          agent_type: input.agentType,
          agent_name: agent.getName(),
          task_type: input.task.type,
          result: result,
          status: result.status
        };
      }),

    kpis: protectedProcedure.query(async () => {
      const hive = await getHive();
      const agents = hive.getAllAgents();
      
      const kpis: Record<string, any> = {};
      agents.forEach(agent => {
        kpis[agent.getName()] = agent.getKPIs();
      });

      return {
        kpis,
        timestamp: new Date().toISOString()
      };
    }),
  }),

  // ============================================================================
  // WORKFLOWS ROUTER
  // ============================================================================
  
  workflows: router({
    execute: protectedProcedure
      .input(z.object({
        workflowName: z.string(),
        initialData: z.record(z.string(), z.any())
      }))
      .mutation(async ({ input }) => {
        const hive = await getHive();
        const result = await hive.executeWorkflow(input.workflowName, input.initialData);
        
        return result;
      }),

    available: publicProcedure.query(async () => {
      const predefinedWorkflows = getAllPredefinedWorkflows();
      return { 
        predefined: predefinedWorkflows,
        custom: [],
        total: predefinedWorkflows.length
      };
    }),
  }),

  // ============================================================================
  // LEADS ROUTER
  // ============================================================================
  
  leads: router({
    list: protectedProcedure.query(async () => {
      const leads = await db.getAllLeads();
      return { leads };
    }),

    byStatus: protectedProcedure
      .input(z.object({ status: z.enum(["new", "contacted", "qualified", "nurture", "converted", "lost"]) }))
      .query(async ({ input }) => {
        const leads = await db.getLeadsByStatus(input.status);
        return { leads };
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        email: z.string().optional(),
        company: z.string().optional(),
        title: z.string().optional(),
        industry: z.string().optional(),
        location: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { v4: uuidv4 } = await import('uuid');
        const lead = await db.createLead({
          leadId: uuidv4(),
          name: input.name,
          email: input.email,
          company: input.company,
          title: input.title,
          industry: input.industry,
          location: input.location,
          status: "new"
        });
        return { lead };
      }),
  }),

  // ============================================================================
  // TICKETS ROUTER
  // ============================================================================
  
  tickets: router({
    list: protectedProcedure.query(async () => {
      const tickets = await db.getAllTickets();
      return { tickets };
    }),

    byStatus: protectedProcedure
      .input(z.object({ status: z.enum(["open", "in_progress", "resolved", "escalated", "closed"]) }))
      .query(async ({ input }) => {
        const tickets = await db.getTicketsByStatus(input.status);
        return { tickets };
      }),

    create: protectedProcedure
      .input(z.object({
        subject: z.string(),
        issue: z.string(),
        customerEmail: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { v4: uuidv4 } = await import('uuid');
        const ticket = await db.createTicket({
          ticketId: uuidv4(),
          ...input,
          customerId: ctx.user?.id,
          status: "open",
          priority: input.priority || "medium"
        });
        return { ticket };
      }),

    resolve: protectedProcedure
      .input(z.object({
        ticketId: z.number(),
        resolution: z.string()
      }))
      .mutation(async ({ input }) => {
        await db.updateTicketStatus(input.ticketId, "resolved", input.resolution);
        return { success: true };
      }),
  }),

  // ============================================================================
  // KNOWLEDGE BASE ROUTER
  // ============================================================================
  
  knowledge: router({
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        const articles = await db.searchKnowledgeBase(input.query);
        return { articles };
      }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { v4: uuidv4 } = await import('uuid');
        const article = await db.createKnowledgeArticle({
          articleId: uuidv4(),
          ...input,
          createdBy: ctx.user?.id,
          isPublished: true
        });
        return { article };
      }),
  }),

  // ============================================================================
  // COMMAND SYSTEM ROUTER
  // ============================================================================
  
  command: router({
    execute: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const startTime = Date.now();
        const parsed = parseCommand(input.command);

        try {
          let result: any;

          // Route command to appropriate handler
          switch (parsed.command) {
            case "/agents":
              result = await handleAgentsCommand(parsed);
              break;
            case "/agent":
              result = await handleAgentCommand(parsed);
              break;
            case "/workflows":
              result = await handleWorkflowsCommand(parsed);
              break;
            case "/workflow":
              result = await handleWorkflowCommand(parsed);
              break;
            case "/kpis":
              result = await handleKPIsCommand(parsed);
              break;
            case "/analytics":
              result = await handleAnalyticsCommand(parsed);
              break;
            case "/system":
              result = await handleSystemCommand(parsed);
              break;
            default:
              throw new Error(`Unknown command: ${parsed.command}`);
          }

          // Log command
          await db.logCommand({
            userId: ctx.user!.id,
            command: input.command,
            parsedCommand: parsed,
            result: result,
            status: "success",
            executionTime: Date.now() - startTime
          });

          return {
            success: true,
            result,
            executionTime: Date.now() - startTime
          };
        } catch (error: any) {
          // Log failed command
          await db.logCommand({
            userId: ctx.user!.id,
            command: input.command,
            parsedCommand: parsed,
            status: "error",
            error: error.message,
            executionTime: Date.now() - startTime
          });

          return {
            success: false,
            error: error.message,
            executionTime: Date.now() - startTime
          };
        }
      }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ input, ctx }) => {
        const history = await db.getCommandHistory(ctx.user!.id, input.limit || 50);
        return { history };
      }),
  }),

  // ============================================================================
  // ANALYTICS ROUTER
  // ============================================================================
  
  analytics: router({
    systemStatus: protectedProcedure.query(async () => {
      const hive = await getHive();
      return hive.getSystemStatus();
    }),

    agentMetrics: protectedProcedure
      .input(z.object({ agentId: z.number() }))
      .query(async ({ input }) => {
        const metrics = await db.getMetricsByAgent(input.agentId);
        return { metrics };
      }),
  }),
});

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

async function handleAgentsCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  
  if (parsed.subcommand === "list") {
    const agents = hive.getAllAgents();
    return {
      agents: agents.map(a => a.getInfo()),
      total: agents.length
    };
  }

  throw new Error(`Unknown subcommand: /agents ${parsed.subcommand}`);
}

async function handleAgentCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  const agentType = parsed.args.arg1 as AgentType;
  
  if (parsed.subcommand === "status") {
    const agent = hive.getAgentByType(agentType);
    if (!agent) throw new Error(`Agent not found: ${agentType}`);
    return agent.getInfo();
  }

  if (parsed.subcommand === "execute") {
    const agent = hive.getAgentByType(agentType);
    if (!agent) throw new Error(`Agent not found: ${agentType}`);
    
    const taskType = parsed.args.arg2;
    const result = await agent.executeTask({ type: taskType, ...parsed.args });
    
    return {
      agent: agent.getName(),
      task: taskType,
      result
    };
  }

  throw new Error(`Unknown subcommand: /agent ${parsed.subcommand}`);
}

async function handleWorkflowsCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  
  if (parsed.subcommand === "available") {
    const workflows = hive.getAvailableWorkflows();
    return { workflows, total: workflows.length };
  }

  throw new Error(`Unknown subcommand: /workflows ${parsed.subcommand}`);
}

async function handleWorkflowCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  
  if (parsed.subcommand === "execute") {
    const workflowName = parsed.args.arg1;
    const result = await hive.executeWorkflow(workflowName, parsed.args);
    return result;
  }

  throw new Error(`Unknown subcommand: /workflow ${parsed.subcommand}`);
}

async function handleKPIsCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  const agents = hive.getAllAgents();
  
  const department = parsed.args.arg0;
  
  const kpis: Record<string, any> = {};
  agents.forEach(agent => {
    if (!department || agent.getInfo().department === department) {
      kpis[agent.getName()] = agent.getKPIs();
    }
  });

  return { kpis, department: department || "all" };
}

async function handleAnalyticsCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  
  if (parsed.subcommand === "system") {
    return hive.getSystemStatus();
  }

  throw new Error(`Unknown subcommand: /analytics ${parsed.subcommand}`);
}

async function handleSystemCommand(parsed: ParsedCommand) {
  const hive = await getHive();
  
  if (parsed.subcommand === "status" || parsed.subcommand === "health") {
    return hive.getSystemStatus();
  }

  throw new Error(`Unknown subcommand: /system ${parsed.subcommand}`);
}

export type AppRouter = typeof appRouter;
