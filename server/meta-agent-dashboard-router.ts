/**
 * Meta-Agent Dashboard Router
 * 
 * tRPC router for Meta-Agent Dashboard interactions
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { metaAgent } from "./meta-agent/index";
import { 
  startMarketIntelligenceScheduler,
  stopMarketIntelligenceScheduler,
  getSchedulerStatus,
  getSchedulerStats 
} from "./meta-agent/capabilities/market-intelligence-scheduler";

export const metaAgentDashboardRouter = router({
  // Send message to Meta-Agent
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string(),
      context: z.object({
        section: z.enum(['new-task', 'search', 'market', 'library', 'new-project', 'tasks']).optional(),
        companyId: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      console.log('[Meta-Agent Dashboard] Received message:', input.message);
      
      // Add context to message if provided
      let fullMessage = input.message;
      if (input.context?.section) {
        fullMessage = `[Context: ${input.context.section}] ${input.message}`;
      }

      // Send to Meta-Agent
      const response = await metaAgent.handleChatMessage(fullMessage, ctx.user.id);

      return {
        success: true,
        response: response.content,
        action: response.metadata?.action || null,
      };
    }),

  // Get conversation history
  getHistory: protectedProcedure
    .input(z.object({
      limit: z.number().optional().default(50),
    }))
    .query(async ({ input, ctx }) => {
      // TODO: Implement conversation history storage
      return {
        messages: [],
      };
    }),

  // Search web
  searchWeb: protectedProcedure
    .input(z.object({
      query: z.string(),
      maxResults: z.number().optional().default(5),
    }))
    .mutation(async ({ input }) => {
      const message = `Busca en Internet: ${input.query}`;
      const response = await metaAgent.handleChatMessage(message, 'system');
      
      return {
        success: true,
        results: response.response,
      };
    }),

  // Get market trends
  getMarketTrends: protectedProcedure
    .input(z.object({
      industry: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const message = input.industry 
        ? `Muéstrame las tendencias de mercado para la industria: ${input.industry}`
        : 'Muéstrame las tendencias de mercado de nuestros clientes actuales';
      
      const response = await metaAgent.handleChatMessage(message, 'system');
      
      return {
        success: true,
        trends: response.response,
      };
    }),

  // Get library (projects and templates)
  getLibrary: protectedProcedure
    .query(async () => {
      const message = 'Muéstrame todos los proyectos y templates de empresas que han contratado servicios de Ivy.AI';
      const response = await metaAgent.handleChatMessage(message, 'system');
      
      return {
        success: true,
        library: response.response,
      };
    }),

  // Create new project
  createProject: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      industry: z.string(),
      services: z.array(z.string()),
      additionalInfo: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const message = `Crea un nuevo proyecto para la empresa "${input.companyName}" de la industria ${input.industry}. Servicios contratados: ${input.services.join(', ')}. ${input.additionalInfo || ''}. Sugiere campañas y propuestas basadas en análisis de mercado en tiempo real.`;
      
      const response = await metaAgent.handleChatMessage(message, 'system');
      
      return {
        success: true,
        project: response.response,
        suggestions: response.response,
      };
    }),

  // Get tasks for specific companies
  getTasks: protectedProcedure
    .input(z.object({
      companyIds: z.array(z.string()),
    }))
    .query(async ({ input }) => {
      const message = `Muéstrame las tareas de las siguientes empresas: ${input.companyIds.join(', ')}`;
      const response = await metaAgent.handleChatMessage(message, 'system');
      
      return {
        success: true,
        tasks: response.response,
      };
    }),

  // Scheduler management
  scheduler: router({
    start: protectedProcedure
      .input(z.object({
        intervalHours: z.number().min(24).max(48),
        industries: z.array(z.string()).optional(),
        competitorUrls: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
      }))
      .mutation(async ({ input }) => {
        await startMarketIntelligenceScheduler({
          intervalHours: input.intervalHours,
          industries: input.industries || [],
          competitorUrls: input.competitorUrls || [],
          keywords: input.keywords || [],
          trainIvyCallEnabled: true,
          enabled: true,
        });

        return {
          success: true,
          message: `Scheduler started with ${input.intervalHours}h interval`,
        };
      }),

    stop: protectedProcedure
      .mutation(async () => {
        stopMarketIntelligenceScheduler();
        return {
          success: true,
          message: 'Scheduler stopped',
        };
      }),

    status: protectedProcedure
      .query(async () => {
        const status = getSchedulerStatus();
        return {
          success: true,
          status,
        };
      }),

    stats: protectedProcedure
      .query(async () => {
        const stats = getSchedulerStats();
        return {
          success: true,
          stats,
        };
      }),
  }),
});

export type MetaAgentDashboardRouter = typeof metaAgentDashboardRouter;
