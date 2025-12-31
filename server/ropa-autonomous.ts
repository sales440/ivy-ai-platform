/**
 * ROPA Autonomous Service
 * Handles 24/7 autonomous operations, self-healing, and maintenance cycles
 */

import { ropaTools } from "./ropa-tools";
import { createRopaTask, updateRopaTaskStatus, getRopaConfig, setRopaConfig, createRopaLog, createRopaAlert } from "./ropa-db";
import { notifyROPAHealthCheck, notifyROPAMaintenance, notifyROPACriticalError } from "./websocket-notifications";

let maintenanceInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;
let marketIntelligenceInterval: NodeJS.Timeout | null = null;

/**
 * Initialize ROPA autonomous operations
 */
export async function initializeROPA() {
  console.log("[ROPA] 🤖 Initializing autonomous operations...");

  // Set initial config
  await setRopaConfig("ropa_status", {
    enabled: true,
    startedAt: new Date(),
    version: "2.0",
  });

  await createRopaLog({
    level: "info",
    message: "ROPA autonomous system initialized",
    metadata: { version: "2.0", tools: 50 },
  });

  // Start autonomous cycles
  startHealthCheckCycle();
  startMaintenanceCycle();
  startMarketIntelligenceCycle();

  console.log("[ROPA] ✅ Autonomous operations started");
}

/**
 * Health Check Cycle - Every 2 minutes
 */
function startHealthCheckCycle() {
  if (healthCheckInterval) clearInterval(healthCheckInterval);

  healthCheckInterval = setInterval(async () => {
    try {
      const taskId = `health_${Date.now()}`;

      await createRopaTask({
        taskId,
        type: "health_check",
        status: "running",
        priority: "high",
      });

      // Run health checks
      const platformHealth = await ropaTools.checkPlatformHealth();
      const dbHealth = await ropaTools.monitorDatabaseHealth();

      // Send health check notification
      await notifyROPAHealthCheck(platformHealth.score, platformHealth.overall);

      // Check for critical issues
      if (platformHealth.score < 70) {
        await createRopaAlert({
          severity: "critical",
          title: "Platform Health Critical",
          message: `Platform health score: ${platformHealth.score}%`,
          resolved: false,
          metadata: platformHealth,
        });

        await notifyROPACriticalError(
          "Platform health critical",
          { score: platformHealth.score, details: platformHealth }
        );

        // Auto-heal
        await autoHealPlatform();
      }

      await updateRopaTaskStatus(taskId, "completed", {
        platformHealth,
        dbHealth,
      });
    } catch (error: any) {
      console.error("[ROPA] Health check failed:", error);
      await createRopaLog({
        level: "error",
        message: `Health check failed: ${error.message}`,
      });
    }
  }, 2 * 60 * 1000); // Every 2 minutes
}

/**
 * Maintenance Cycle - Every 30 minutes
 */
function startMaintenanceCycle() {
  if (maintenanceInterval) clearInterval(maintenanceInterval);

  maintenanceInterval = setInterval(async () => {
    try {
      const taskId = `maintenance_${Date.now()}`;

      await createRopaTask({
        taskId,
        type: "maintenance",
        status: "running",
        priority: "medium",
      });

      await createRopaLog({
        level: "info",
        message: "Starting maintenance cycle",
      });

      // Run maintenance tasks
      const tasks = [
        ropaTools.optimizeDatabaseIndexes(),
        ropaTools.cleanupOldData({ olderThanDays: 90 }),
        ropaTools.analyzeDatabasePerformance(),
        ropaTools.monitorAPIPerformance(),
        ropaTools.trackResourceUsage(),
      ];

      const results = await Promise.allSettled(tasks);

      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      await updateRopaTaskStatus(taskId, "completed", {
        successful,
        failed,
        details: results,
      });

      await createRopaLog({
        level: "info",
        message: `Maintenance cycle completed: ${successful} successful, ${failed} failed`,
      });

      // Send maintenance notification
      await notifyROPAMaintenance("Routine maintenance", {
        successful,
        failed,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("[ROPA] Maintenance cycle failed:", error);
      await createRopaLog({
        level: "error",
        message: `Maintenance cycle failed: ${error.message}`,
      });
    }
  }, 30 * 60 * 1000); // Every 30 minutes
}

/**
 * Market Intelligence Cycle - Every 6 hours
 */
function startMarketIntelligenceCycle() {
  if (marketIntelligenceInterval) clearInterval(marketIntelligenceInterval);

  marketIntelligenceInterval = setInterval(async () => {
    try {
      const taskId = `market_intel_${Date.now()}`;

      await createRopaTask({
        taskId,
        type: "market_intelligence",
        status: "running",
        priority: "low",
      });

      await createRopaLog({
        level: "info",
        message: "Starting market intelligence cycle",
      });

      // Market intelligence tasks would go here
      // For now, just log completion
      await updateRopaTaskStatus(taskId, "completed", {
        insights: ["Market intelligence cycle completed"],
      });
    } catch (error: any) {
      console.error("[ROPA] Market intelligence failed:", error);
    }
  }, 6 * 60 * 60 * 1000); // Every 6 hours
}

/**
 * Auto-Healing System
 */
async function autoHealPlatform() {
  try {
    const taskId = `auto_heal_${Date.now()}`;

    await createRopaTask({
      taskId,
      type: "auto_heal",
      status: "running",
      priority: "critical",
    });

    await createRopaLog({
      level: "warn",
      message: "Auto-healing initiated",
    });

    // Auto-healing actions
    const healingActions = [
      ropaTools.repairDatabaseTables(),
      ropaTools.optimizeDatabaseIndexes(),
      ropaTools.restartFailedServices && ropaTools.restartFailedServices(),
    ].filter(Boolean);

    const results = await Promise.allSettled(healingActions);

    const successful = results.filter((r) => r.status === "fulfilled").length;

    await updateRopaTaskStatus(taskId, "completed", {
      healingActions: successful,
      results,
    });

    await createRopaAlert({
      severity: "warning",
      title: "Auto-Healing Completed",
      message: `Executed ${successful} healing actions`,
      resolved: true,
      resolvedAt: new Date(),
    });

    await createRopaLog({
      level: "info",
      message: `Auto-healing completed: ${successful} actions executed`,
    });
  } catch (error: any) {
    console.error("[ROPA] Auto-healing failed:", error);
    await createRopaLog({
      level: "error",
      message: `Auto-healing failed: ${error.message}`,
    });
  }
}

/**
 * Stop all autonomous operations
 */
export async function stopROPA() {
  console.log("[ROPA] 🛑 Stopping autonomous operations...");

  if (healthCheckInterval) clearInterval(healthCheckInterval);
  if (maintenanceInterval) clearInterval(maintenanceInterval);
  if (marketIntelligenceInterval) clearInterval(marketIntelligenceInterval);

  await setRopaConfig("ropa_status", {
    enabled: false,
    stoppedAt: new Date(),
  });

  await createRopaLog({
    level: "info",
    message: "ROPA autonomous system stopped",
  });

  console.log("[ROPA] ✅ Autonomous operations stopped");
}

/**
 * Get ROPA status
 */
export async function getROPAStatus() {
  const config = await getRopaConfig("ropa_status");
  return {
    enabled: config?.enabled || false,
    running: healthCheckInterval !== null,
    uptime: config?.startedAt ? Date.now() - new Date(config.startedAt).getTime() : 0,
  };
}

// Export for use in startup
export const ropaAutonomous = {
  initialize: initializeROPA,
  stop: stopROPA,
  getStatus: getROPAStatus,
};
