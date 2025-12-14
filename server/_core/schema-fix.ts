import { db as dbConnection } from "../db";
import { sql } from "drizzle-orm";

console.log("[SchemaFix] 🧩 Module Loaded");

export async function runEmergencySchemaFix() {
  console.log('[SchemaFix] 🚨 Starting Emergency Schema Repair...');

  if (!dbConnection) {
    console.error('[SchemaFix] ❌ Database connection is NULL. Cannot run schema fix.');
    return;
  }

  const db = dbConnection;

  // Helper to safely execute DDL
  const safeExecute = async (label: string, checkQuery: any, fixQuery: any, errorPattern: string | RegExp) => {
    try {
      console.log(`[SchemaFix] Checking ${label}...`);
      await db.execute(checkQuery);
      console.log(`[SchemaFix] ✅ ${label} verified.`);
    } catch (error: any) {
      // Robust error checking: look at code, cause.code, or message
      const code = error.code || error.cause?.code;
      const message = error.message || error.cause?.message || "";

      const isMatch = (code === 'ER_BAD_FIELD_ERROR' || code === 'ER_NO_SUCH_TABLE' || code === 1054 || code === 1146) ||
        (message && message.match(errorPattern));

      if (isMatch) {
        console.log(`[SchemaFix] ⚠️ Missing ${label}. Applying fix...`);
        try {
          await db.execute(fixQuery);
          console.log(`[SchemaFix] ✅ Fixed ${label}.`);
        } catch (fixErr) {
          console.error(`[SchemaFix] ❌ Failed to fix ${label}:`, fixErr);
        }
      } else {
        console.error(`[SchemaFix] Unexpected error checking ${label}:`, error);
      }
    }
  };

  try {
    // 1. Fix 'agents' table - companyId
    await safeExecute(
      'agents.companyId',
      sql`SELECT companyId FROM agents LIMIT 1`,
      sql`ALTER TABLE agents ADD COLUMN companyId int NOT NULL DEFAULT 1`,
      "Unknown column 'companyId'"
    );

    // 2. Fix 'users' table - companyId
    await safeExecute(
      'users.companyId',
      sql`SELECT companyId FROM users LIMIT 1`,
      sql`ALTER TABLE users ADD COLUMN companyId int NOT NULL DEFAULT 1`,
      "Unknown column 'companyId'"
    );

    // 3. Fix 'metaAgentMemory' table
    await safeExecute(
      'metaAgentMemory table',
      sql`SELECT 1 FROM metaAgentMemory LIMIT 1`,
      sql`CREATE TABLE IF NOT EXISTS metaAgentMemory (
        id int AUTO_INCREMENT NOT NULL,
        userId int NOT NULL,
        role enum('user','assistant','system') NOT NULL,
        content text NOT NULL,
        metadata json,
        timestamp timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT metaAgentMemory_id PRIMARY KEY(id)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`,
      "Table.*metaAgentMemory.*doesn't exist"
    );

    // 4. Fix 'trainingLogs' table
    await safeExecute(
      'trainingLogs table',
      sql`SELECT 1 FROM trainingLogs LIMIT 1`,
      sql`CREATE TABLE IF NOT EXISTS trainingLogs (
        id int AUTO_INCREMENT NOT NULL,
        agentType enum('prospect','closer','solve','logic','talent','insight') NOT NULL,
        trainingModule varchar(255) NOT NULL,
        insights json,
        recommendations json,
        status enum('started','completed','failed') NOT NULL DEFAULT 'started',
        result text,
        timestamp timestamp NOT NULL DEFAULT (now()),
        CONSTRAINT trainingLogs_id PRIMARY KEY(id)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`,
      "Table.*trainingLogs.*doesn't exist"
    );

    // 5. Fix 'companies' table
    await safeExecute(
      'companies table',
      sql`SELECT 1 FROM companies LIMIT 1`,
      sql`CREATE TABLE IF NOT EXISTS companies(
        id int NOT NULL AUTO_INCREMENT,
        name varchar(255) NOT NULL,
        domain varchar(255),
        createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY(id)
      ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci`,
      "Table.*companies.*doesn't exist"
    );

    // 6. Fix 'fagorCampaignEnrollments.agentId'
    await safeExecute(
      'fagorCampaignEnrollments.agentId',
      sql`SELECT agentId FROM fagorCampaignEnrollments LIMIT 1`,
      sql`ALTER TABLE fagorCampaignEnrollments ADD COLUMN agentId int DEFAULT NULL`,
      "Unknown column 'agentId'"
    );

    // Ensure default company exists (Idempotent)
    try {
      await db.execute(sql`
        INSERT INTO companies(id, name, domain) 
        SELECT 1, 'Default Company', 'example.com' 
        WHERE NOT EXISTS(SELECT 1 FROM companies WHERE id = 1)
      `);
    } catch (e) { /* ignore */ }

    console.log('[SchemaFix] ✅ Emergency Repair Complete.');

  } catch (error) {
    console.error('[SchemaFix] ❌ Critical Failure in Reformer:', error);
  }
}
