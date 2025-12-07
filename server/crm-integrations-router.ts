import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { HubSpotConnector } from "./crm/hubspot-connector";

export const crmIntegrationsRouter = router({
  /**
   * List all CRM integrations for a company
   */
  list: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      return await db.getCrmIntegrations(input.companyId);
    }),

  /**
   * Test CRM connection
   */
  testConnection: adminProcedure
    .input(z.object({
      crmType: z.enum(["salesforce", "hubspot", "pipedrive"]),
      credentials: z.record(z.any()),
      companyId: z.number(),
    }))
    .mutation(async ({ input }) => {
      try {
        let connector;
        
        switch (input.crmType) {
          case "hubspot":
            connector = new HubSpotConnector(input.credentials, {}, input.companyId);
            break;
          // Add other connectors here
          default:
            throw new Error(`Unsupported CRM type: ${input.crmType}`);
        }

        const isConnected = await connector.testConnection();
        return { success: isConnected };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        };
      }
    }),

  /**
   * Create or update CRM integration
   */
  upsert: adminProcedure
    .input(z.object({
      id: z.number().optional(),
      companyId: z.number(),
      crmType: z.enum(["salesforce", "hubspot", "pipedrive"]),
      credentials: z.record(z.any()),
      config: z.record(z.any()).optional(),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      return await db.upsertCrmIntegration(input);
    }),

  /**
   * Delete CRM integration
   */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return await db.deleteCrmIntegration(input.id);
    }),

  /**
   * Trigger manual sync
   */
  sync: adminProcedure
    .input(z.object({
      integrationId: z.number(),
      direction: z.enum(["from_crm", "to_crm", "bidirectional"]).default("bidirectional"),
    }))
    .mutation(async ({ input }) => {
      try {
        const integration = await db.getCrmIntegrationById(input.integrationId);
        if (!integration) {
          throw new Error("Integration not found");
        }

        let connector;
        switch (integration.crmType) {
          case "hubspot":
            connector = new HubSpotConnector(
              integration.credentials as any,
              integration.config as any,
              integration.companyId
            );
            break;
          default:
            throw new Error(`Unsupported CRM type: ${integration.crmType}`);
        }

        // Perform sync based on direction
        const results = {
          leadsFromCRM: null as any,
          leadsToCRM: null as any,
          ticketsFromCRM: null as any,
          ticketsToCRM: null as any,
        };

        if (input.direction === "from_crm" || input.direction === "bidirectional") {
          results.leadsFromCRM = await connector.syncLeadsFromCRM();
          results.ticketsFromCRM = await connector.syncTicketsFromCRM();
        }

        if (input.direction === "to_crm" || input.direction === "bidirectional") {
          // Get leads and tickets to sync
          const leads = await db.getAllLeads(integration.companyId);
          const tickets = await db.getAllTickets(integration.companyId);
          
          results.leadsToCRM = await connector.syncLeadsToCRM(leads as any);
          results.ticketsToCRM = await connector.syncTicketsToCRM(tickets as any);
        }

        // Update last sync time
        await db.updateCrmIntegrationSyncStatus(input.integrationId, {
          lastSyncAt: new Date(),
          syncStatus: "idle",
        });

        return { success: true, results };
      } catch (error) {
        await db.updateCrmIntegrationSyncStatus(input.integrationId, {
          syncStatus: "error",
          syncError: error instanceof Error ? error.message : "Sync failed",
        });

        return {
          success: false,
          error: error instanceof Error ? error.message : "Sync failed",
        };
      }
    }),
});
