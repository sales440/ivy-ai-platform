import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

// Connect to database
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log("🚀 Activating FAGOR campaigns...\n");

// Get FAGOR company ID
const [fagorCompany] = await connection.execute(
  "SELECT id, name FROM companies WHERE slug = 'fagor' LIMIT 1"
);

if (fagorCompany.length === 0) {
  console.error("❌ FAGOR company not found in database!");
  process.exit(1);
}

const companyId = fagorCompany[0].id;
const companyName = fagorCompany[0].name;

console.log(`✅ Found company: ${companyName} (ID: ${companyId})\n`);

// Get all campaigns for FAGOR
const [campaigns] = await connection.execute(
  "SELECT id, name, status FROM campaigns WHERE companyId = ?",
  [companyId]
);

console.log(`📋 Found ${campaigns.length} campaigns for FAGOR:\n`);

let activated = 0;
let alreadyActive = 0;

for (const campaign of campaigns) {
  if (campaign.status === 'active') {
    console.log(`   ✓ ${campaign.name} - Already active`);
    alreadyActive++;
  } else {
    // Activate campaign
    await connection.execute(
      "UPDATE campaigns SET status = 'active', updatedAt = NOW() WHERE id = ?",
      [campaign.id]
    );
    console.log(`   🟢 ${campaign.name} - ACTIVATED`);
    activated++;
  }
}

console.log("\n📊 Activation Summary:");
console.log(`   🟢 Activated: ${activated} campaigns`);
console.log(`   ✓ Already active: ${alreadyActive} campaigns`);
console.log(`   📧 Total: ${campaigns.length} campaigns`);

// Get agent assignments
console.log("\n🤖 Agent Assignments:");
const [agentAssignments] = await connection.execute(
  `SELECT a.name, a.agentId, GROUP_CONCAT(c.name SEPARATOR ', ') as campaigns
   FROM agents a
   LEFT JOIN campaigns c ON FIND_IN_SET(c.id, a.assignedCampaigns)
   WHERE a.companyId = ?
   GROUP BY a.id, a.name, a.agentId`,
  [companyId]
);

for (const assignment of agentAssignments) {
  console.log(`   ${assignment.agentId}: ${assignment.campaigns || 'No campaigns assigned'}`);
}

await connection.end();

console.log("\n✨ FAGOR campaigns activation completed!");
console.log("\n📌 Next steps:");
console.log("   1. Go to /fagor-campaign page");
console.log("   2. Click 'Enroll All in Campaign' for Training 2026");
console.log("   3. Monitor dashboard for email metrics");
