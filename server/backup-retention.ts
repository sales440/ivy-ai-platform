/**
 * Backup Retention Policy and Cleanup Scheduler
 * Automatically removes old backups according to retention rules
 */

import { getOAuth2Client, setCredentials, listFilesInFolder, deleteFileFromDrive } from "./google-drive";
import { getDb } from "./db";
import { googleDriveTokens } from "../drizzle/schema";
import { createRopaLog } from "./ropa-db";

// Retention policy (in days)
const RETENTION_POLICY = {
  daily: 30,      // Keep 30 days of daily backups
  weekly: 84,     // Keep 12 weeks (84 days) of weekly backups
  monthly: 365,   // Keep 12 months (365 days) of monthly backups
  exports: 90,    // Keep 90 days of data exports
};

// Cleanup schedule: Run every day at 3 AM (1 hour after backup)
const CLEANUP_HOUR = 3;
const CLEANUP_MINUTE = 0;

let cleanupInterval: NodeJS.Timeout | null = null;

// Calculate milliseconds until next cleanup time
function getMillisecondsUntilNextCleanup(): number {
  const now = new Date();
  const nextCleanup = new Date();
  
  nextCleanup.setHours(CLEANUP_HOUR, CLEANUP_MINUTE, 0, 0);
  
  // If cleanup time has passed today, schedule for tomorrow
  if (now.getTime() > nextCleanup.getTime()) {
    nextCleanup.setDate(nextCleanup.getDate() + 1);
  }
  
  return nextCleanup.getTime() - now.getTime();
}

// Check if file should be deleted based on retention policy
function shouldDeleteFile(fileName: string, createdDate: Date, folderType: keyof typeof RETENTION_POLICY): boolean {
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const retentionDays = RETENTION_POLICY[folderType];
  
  return ageInDays > retentionDays;
}

// Parse date from backup filename
function parseDateFromFilename(fileName: string): Date | null {
  // Format: DB_Backup_full_YYYY-MM-DD-HH-MM-SS.sql
  // Format: Reporte_Diario_YYYY-MM-DD.txt
  // Format: Data_Export_YYYY-MM-DD-HH-MM-SS.json
  
  const datePatterns = [
    /(\d{4})-(\d{2})-(\d{2})-(\d{2})-(\d{2})-(\d{2})/, // Full datetime
    /(\d{4})-(\d{2})-(\d{2})/,                         // Date only
  ];
  
  for (const pattern of datePatterns) {
    const match = fileName.match(pattern);
    if (match) {
      const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
      return new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
    }
  }
  
  return null;
}

// Clean up old files in a specific folder
async function cleanupFolder(
  oauth2Client: any,
  folderId: string,
  folderName: string,
  folderType: keyof typeof RETENTION_POLICY
): Promise<{ deleted: number; kept: number; errors: number }> {
  let deleted = 0;
  let kept = 0;
  let errors = 0;
  
  try {
    // List all files in folder
    const files = await listFilesInFolder(oauth2Client, folderId);
    
    console.log(`[Backup Retention] Checking ${files.length} files in ${folderName}`);
    
    for (const file of files) {
      try {
        // Parse date from filename
        const fileDate = parseDateFromFilename(file.name);
        
        if (!fileDate) {
          console.warn(`[Backup Retention] Could not parse date from filename: ${file.name}`);
          kept++;
          continue;
        }
        
        // Check if file should be deleted
        if (shouldDeleteFile(file.name, fileDate, folderType)) {
          console.log(`[Backup Retention] Deleting old file: ${file.name} (age: ${Math.floor((Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24))} days)`);
          
          await deleteFileFromDrive(oauth2Client, file.id);
          deleted++;
          
          await createRopaLog({
            taskId: undefined,
            level: "info",
            message: `[Backup Retention] Deleted old backup: ${file.name}`,
            metadata: { folderId, folderName, fileName: file.name, fileDate: fileDate.toISOString() },
          });
        } else {
          kept++;
        }
      } catch (error) {
        console.error(`[Backup Retention] Error processing file ${file.name}:`, error);
        errors++;
      }
    }
  } catch (error) {
    console.error(`[Backup Retention] Error listing files in ${folderName}:`, error);
    errors++;
  }
  
  return { deleted, kept, errors };
}

// Execute cleanup across all backup folders
async function executeCleanup() {
  try {
    console.log("[Backup Retention] Starting automatic cleanup...");
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[Backup Retention] Starting automatic cleanup",
      metadata: { timestamp: new Date().toISOString(), retentionPolicy: RETENTION_POLICY },
    });
    
    // Get OAuth credentials from database
    const db = await getDb();
    if (!db) {
      console.warn("[Backup Retention] Database not available, skipping cleanup");
      return;
    }
    
    const tokenRecords = await db.select().from(googleDriveTokens).limit(1);
    if (tokenRecords.length === 0) {
      console.warn("[Backup Retention] Google Drive not connected, skipping cleanup");
      return;
    }
    
    const tokenRecord = tokenRecords[0];
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenRecord.accessToken,
      refresh_token: tokenRecord.refreshToken,
      expiry_date: tokenRecord.expiryDate ? new Date(tokenRecord.expiryDate).getTime() : undefined,
    });
    
    const folderIds = tokenRecord.folderIds ? JSON.parse(tokenRecord.folderIds) : {};
    
    let totalDeleted = 0;
    let totalKept = 0;
    let totalErrors = 0;
    
    // Clean up each folder type
    const cleanupTasks = [
      { folderId: folderIds.backups, folderName: "Backups", folderType: "daily" as const },
      { folderId: folderIds.exports, folderName: "Exports", folderType: "exports" as const },
      { folderId: folderIds.daily, folderName: "Daily Reports", folderType: "daily" as const },
      { folderId: folderIds.weekly, folderName: "Weekly Reports", folderType: "weekly" as const },
      { folderId: folderIds.monthly, folderName: "Monthly Reports", folderType: "monthly" as const },
    ];
    
    for (const task of cleanupTasks) {
      if (!task.folderId) {
        console.warn(`[Backup Retention] Folder ID not found for ${task.folderName}, skipping`);
        continue;
      }
      
      const result = await cleanupFolder(oauth2Client, task.folderId, task.folderName, task.folderType);
      totalDeleted += result.deleted;
      totalKept += result.kept;
      totalErrors += result.errors;
      
      console.log(`[Backup Retention] ${task.folderName}: deleted ${result.deleted}, kept ${result.kept}, errors ${result.errors}`);
    }
    
    console.log(`[Backup Retention] Cleanup completed: ${totalDeleted} deleted, ${totalKept} kept, ${totalErrors} errors`);
    
    await createRopaLog({
      taskId: undefined,
      level: "info",
      message: "[Backup Retention] Cleanup completed",
      metadata: {
        deleted: totalDeleted,
        kept: totalKept,
        errors: totalErrors,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[Backup Retention] Error during cleanup:", error);
    
    await createRopaLog({
      taskId: undefined,
      level: "error",
      message: "[Backup Retention] Cleanup error",
      metadata: { error: error instanceof Error ? error.message : String(error) },
    });
  }
}

// Schedule next cleanup
function scheduleNextCleanup() {
  const msUntilNextCleanup = getMillisecondsUntilNextCleanup();
  const nextCleanupDate = new Date(Date.now() + msUntilNextCleanup);
  
  console.log(`[Backup Retention] Next cleanup scheduled for: ${nextCleanupDate.toLocaleString()}`);
  
  cleanupInterval = setTimeout(async () => {
    await executeCleanup();
    
    // Schedule next cleanup (24 hours later)
    scheduleNextCleanup();
  }, msUntilNextCleanup);
}

// Initialize cleanup scheduler
export function initializeCleanupScheduler() {
  console.log("[Backup Retention] Initializing automatic cleanup scheduler...");
  console.log(`[Backup Retention] Retention policy: Daily=${RETENTION_POLICY.daily}d, Weekly=${RETENTION_POLICY.weekly}d, Monthly=${RETENTION_POLICY.monthly}d, Exports=${RETENTION_POLICY.exports}d`);
  
  // Schedule first cleanup
  scheduleNextCleanup();
  
  // Log initialization
  createRopaLog({
    taskId: undefined,
    level: "info",
    message: "[Backup Retention] Automatic cleanup scheduler initialized",
    metadata: {
      cleanupTime: `${CLEANUP_HOUR.toString().padStart(2, "0")}:${CLEANUP_MINUTE.toString().padStart(2, "0")}`,
      nextCleanup: new Date(Date.now() + getMillisecondsUntilNextCleanup()).toISOString(),
      retentionPolicy: RETENTION_POLICY,
    },
  });
  
  console.log("[Backup Retention] ✅ Automatic cleanup enabled");
}

// Stop cleanup scheduler (for graceful shutdown)
export function stopCleanupScheduler() {
  if (cleanupInterval) {
    clearTimeout(cleanupInterval);
    cleanupInterval = null;
    console.log("[Backup Retention] Cleanup scheduler stopped");
  }
}

// Manual cleanup trigger (for testing or on-demand cleanup)
export async function triggerManualCleanup(): Promise<{ success: boolean; deleted: number; kept: number; errors: number }> {
  console.log("[Backup Retention] Manual cleanup triggered");
  
  await createRopaLog({
    taskId: undefined,
    level: "info",
    message: "[Backup Retention] Manual cleanup triggered",
    metadata: { timestamp: new Date().toISOString() },
  });
  
  await executeCleanup();
  
  return { success: true, deleted: 0, kept: 0, errors: 0 };
}
