import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read contacts from JSON file
const contactsPath = path.join(__dirname, "../../fagor-contacts-final.json");
const contacts = JSON.parse(fs.readFileSync(contactsPath, "utf-8"));

// Connect to database
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log(`📥 Importing ${contacts.length} FAGOR contacts to database...`);

let imported = 0;
let skipped = 0;

for (const contact of contacts) {
  try {
    // Check if contact already exists
    const [existing] = await connection.execute(
      "SELECT id FROM fagorContacts WHERE email = ?",
      [contact.email]
    );

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${contact.company} (${contact.email}) - already exists`);
      skipped++;
      continue;
    }

    // Insert contact
    await connection.execute(
      `INSERT INTO fagorContacts (
        name, email, company, role, phone, 
        source, status, tags, customFields, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        contact.contactPerson || "Contact",
        contact.email,
        contact.company,
        "Decision Maker", // Default role
        contact.phone || "",
        "manual_import",
        "new",
        JSON.stringify(["manufacturing", "cnc", "fagor_client"]),
        JSON.stringify({
          importDate: new Date().toISOString(),
          source: "fagor-contacts-final.json"
        })
      ]
    );

    console.log(`✅ Imported: ${contact.company} (${contact.email})`);
    imported++;
  } catch (error) {
    console.error(`❌ Error importing ${contact.company}:`, error.message);
  }
}

await connection.end();

console.log("\n📊 Import Summary:");
console.log(`   ✅ Imported: ${imported} contacts`);
console.log(`   ⏭️  Skipped: ${skipped} contacts (duplicates)`);
console.log(`   📧 Total: ${contacts.length} contacts processed`);
console.log("\n✨ FAGOR contacts import completed!");
