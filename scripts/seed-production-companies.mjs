/**
 * Seed Production Database with FAGOR and Ivy.AI Companies
 * 
 * This script creates the two main companies in the production database:
 * - FAGOR Automation (ID: 90001)
 * - Ivy.AI (ID: 90002)
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Connect to database
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🚀 Seeding production database with companies...\n");

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

let created = 0;
let skipped = 0;

for (const company of companies) {
  try {
    // Check if company exists
    const [existing] = await connection.execute(
      "SELECT id FROM companies WHERE id = ?",
      [company.id]
    );

    if (existing.length > 0) {
      console.log(`⏭️  Skipped: ${company.name} (ID: ${company.id}) - already exists`);
      skipped++;
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

    console.log(`✅ Created: ${company.name} (ID: ${company.id})`);
    created++;
  } catch (error) {
    console.error(`❌ Error creating ${company.name}:`, error.message);
  }
}

await connection.end();

console.log("\n📊 Seed Summary:");
console.log(`   ✅ Created: ${created} companies`);
console.log(`   ⏭️  Skipped: ${skipped} companies (already exist)`);
console.log(`   📧 Total: ${companies.length} companies processed`);
console.log("\n✨ Production database seeding completed!");
console.log("\n🔄 Next: Push this to GitHub and Railway will auto-deploy");
