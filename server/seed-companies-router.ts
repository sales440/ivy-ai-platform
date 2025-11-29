import { z } from "zod";
import { adminProcedure, router } from "./_core/trpc";
import mysql from "mysql2/promise";

/**
 * Seed Companies Router
 * 
 * Provides admin-only endpoints to seed production database with companies
 */
export const seedCompaniesRouter = router({
  /**
   * Create companies table if it doesn't exist
   * Admin only - creates the companies table structure
   */
  createCompaniesTable: adminProcedure.mutation(async () => {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    try {
      // Create companies table
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS companies (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          industry VARCHAR(100),
          plan ENUM('starter', 'professional', 'enterprise') DEFAULT 'starter' NOT NULL,
          logo TEXT,
          website VARCHAR(500),
          contactEmail VARCHAR(320),
          contactPhone VARCHAR(50),
          address TEXT,
          isActive BOOLEAN DEFAULT TRUE NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
        )
      `);

      await connection.end();

      return {
        success: true,
        message: 'Companies table created successfully',
      };
    } catch (error: any) {
      await connection.end();
      throw new Error(`Failed to create companies table: ${error.message}`);
    }
  }),

  /**
   * Seed FAGOR and Ivy.AI companies
   * Admin only - creates the two main companies if they don't exist
   */
  seedMainCompanies: adminProcedure.mutation(async () => {
    // Create direct connection for raw SQL
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

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
        const [rows] = await connection.execute(
          "SELECT id FROM companies WHERE id = ?",
          [company.id]
        );

        if (Array.isArray(rows) && rows.length > 0) {
          results.skipped.push(`${company.name} (ID: ${company.id})`);
          continue;
        }

        // Insert company
        await connection.execute(
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

    await connection.end();

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
