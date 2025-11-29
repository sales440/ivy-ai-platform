import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

/**
 * Seed Companies Router
 * 
 * Provides admin-only endpoints to seed production database with companies
 */
export const seedCompaniesRouter = router({
  /**
   * Seed FAGOR and Ivy.AI companies
   * Admin only - creates the two main companies if they don't exist
   */
  seedMainCompanies: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const companies = [
      {
        id: 90001,
        name: "FAGOR Automation",
        slug: "fagor",
        industry: "Manufacturing & Industrial Automation",
        plan: "enterprise",
        logo: null,
        website: "https://www.fagorautomation.com",
        contactEmail: "service@fagor-automation.com",
        contactPhone: "+1-847-593-5400",
        address: "1755 Park Street, Elk Grove Village, IL 60007",
        isActive: 1,
      },
      {
        id: 90002,
        name: "Ivy.AI",
        slug: "ivy-ai",
        industry: "Artificial Intelligence & Automation",
        plan: "enterprise",
        logo: null,
        website: "https://ivy-ai.com",
        contactEmail: "hello@ivy-ai.com",
        contactPhone: "",
        address: "",
        isActive: 1,
      },
    ];

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    for (const company of companies) {
      try {
        // Check if company exists
        const existing = await db.execute(
          "SELECT id FROM companies WHERE id = ?",
          [company.id]
        );

        if (existing[0] && Array.isArray(existing[0]) && existing[0].length > 0) {
          results.skipped.push(`${company.name} (ID: ${company.id})`);
          continue;
        }

        // Insert company
        await db.execute(
          `INSERT INTO companies (
            id, name, slug, industry, plan, logo, website, 
            contactEmail, contactPhone, address, isActive, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            company.id,
            company.name,
            company.slug,
            company.industry,
            company.plan,
            company.logo,
            company.website,
            company.contactEmail,
            company.contactPhone,
            company.address,
            company.isActive,
          ]
        );

        results.created.push(`${company.name} (ID: ${company.id})`);
      } catch (error: any) {
        results.errors.push(`${company.name}: ${error.message}`);
      }
    }

    return {
      success: true,
      results,
      summary: {
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
        total: companies.length,
      },
    };
  }),
});
