import { getDb } from "./db";
import { googleDriveTokens } from "../drizzle/schema";
import { getOAuth2Client, setCredentials, uploadFileToDrive } from "./google-drive";

/**
 * Automatic sync service for uploading files to Google Drive
 * Used by ROPA for automatic report and backup uploads
 */

// Get OAuth client with stored credentials
async function getAuthenticatedClient() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(googleDriveTokens).limit(1);
  if (result.length === 0) {
    throw new Error("Google Drive not connected");
  }

  const tokenRecord = result[0];
  const oauth2Client = getOAuth2Client();
  
  setCredentials(oauth2Client, {
    access_token: tokenRecord.accessToken,
    refresh_token: tokenRecord.refreshToken,
    expiry_date: tokenRecord.expiryDate?.getTime(),
    scope: tokenRecord.scope,
    token_type: tokenRecord.tokenType,
  });

  const folderIds = JSON.parse(tokenRecord.folderIds || "{}");

  return { oauth2Client, folderIds };
}

// Upload ROPA daily report to Google Drive
export async function uploadDailyReport(reportContent: string, date: Date): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `Reporte_Diario_${date.toISOString().split("T")[0]}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.daily
    );

    console.log(`[Google Drive Sync] Daily report uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload daily report:", error);
    return null;
  }
}

// Upload ROPA weekly report to Google Drive
export async function uploadWeeklyReport(reportContent: string, weekStart: Date): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `Reporte_Semanal_${weekStart.toISOString().split("T")[0]}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.weekly
    );

    console.log(`[Google Drive Sync] Weekly report uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload weekly report:", error);
    return null;
  }
}

// Upload ROPA monthly report to Google Drive
export async function uploadMonthlyReport(reportContent: string, month: Date): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const monthStr = month.toISOString().slice(0, 7); // YYYY-MM
    const fileName = `Reporte_Mensual_${monthStr}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.monthly
    );

    console.log(`[Google Drive Sync] Monthly report uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload monthly report:", error);
    return null;
  }
}

// Upload campaign report to Google Drive
export async function uploadCampaignReport(
  campaignName: string,
  reportContent: string
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `Campaña_${campaignName}_${timestamp}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.campaigns
    );

    console.log(`[Google Drive Sync] Campaign report uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload campaign report:", error);
    return null;
  }
}

// Upload database backup to Google Drive
export async function uploadDatabaseBackup(
  backupContent: string,
  backupType: "full" | "incremental" = "full"
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `DB_Backup_${backupType}_${timestamp}.sql`;
    const fileBuffer = Buffer.from(backupContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "application/sql",
      folderIds.backups
    );

    console.log(`[Google Drive Sync] Database backup uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload database backup:", error);
    return null;
  }
}

// Upload data export to Google Drive
export async function uploadDataExport(
  exportName: string,
  exportContent: string,
  format: "json" | "csv" | "xlsx" = "json"
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${exportName}_${timestamp}.${format}`;
    const fileBuffer = Buffer.from(exportContent, "utf-8");
    
    const mimeTypes = {
      json: "application/json",
      csv: "text/csv",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      mimeTypes[format],
      folderIds.exports
    );

    console.log(`[Google Drive Sync] Data export uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload data export:", error);
    return null;
  }
}

// Upload email template to Google Drive
export async function uploadEmailTemplate(
  templateName: string,
  templateContent: string
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `${templateName}.html`;
    const fileBuffer = Buffer.from(templateContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/html",
      folderIds.emailTemplates
    );

    console.log(`[Google Drive Sync] Email template uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload email template:", error);
    return null;
  }
}

// Upload call script to Google Drive
export async function uploadCallScript(
  scriptName: string,
  scriptContent: string
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `${scriptName}.txt`;
    const fileBuffer = Buffer.from(scriptContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.callScripts
    );

    console.log(`[Google Drive Sync] Call script uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload call script:", error);
    return null;
  }
}

// Upload SMS template to Google Drive
export async function uploadSMSTemplate(
  templateName: string,
  templateContent: string
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `${templateName}.txt`;
    const fileBuffer = Buffer.from(templateContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds.smsTemplates
    );

    console.log(`[Google Drive Sync] SMS template uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload SMS template:", error);
    return null;
  }
}

// Upload logo/branding file to Google Drive
export async function uploadBrandingFile(
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      mimeType,
      folderIds.branding
    );

    console.log(`[Google Drive Sync] Branding file uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload branding file:", error);
    return null;
  }
}

// Upload client list to Google Drive
export async function uploadClientList(
  listName: string,
  fileBuffer: Buffer,
  format: "xlsx" | "csv" | "pdf"
): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const timestamp = new Date().toISOString().split("T")[0];
    const fileName = `${listName}_${timestamp}.${format}`;
    
    const mimeTypes = {
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      csv: "text/csv",
      pdf: "application/pdf",
    };
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      mimeTypes[format],
      folderIds.clientLists
    );

    console.log(`[Google Drive Sync] Client list uploaded: ${fileName}`);
    return result.webViewLink;
  } catch (error) {
    console.error("[Google Drive Sync] Failed to upload client list:", error);
    return null;
  }
}

// Check if Google Drive is connected
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const result = await db.select().from(googleDriveTokens).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error("[Google Drive Sync] Error checking connection:", error);
    return false;
  }
}
