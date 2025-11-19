import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  console.log("🔧 Adding sector, sequence, and delayDays columns to emailCampaigns table...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    // Read SQL file
    const sqlPath = path.join(__dirname, "add-email-template-columns.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Execute SQL
    await connection.execute(sql);

    console.log("✅ Successfully added columns to emailCampaigns table:");
    console.log("   - sector VARCHAR(50)");
    console.log("   - sequence INT");
    console.log("   - delayDays INT\n");

    // Verify columns were added
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM emailCampaigns WHERE Field IN ('sector', 'sequence', 'delayDays')"
    );

    console.log("📋 Verified columns:");
    columns.forEach(col => {
      console.log(`   ✓ ${col.Field} (${col.Type})`);
    });

  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("⚠️  Columns already exist. Skipping migration.");
    } else {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

runMigration()
  .then(() => {
    console.log("\n✨ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed:", error);
    process.exit(1);
  });
