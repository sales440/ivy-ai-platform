import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { processConversationalCommand, type ConversationContext } from "../agents/conversational-orchestrator";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

/**
 * AI Chat Router
 * Handles conversational interactions with Ivy-Orchestrator agent
 */

// In-memory conversation storage (replace with database in production)
const conversations = new Map<number, ConversationContext>();

export const aiChatRouter = router({
  /**
   * Send a message to the AI orchestrator
   */
  sendMessage: protectedProcedure
    .input(z.object({
      message: z.string().min(1),
      companyId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;

      // Get or create conversation context
      let context = conversations.get(userId);
      if (!context) {
        context = {
          userId,
          companyId: input.companyId,
          conversationHistory: [],
        };
      }

      // Update company ID if provided
      if (input.companyId) {
        context.companyId = input.companyId;
      }

      // Process the message
      const result = await processConversationalCommand(input.message, context);

      // Update stored context
      conversations.set(userId, result.updatedContext);

      return {
        response: result.response,
        action: result.action,
        conversationId: userId,
      };
    }),

  /**
   * Get conversation history
   */
  getHistory: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const context = conversations.get(userId);

      return {
        history: context?.conversationHistory || [],
        companyId: context?.companyId,
      };
    }),

  /**
   * Clear conversation history
   */
  clearHistory: protectedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user.id;
      conversations.delete(userId);

      return {
        success: true,
        message: "Conversation history cleared",
      };
    }),

  /**
   * Set active company for conversation
   */
  setCompany: protectedProcedure
    .input(z.object({
      companyId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      
      let context = conversations.get(userId);
      if (!context) {
        context = {
          userId,
          companyId: input.companyId,
          conversationHistory: [],
        };
      } else {
        context.companyId = input.companyId;
      }

      conversations.set(userId, context);

      return {
        success: true,
        companyId: input.companyId,
      };
    }),

  /**
   * Extract contacts from text (CSV, table, or unstructured text)
   */
  extractContacts: protectedProcedure
    .input(z.object({
      text: z.string(),
    }))
    .mutation(async ({ input }) => {
      // TODO: Implement contact extraction with LLM
      return {
        success: true,
        contacts: [],
        count: 0,
        message: "Contact extraction not yet implemented",
      };
    }),

  /**
   * Get quick actions (suggested commands)
   */
  getQuickActions: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) {
        return { actions: [] };
      }

      // Get user's companies
      const { companies } = await import("../../drizzle/schema");
      const userCompanies = await db
        .select()
        .from(companies)
        .where(sql`isActive = 1`)
        .limit(5);

      const actions = [
        {
          id: "create_company",
          label: "Create New Company",
          icon: "building",
          prompt: "I want to create a new company",
        },
        {
          id: "create_campaign",
          label: "Create Email Campaign",
          icon: "mail",
          prompt: "I want to create an email campaign",
        },
        {
          id: "add_contacts",
          label: "Import Contacts",
          icon: "users",
          prompt: "I want to import contacts",
        },
        {
          id: "view_metrics",
          label: "View Campaign Metrics",
          icon: "chart",
          prompt: "Show me campaign metrics",
        },
      ];

      // Add company-specific actions
      for (const company of userCompanies) {
        actions.push({
          id: `company_${company.id}`,
          label: `Switch to ${company.name}`,
          icon: "switch",
          prompt: `Switch to ${company.name}`,
        });
      }

      return { actions };
    }),

  /**
   * Get conversation suggestions based on context
   */
  getSuggestions: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const context = conversations.get(userId);

      const suggestions: string[] = [];

      if (!context?.companyId) {
        suggestions.push("Which company do you want to work with?");
        suggestions.push("Create a new company");
      } else {
        suggestions.push("Create a new campaign");
        suggestions.push("Import contacts");
        suggestions.push("Show campaign metrics");
      }

      return { suggestions };
    }),
});
