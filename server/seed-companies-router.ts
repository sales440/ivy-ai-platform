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

  /**
   * Seed FAGOR contacts to production
   * Admin only - creates the 20 FAGOR manufacturing contacts
   */
  seedFagorContacts: adminProcedure.mutation(async () => {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    const contacts = [
      { name: "John Martinez", email: "jmartinez@lspceram.com", company: "LSP INDUSTRIAL CERAMICS", role: "CNC Operator" },
      { name: "Sarah Chen", email: "schen@markforged.com", company: "MARKFORGED", role: "Manufacturing Engineer" },
      { name: "Mike Johnson", email: "mjohnson@qsiautomation.com", company: "QSI AUTOMATION", role: "Maintenance Manager" },
      { name: "Emily Rodriguez", email: "erodriguez@guillevin.com", company: "GUILLEVIN INTERNATIONAL", role: "Operations Director" },
      { name: "David Kim", email: "dkim@jbtc.com", company: "JBT FOODTECH", role: "Service Coordinator" },
      { name: "Lisa Wang", email: "lwang@bwpackaging.com", company: "BARRY-WEHMILLER", role: "Plant Manager" },
      { name: "James Thompson", email: "jthompson@mersen.com", company: "MERSEN USA", role: "Procurement Manager" },
      { name: "Maria Garcia", email: "mgarcia@schunk.com", company: "SCHUNK", role: "Technical Support Lead" },
      { name: "Robert Lee", email: "rlee@hainbuch.com", company: "HAINBUCH AMERICA", role: "IT Manager" },
      { name: "Jennifer Brown", email: "jbrown@erowa.com", company: "EROWA", role: "VP Operations" },
      { name: "William Davis", email: "wdavis@roemheld.com", company: "ROEMHELD", role: "Machinist" },
      { name: "Patricia Miller", email: "pmiller@lang-technik.com", company: "LANG TECHNIK", role: "Quality Manager" },
      { name: "Michael Wilson", email: "mwilson@ok-vise.com", company: "OK-VISE", role: "Facility Director" },
      { name: "Linda Moore", email: "lmoore@5th-axis.com", company: "5TH AXIS", role: "Supply Chain Manager" },
      { name: "Richard Taylor", email: "rtaylor@toolsusa.com", company: "TOOLS USA", role: "Automation Engineer" },
      { name: "Barbara Anderson", email: "banderson@heimatec.com", company: "HEIMATEC", role: "CTO" },
      { name: "Thomas Jackson", email: "tjackson@royal-products.com", company: "ROYAL PRODUCTS", role: "Technician" },
      { name: "Susan White", email: "swhite@carr-lane.com", company: "CARR LANE", role: "Production Supervisor" },
      { name: "Christopher Harris", email: "charris@jergens.com", company: "JERGENS INC", role: "Buyer" },
      { name: "Nancy Martin", email: "nmartin@miteebiteprod.com", company: "MITEE-BITE", role: "CEO" }
    ];

    const results = {
      created: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    try {
      // Check if table exists
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'fagorContacts'"
      );

      if (!Array.isArray(tables) || tables.length === 0) {
        // Create table
        await connection.execute(`
          CREATE TABLE fagorContacts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(320) NOT NULL UNIQUE,
            company VARCHAR(255) NOT NULL,
            role VARCHAR(255),
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        `);
      }

      for (const contact of contacts) {
        try {
          // Check if contact exists
          const [rows] = await connection.execute(
            "SELECT id FROM fagorContacts WHERE email = ?",
            [contact.email]
          );

          if (Array.isArray(rows) && rows.length > 0) {
            results.skipped.push(`${contact.name} (${contact.email})`);
            continue;
          }

          // Insert contact
          await connection.execute(
            `INSERT INTO fagorContacts (name, email, company, role, createdAt) VALUES (?, ?, ?, ?, NOW())`,
            [contact.name, contact.email, contact.company, contact.role]
          );

          results.created.push(`${contact.name} (${contact.company})`);
        } catch (error: any) {
          results.errors.push(`${contact.name}: ${error.message}`);
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
          total: contacts.length,
        },
      };
    } catch (error: any) {
      await connection.end();
      throw new Error(`Failed to seed FAGOR contacts: ${error.message}`);
    }
  }),

  /**
   * Enroll all FAGOR contacts in CNC Training 2026 campaign
   * Admin only - enrolls all contacts from fagorContacts table
   */
  enrollAllFagorContacts: adminProcedure.mutation(async () => {
    const connection = await mysql.createConnection(process.env.DATABASE_URL!);

    try {
      // Get all FAGOR contacts
      const [contacts] = await connection.execute(
        "SELECT id, name, email, company, role FROM fagorContacts"
      );

      if (!Array.isArray(contacts) || contacts.length === 0) {
        await connection.end();
        return {
          success: false,
          message: 'No FAGOR contacts found',
          summary: { enrolled: 0, skipped: 0, errors: 0, total: 0 },
        };
      }

      const results = {
        enrolled: [] as string[],
        skipped: [] as string[],
        errors: [] as string[],
      };

      // Check if enrollments table exists
      const [tables] = await connection.execute(
        "SHOW TABLES LIKE 'fagorCampaignEnrollments'"
      );

      if (!Array.isArray(tables) || tables.length === 0) {
        await connection.end();
        throw new Error('fagorCampaignEnrollments table does not exist');
      }

      for (const contact of contacts as any[]) {
        try {
          // Check if already enrolled
          const [existing] = await connection.execute(
            "SELECT id FROM fagorCampaignEnrollments WHERE contactId = ?",
            [contact.id]
          );

          if (Array.isArray(existing) && existing.length > 0) {
            results.skipped.push(`${contact.name} (${contact.email})`);
            continue;
          }

          // Enroll contact
          await connection.execute(
            `INSERT INTO fagorCampaignEnrollments (
              contactId, currentStep, status, enrolledAt, lastEmailSent
            ) VALUES (?, 0, 'active', NOW(), NULL)`,
            [contact.id]
          );

          results.enrolled.push(`${contact.name} (${contact.company})`);
        } catch (error: any) {
          results.errors.push(`${contact.name}: ${error.message}`);
        }
      }

      await connection.end();

      return {
        success: true,
        results,
        summary: {
          enrolled: results.enrolled.length,
          skipped: results.skipped.length,
          errors: results.errors.length,
          total: (contacts as any[]).length,
        },
      };
    } catch (error: any) {
      await connection.end();
      throw new Error(`Failed to enroll FAGOR contacts: ${error.message}`);
    }
  }),
});
