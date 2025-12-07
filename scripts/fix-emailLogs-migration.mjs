import { drizzle } from 'drizzle-orm/mysql2';
import fs from 'fs';

const db = drizzle(process.env.DATABASE_URL);

async function runMigration() {
  try {
    console.log('[Migration] Adding respondedAt and updatedAt columns to emailLogs...');
    
    const sql = fs.readFileSync('./scripts/fix-emailLogs-schema.sql', 'utf8');
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await db.execute(statement);
        console.log(`[Migration] Executed: ${statement.substring(0, 60)}...`);
      }
    }
    
    console.log('[Migration] ✅ Successfully added columns to emailLogs');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] ❌ Error:', error);
    process.exit(1);
  }
}

runMigration();
