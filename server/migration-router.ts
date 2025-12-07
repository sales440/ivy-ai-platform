import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

/**
 * Migration router for database schema updates
 * This router provides endpoints to run migrations that can't be handled by Drizzle
 */
export const migrationRouter = router({
  /**
   * Create FAGOR campaign tables
   * Run this endpoint once to create the FAGOR tables in Railway database
   */
  createFagorTables: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      // Create fagorContacts table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS \`fagorContacts\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`name\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(320) NOT NULL UNIQUE,
          \`company\` VARCHAR(255),
          \`role\` VARCHAR(255),
          \`phone\` VARCHAR(50),
          \`source\` VARCHAR(100) NOT NULL DEFAULT 'csv_import',
          \`tags\` JSON,
          \`customFields\` JSON,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Create fagorCampaignEnrollments table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS \`fagorCampaignEnrollments\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`contactId\` INT NOT NULL,
          \`campaignName\` VARCHAR(255) NOT NULL,
          \`currentStep\` INT NOT NULL DEFAULT 0,
          \`status\` ENUM('active', 'paused', 'completed', 'unsubscribed') NOT NULL DEFAULT 'active',
          \`email1SentAt\` TIMESTAMP NULL,
          \`email1OpenedAt\` TIMESTAMP NULL,
          \`email1ClickedAt\` TIMESTAMP NULL,
          \`email2SentAt\` TIMESTAMP NULL,
          \`email2OpenedAt\` TIMESTAMP NULL,
          \`email2ClickedAt\` TIMESTAMP NULL,
          \`email3SentAt\` TIMESTAMP NULL,
          \`email3OpenedAt\` TIMESTAMP NULL,
          \`email3ClickedAt\` TIMESTAMP NULL,
          \`respondedAt\` TIMESTAMP NULL,
          \`enrolledAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`completedAt\` TIMESTAMP NULL,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (\`contactId\`) REFERENCES \`fagorContacts\`(\`id\`) ON DELETE CASCADE
        )
      `);

      // Create fagorEmailEvents table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS \`fagorEmailEvents\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`enrollmentId\` INT NOT NULL,
          \`contactId\` INT NOT NULL,
          \`emailNumber\` INT NOT NULL,
          \`eventType\` ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed') NOT NULL,
          \`messageId\` VARCHAR(255),
          \`userAgent\` TEXT,
          \`ipAddress\` VARCHAR(45),
          \`clickedUrl\` TEXT,
          \`metadata\` JSON,
          \`eventAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`createdAt\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`enrollmentId\`) REFERENCES \`fagorCampaignEnrollments\`(\`id\`) ON DELETE CASCADE,
          FOREIGN KEY (\`contactId\`) REFERENCES \`fagorContacts\`(\`id\`) ON DELETE CASCADE
        )
      `);

      // Create indexes
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorContacts_email\` ON \`fagorContacts\`(\`email\`)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorCampaignEnrollments_contactId\` ON \`fagorCampaignEnrollments\`(\`contactId\`)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorCampaignEnrollments_status\` ON \`fagorCampaignEnrollments\`(\`status\`)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorEmailEvents_enrollmentId\` ON \`fagorEmailEvents\`(\`enrollmentId\`)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorEmailEvents_contactId\` ON \`fagorEmailEvents\`(\`contactId\`)`);
      await db.execute(`CREATE INDEX IF NOT EXISTS \`idx_fagorEmailEvents_eventType\` ON \`fagorEmailEvents\`(\`eventType\`)`);

      return {
        success: true,
        message: "FAGOR tables created successfully",
        tables: ["fagorContacts", "fagorCampaignEnrollments", "fagorEmailEvents"],
      };
    } catch (error: any) {
      console.error("[Migration] Error creating FAGOR tables:", error);
      
      // If tables already exist, return success
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        return {
          success: true,
          message: "FAGOR tables already exist",
          tables: ["fagorContacts", "fagorCampaignEnrollments", "fagorEmailEvents"],
        };
      }
      
      throw new Error(`Failed to create FAGOR tables: ${error.message}`);
    }
  }),

  /**
   * Check if FAGOR tables exist
   */
  checkFagorTables: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    try {
      const result = await db.execute(`
        SELECT TABLE_NAME 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('fagorContacts', 'fagorCampaignEnrollments', 'fagorEmailEvents')
      `);

      const tables = Array.isArray(result[0]) ? result[0].map((row: any) => row.TABLE_NAME) : [];

      return {
        exists: tables.length === 3,
        tables,
        missing: ["fagorContacts", "fagorCampaignEnrollments", "fagorEmailEvents"].filter(
          (t) => !tables.includes(t)
        ),
      };
    } catch (error: any) {
      console.error("[Migration] Error checking FAGOR tables:", error);
      throw new Error(`Failed to check FAGOR tables: ${error.message}`);
    }
  }),
});
