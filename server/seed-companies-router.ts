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

          // Enroll contact in CNC Training 2026 campaign
          await connection.execute(
            `INSERT INTO fagorCampaignEnrollments (
              contactId, campaignName, currentStep, status, createdAt, updatedAt
            ) VALUES (?, 'FAGOR_CNC_Training_2026', 0, 'active', NOW(), NOW())`,
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
    }),

    // Seed 27 US appliance service clients for training campaign
    seedUSClients: publicProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const connection = await db.getConnection();
      const results = {
        created: [] as string[],
        enrolled: [] as string[],
        errors: [] as string[],
      };

      const usClients = [
        { name: 'Mike Ponder', email: 'service@cullmanheating.com', company: 'Cullman Heating & Cooling', phone: '(256) 734-2120', address: '1765 AL-157, Cullman, AL 35058', state: 'Alabama' },
        { name: 'Sales Department', email: 'sales@tsappliance.com', company: 'T & S Appliance', phone: '(520) 887-2222', address: '2747 N Palo Verde Blvd, Tucson, AZ 85712', state: 'Arizona' },
        { name: 'Parts Department', email: 'sales@appliancepartscenter.com', company: 'Appliance Parts Center', phone: '(501) 455-5800', address: '9200 Stagecoach Rd, Little Rock, AR 72210', state: 'Arkansas' },
        { name: 'Customer Service', email: 'customerservice@friedmansappliance.com', company: 'Friedmans Appliance', phone: '(415) 456-1500', address: '1650 2nd St, San Rafael, CA 94901', state: 'California' },
        { name: 'Sales Department', email: 'sales@universaldist.com', company: 'Universal Distributors', phone: '(305) 591-9700', address: '7900 NW 25th St, Doral, FL 33122', state: 'Florida' },
        { name: 'Service Manager', email: 'service@georgiaappliancerepair.com', company: 'Georgia Appliance Repair', phone: '(404) 885-7474', address: '2156 Howell Mill Rd NW, Atlanta, GA 30318', state: 'Georgia' },
        { name: 'Sales Team', email: 'info@andersonapplianceinc.com', company: "The 'New' Anderson Appliance", phone: '(708) 449-2400', address: '1800 S Wolf Rd, Hillside, IL 60162', state: 'Illinois' },
        { name: 'General Manager', email: 'info@hucksinc.com', company: "Huck's Inc.", phone: '(317) 272-9200', address: '5715 E US Highway 36, Avon, IN 46123', state: 'Indiana' },
        { name: 'Service Department', email: 'service@homeapplianceservice.net', company: 'Home Appliance Service', phone: '(502) 969-3495', address: '3701 Fern Valley Rd, Louisville, KY 40219', state: 'Kentucky' },
        { name: 'Customer Service', email: 'customerservice@brayandscarff.com', company: 'Bray & Scarff', phone: '(410) 740-9000', address: '9219 Red Branch Rd, Columbia, MD 21045', state: 'Maryland' },
        { name: 'Sales Department', email: 'sales@altvaters.com', company: "Altvater's", phone: '(517) 546-7200', address: '2441 E Grand River Ave, Howell, MI 48843', state: 'Michigan' },
        { name: 'Service Center', email: 'service@warnersstellian.com', company: "Warners' Stellian", phone: '(651) 224-8491', address: '425 Sibley St, St Paul, MN 55101', state: 'Minnesota' },
        { name: 'Sales Staff', email: 'info@ruppertsappliance.com', company: "Ruppert's Appliance", phone: '(314) 822-3333', address: '1235 S Kirkwood Rd, Kirkwood, MO 63122', state: 'Missouri' },
        { name: 'Sales Team', email: 'sales@karlsappliance.com', company: "Karl's Appliance", phone: '(201) 445-2000', address: '95 E Ridgewood Ave, Ridgewood, NJ 07450', state: 'New Jersey' },
        { name: 'Service Manager', email: 'info@universalapplianceserviceny.com', company: 'Universal Appliance Service', phone: '(631) 423-1100', address: '620 New York Ave, Huntington Station, NY 11746', state: 'New York' },
        { name: 'Sales Department', email: 'sales@airportappliance.com', company: 'Airport Appliance', phone: '(919) 467-3942', address: '1150 Airport Rd, Morrisville, NC 27560', state: 'North Carolina' },
        { name: 'Service Department', email: 'service@uasohio.com', company: 'Universal Appliance & Service', phone: '(440) 449-0200', address: '5900 Mayfield Rd, Mayfield Heights, OH 44124', state: 'Ohio' },
        { name: 'Service Coordinator', email: 'info@handhappliance.com', company: 'H&H Appliance Service', phone: '(918) 254-8541', address: '4725 S Mingo Rd, Tulsa, OK 74145', state: 'Oklahoma' },
        { name: 'Customer Service', email: 'customerservice@standardtv.com', company: 'Standard TV & Appliance', phone: '(503) 233-3100', address: '7400 SE Powell Blvd, Portland, OR 97202', state: 'Oregon' },
        { name: 'Sales Team', email: 'sales@karlsappliance.com', company: 'Karl\'s Appliance (PA)', phone: '(610) 687-1600', address: '255 W Lancaster Ave, Devon, PA 19333', state: 'Pennsylvania' },
        { name: 'Sales Department', email: 'info@appliancesalesandsc.com', company: 'Appliance Sales & Service', phone: '(864) 627-0171', address: '401 N Main St, Mauldin, SC 29662', state: 'South Carolina' },
        { name: 'Parts Department', email: 'parts@a1applianceparts.com', company: 'A-1 Appliance Parts', phone: '(615) 256-1900', address: '1122 Murfreesboro Pike, Nashville, TN 37217', state: 'Tennessee' },
        { name: 'Service Manager', email: 'service@uastx.com', company: 'Universal Appliance Service', phone: '(512) 834-6111', address: '12222 N Interstate 35, Austin, TX 78753', state: 'Texas' },
        { name: 'Customer Service', email: 'customerservice@rcwilley.com', company: 'RC Willey', phone: '(801) 464-2000', address: '2301 S 300 W, Salt Lake City, UT 84115', state: 'Utah' },
        { name: 'Sales Staff', email: 'info@warnersappliance.com', company: "Warner's Appliance", phone: '(804) 285-2800', address: '8220 Willow Oaks Corporate Dr, Richmond, VA 23294', state: 'Virginia' },
        { name: 'Customer Service', email: 'customerservice@albertlee.com', company: 'Albert Lee Appliance', phone: '(206) 623-4510', address: '5301 6th Ave S, Seattle, WA 98108', state: 'Washington' },
        { name: 'Sales Department', email: 'info@american.tv', company: 'American TV & Appliance', phone: '(608) 271-1000', address: '5501 Lacy Rd, Fitchburg, WI 53711', state: 'Wisconsin' },
      ];

      try {
        for (const client of usClients) {
          try {
            // Insert contact
            const [insertResult] = await connection.execute(
              `INSERT INTO fagorContacts (
                name, email, company, phone, address, industry, country, createdAt, updatedAt
              ) VALUES (?, ?, ?, ?, ?, 'Appliance Service & Repair', 'USA', NOW(), NOW())`,
              [client.name, client.email, client.company, client.phone, `${client.address}, ${client.state}`]
            );

            const contactId = (insertResult as any).insertId;
            results.created.push(`${client.name} (${client.company})`);

            // Enroll in CNC Training 2026 campaign
            await connection.execute(
              `INSERT INTO fagorCampaignEnrollments (
                contactId, campaignName, currentStep, status, createdAt, updatedAt
              ) VALUES (?, 'FAGOR_CNC_Training_2026', 0, 'active', NOW(), NOW())`,
              [contactId]
            );

            results.enrolled.push(`${client.name} (${client.company})`);
          } catch (error: any) {
            results.errors.push(`${client.name}: ${error.message}`);
          }
        }

        return {
          success: true,
          results,
          summary: {
            created: results.created.length,
            enrolled: results.enrolled.length,
            errors: results.errors.length,
            total: usClients.length,
          },
        };
      } finally {
        connection.release();
      }
    }),
  }),
});