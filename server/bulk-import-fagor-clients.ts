import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { fagorContacts, fagorCampaignEnrollments } from "../drizzle/schema";

const ClientSchema = z.object({
  company_name: z.string(),
  customer_number: z.string().optional(),
  city: z.string().optional(),
  machine_model: z.string().optional(),
  control_type: z.string().optional(),
  purchase_date: z.string().optional(),
  state: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  contact_name: z.string().optional(),
  address: z.string().optional(),
  website: z.string().optional(),
});

export const bulkImportRouter = router({
  /**
   * Import all FAGOR clients from JSON file
   */
  importAllClients: publicProcedure
    .input(z.object({
      clients: z.array(ClientSchema),
      campaignId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { clients, campaignId } = input;
      
      let imported = 0;
      let skipped = 0;
      let enrolled = 0;
      const errors: string[] = [];

      for (const client of clients) {
        try {
          // Check if client already exists by company name and state
          const existing = await db
            .select()
            .from(fagorContacts)
            .where(sql`${fagorContacts.companyName} = ${client.company_name} AND ${fagorContacts.customFields} LIKE ${`%"state":"${client.state}"%`}`)
            .limit(1);

          if (existing.length > 0) {
            skipped++;
            continue;
          }

          // Insert new contact
          const [insertedContact] = await db.insert(fagorContacts).values({
            companyName: client.company_name,
            email: client.email || `info@${client.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: client.phone || '',
            contactName: client.contact_name || 'Sales Department',
            customFields: JSON.stringify({
              customer_number: client.customer_number || '',
              city: client.city || '',
              state: client.state,
              machine_model: client.machine_model || '',
              control_type: client.control_type || '',
              purchase_date: client.purchase_date || '',
              address: client.address || `${client.city}, ${client.state}`,
              website: client.website || '',
              source: 'excel_import_2009_2023',
            }),
            tags: JSON.stringify([client.state, 'excel_import', 'fagor_customer']),
          });

          imported++;

          // Enroll in campaign if campaignId provided
          if (campaignId && insertedContact) {
            await db.insert(fagorCampaignEnrollments).values({
              contactId: insertedContact.insertId,
              campaignName: 'CNC Training 2026',
              currentStep: 0,
              totalSteps: 3,
              status: 'active',
            });
            enrolled++;
          }
        } catch (error) {
          errors.push(`${client.company_name}: ${error.message}`);
        }
      }

      return {
        success: true,
        imported,
        skipped,
        enrolled,
        total: clients.length,
        errors: errors.slice(0, 10), // Return first 10 errors
      };
    }),

  /**
   * Import clients by state
   */
  importByState: publicProcedure
    .input(z.object({
      state: z.string(),
      clients: z.array(ClientSchema),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { state, clients } = input;
      
      let imported = 0;
      const errors: string[] = [];

      for (const client of clients) {
        try {
          await db.insert(fagorContacts).values({
            companyName: client.company_name,
            email: client.email || `info@${client.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: client.phone || '',
            contactName: client.contact_name || 'Sales Department',
            customFields: JSON.stringify({
              customer_number: client.customer_number || '',
              city: client.city || '',
              state: client.state,
              machine_model: client.machine_model || '',
              control_type: client.control_type || '',
              purchase_date: client.purchase_date || '',
              address: client.address || `${client.city}, ${client.state}`,
              source: 'excel_import_by_state',
            }),
            tags: JSON.stringify([state, 'excel_import']),
          });

          imported++;
        } catch (error) {
          errors.push(`${client.company_name}: ${error.message}`);
        }
      }

      return {
        success: true,
        state,
        imported,
        total: clients.length,
        errors,
      };
    }),

  /**
   * Get import statistics
   */
  getImportStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const totalContacts = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(fagorContacts);

    const excelImports = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(fagorContacts)
      .where(sql`${fagorContacts.customFields} LIKE '%excel_import%'`);

    return {
      totalContacts: totalContacts[0]?.count || 0,
      excelImports: excelImports[0]?.count || 0,
    };
  }),
});

import { sql } from "drizzle-orm";
