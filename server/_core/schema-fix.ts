import { db as dbConnection } from "../db";
import { sql } from "drizzle-orm";

console.log("[SchemaFix] 🧩 Module Loaded");

export async function runEmergencySchemaFix() {
  console.log('[SchemaFix] 🚨 Starting Emergency Schema Repair...');

  if (!dbConnection) {
    console.error('[SchemaFix] ❌ Database connection is NULL. Cannot run schema fix.');
    return;
  }

  // Alias to ensure non-null type in this scope
  const db = dbConnection;

  try {
    // 1. Fix 'agents' table - companyId
    try {
      console.log('[SchemaFix] Checking agents.companyId...');
      await db.execute(sql`SELECT companyId FROM agents LIMIT 1`);
      console.log('[SchemaFix] ✅ agents.companyId exists.');
    } catch (error: any) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('[SchemaFix] ⚠️ Missing agents.companyId. Fixing...');
        await db.execute(sql`ALTER TABLE agents ADD COLUMN companyId int NOT NULL DEFAULT 1`);
        console.log('[SchemaFix] ✅ Fixed agents.companyId');
      } else {
        console.error('[SchemaFix] Error checking agents:', error);
      }
    }

    // 2. Fix 'users' table - companyId
    try {
      console.log('[SchemaFix] Checking users.companyId...');
      await db.execute(sql`SELECT companyId FROM users LIMIT 1`);
      console.log('[SchemaFix] ✅ users.companyId exists.');
    } catch (error: any) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('[SchemaFix] ⚠️ Missing users.companyId. Fixing...');
        await db.execute(sql`ALTER TABLE users ADD COLUMN companyId int NOT NULL DEFAULT 1`);
        console.log('[SchemaFix] ✅ Fixed users.companyId');
      } else {
        console.error('[SchemaFix] Error checking users:', error);
      }
    }

    // 3. Fix 'companies' table (Create if missing)
    try {
      console.log('[SchemaFix] Checking companies table...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS companies(
  id int NOT NULL AUTO_INCREMENT,
  name varchar(255) NOT NULL,
  domain varchar(255),
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY(id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;
`);
      // Ensure default company exists
      await db.execute(sql`
        INSERT INTO companies(id, name, domain) 
        SELECT 1, 'Default Company', 'example.com' 
        WHERE NOT EXISTS(SELECT 1 FROM companies WHERE id = 1)
  `);
      console.log('[SchemaFix] ✅ companies table verified.');
    } catch (error) {
      console.error('[SchemaFix] Error ensuring companies table:', error);
    }

    console.log('[SchemaFix] ✅ Emergency Repair Complete.');

  } catch (error) {
    console.error('[SchemaFix] ❌ Critical Failure in Reformer:', error);
  }
}
