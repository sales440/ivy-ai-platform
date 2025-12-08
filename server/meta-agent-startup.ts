/**
 * Meta-Agent Startup Script
 * 
 * Automatically starts Meta-Agent when server boots
 */

import { metaAgent } from "./meta-agent";
import { platformMaintenance } from "./meta-agent/capabilities/platform-maintenance";
import { campaignGenerator } from "./meta-agent/campaign-generator";

/**
 * Initialize and start Meta-Agent
 */
export async function startMetaAgent(): Promise<void> {
  try {
    console.log("[Meta-Agent Startup] Initializing Meta-Agent system...");

    // Start Meta-Agent
    await metaAgent.start();

    // Start 24/7 Platform Maintenance
    await platformMaintenance.start();

    // Generate campaigns for new clients
    console.log("[Meta-Agent Startup] Checking for clients without campaigns...");
    await campaignGenerator.generateCampaignsForNewClients();

    // Schedule campaign optimization every 30 minutes
    setInterval(async () => {
      console.log("[Meta-Agent Startup] Running campaign optimization...");
      await campaignGenerator.optimizeCampaigns();
      await campaignGenerator.generateCampaignsForNewClients();
    }, 30 * 60 * 1000); // 30 minutes

    console.log("[Meta-Agent Startup] ✅ Meta-Agent system started successfully");
    console.log("[Meta-Agent Startup] 🤖 Meta-Agent is now maintaining the platform 24/7");
    console.log("[Meta-Agent Startup] 📊 Access dashboard at: /meta-agent");
  } catch (error: any) {
    console.error("[Meta-Agent Startup] ❌ Failed to start Meta-Agent:", error);
    // Don't throw - allow server to start even if Meta-Agent fails
  }
}

/**
 * Stop Meta-Agent gracefully
 */
export function stopMetaAgent(): void {
  try {
    console.log("[Meta-Agent Startup] Stopping Meta-Agent...");

    metaAgent.stop();
    platformMaintenance.stop();

    console.log("[Meta-Agent Startup] Meta-Agent stopped");
  } catch (error: any) {
    console.error("[Meta-Agent Startup] Error stopping Meta-Agent:", error);
  }
}

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n[Meta-Agent Startup] Received SIGINT, shutting down gracefully...");
  stopMetaAgent();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Meta-Agent Startup] Received SIGTERM, shutting down gracefully...");
  stopMetaAgent();
  process.exit(0);
});
