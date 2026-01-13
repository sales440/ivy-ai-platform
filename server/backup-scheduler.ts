/**
 * Automatic Backup Scheduler
 * Runs daily database backups and syncs to Google Drive
 */

import { databaseTools } from "./ropa-tools";
import { createRopaLog } from "./ropa-db";

// Schedule daily backups at 2 AM
const BACKUP_HOUR = 2;
const BACKUP_MINUTE = 0;

let backupInterval: NodeJS.Timeout | null = null;

// Calculate milliseconds until next backup time
function getMillisecondsUntilNextBackup(): number {
  const now = new Date();
  const nextBackup = new Date();
  
  nextBackup.setHours(BACKUP_HOUR, BACKUP_MINUTE, 0, 0);
  
  // If backup time has passed today, schedule for tomorrow
  if (now.getTime() > nextBackup.getTime()) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }
  
  return nextBackup.getTime() - now.getTime();
}

// Execute backup
async function executeBackup() {
  try {
    console.log("[Backup Scheduler] Starting automatic database backup...");
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[Backup Scheduler] Executing scheduled backup",
      metadata: { timestamp: new Date().toISOString() },
    });
    
    // Execute backup (includes Google Drive sync)
    const result = await databaseTools.backupDatabase();
    
    if (result.success) {
      console.log(`[Backup Scheduler] Backup completed successfully: ${result.backupId}`);
      
      if (result.driveLink) {
        console.log(`[Backup Scheduler] Backup synced to Google Drive: ${result.driveLink}`);
        
        await createRopaLog({
          taskId: undefined,
          level: "info",
          message: "[Backup Scheduler] Backup synced to Google Drive",
          metadata: { 
            backupId: result.backupId,
            driveLink: result.driveLink,
          },
        });
      }
    } else {
      console.error("[Backup Scheduler] Backup failed");
      
      await createRopaLog({
        taskId: undefined,
        level: "error",
        message: "[Backup Scheduler] Backup failed",
        metadata: { error: "Backup operation returned failure" },
      });
    }
  } catch (error) {
    console.error("[Backup Scheduler] Error during backup:", error);
    
    await createRopaLog({
      taskId: undefined,
      level: "error",
      message: "[Backup Scheduler] Backup error",
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}

// Schedule next backup
function scheduleNextBackup() {
  const msUntilNextBackup = getMillisecondsUntilNextBackup();
  const nextBackupDate = new Date(Date.now() + msUntilNextBackup);
  
  console.log(`[Backup Scheduler] Next backup scheduled for: ${nextBackupDate.toLocaleString()}`);
  
  backupInterval = setTimeout(async () => {
    await executeBackup();
    
    // Schedule next backup (24 hours later)
    scheduleNextBackup();
  }, msUntilNextBackup);
}

// Initialize backup scheduler
export function initializeBackupScheduler() {
  console.log("[Backup Scheduler] Initializing automatic backup scheduler...");
  
  // Schedule first backup
  scheduleNextBackup();
  
  // Log initialization
  createRopaLog({
    taskId: undefined,
    level: "info",
    message: "[Backup Scheduler] Automatic backup scheduler initialized",
    metadata: { 
      backupTime: `${BACKUP_HOUR.toString().padStart(2, "0")}:${BACKUP_MINUTE.toString().padStart(2, "0")}`,
      nextBackup: new Date(Date.now() + getMillisecondsUntilNextBackup()).toISOString(),
    },
  });
  
  console.log("[Backup Scheduler] ✅ Automatic backups enabled");
}

// Stop backup scheduler (for graceful shutdown)
export function stopBackupScheduler() {
  if (backupInterval) {
    clearTimeout(backupInterval);
    backupInterval = null;
    console.log("[Backup Scheduler] Backup scheduler stopped");
  }
}

// Manual backup trigger (for testing or on-demand backups)
export async function triggerManualBackup(): Promise<{ success: boolean; backupId?: string; driveLink?: string }> {
  console.log("[Backup Scheduler] Manual backup triggered");
  
  await createRopaLog({
    taskId: undefined,
    level: "info",
    message: "[Backup Scheduler] Manual backup triggered",
    metadata: { timestamp: new Date().toISOString() },
  });
  
  return await databaseTools.backupDatabase();
}
