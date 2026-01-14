import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { getOAuth2Client, setCredentials, uploadFileToDrive, initializeFolderStructure } from "./google-drive";

/**
 * Automatic sync service for uploading files to Google Drive
 * Used by ROPA for automatic report and backup uploads
 * 
 * FIXED: Using raw SQL to avoid Drizzle ORM column mapping issues
 */

// Folder structure definition
const FOLDER_STRUCTURE = {
  root: "Ivy.AI - FAGOR",
  children: [
    {
      name: "Databases",
      children: ["Backups", "Exports"]
    },
    {
      name: "Reportes",
      children: ["Daily", "Weekly", "Monthly"]
    },
    {
      name: "Templates",
      children: ["Email Templates", "Call Scripts", "SMS Templates"]
    },
    {
      name: "Campañas",
      children: []
    },
    {
      name: "Logos & Branding",
      children: []
    },
    {
      name: "Client Lists",
      children: []
    }
  ]
};

// Get OAuth client with stored credentials using RAW SQL
async function getAuthenticatedClient() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Use raw SQL to avoid column mapping issues
  const result = await db.execute(sql`
    SELECT 
      id,
      user_id,
      access_token,
      refresh_token,
      expiry_date,
      scope,
      token_type,
      folder_ids
    FROM google_drive_tokens 
    LIMIT 1
  `);

  const rows = result as any[];
  if (!rows || rows.length === 0) {
    throw new Error("Google Drive not connected");
  }

  const tokenRecord = rows[0];
  const oauth2Client = getOAuth2Client();
  
  setCredentials(oauth2Client, {
    access_token: tokenRecord.access_token,
    refresh_token: tokenRecord.refresh_token,
    expiry_date: tokenRecord.expiry_date ? new Date(tokenRecord.expiry_date).getTime() : undefined,
    scope: tokenRecord.scope,
    token_type: tokenRecord.token_type || 'Bearer',
  });

  const folderIds = JSON.parse(tokenRecord.folder_ids || "{}");

  return { oauth2Client, folderIds };
}

/**
 * Create complete folder structure in Google Drive
 */
export async function createFolderStructure(): Promise<{ success: boolean; folders: string[]; error?: string }> {
  try {
    const { oauth2Client } = await getAuthenticatedClient();
    
    // Use existing initializeFolderStructure function
    const folderIds = await initializeFolderStructure(oauth2Client);
    
    // Save folder IDs to database using raw SQL
    const db = await getDb();
    if (db) {
      const folderIdsJson = JSON.stringify(folderIds);
      await db.execute(sql`
        UPDATE google_drive_tokens 
        SET folder_ids = ${folderIdsJson}, updated_at = NOW()
      `);
    }

    const createdFolders = [
      `📁 Ivy.AI - FAGOR/`,
      `  ├── 📁 Databases/`,
      `  │   ├── 📁 Backups/`,
      `  │   └── 📁 Exports/`,
      `  ├── 📁 Reportes/`,
      `  │   ├── 📁 Daily/`,
      `  │   ├── 📁 Weekly/`,
      `  │   └── 📁 Monthly/`,
      `  ├── 📁 Templates/`,
      `  │   ├── 📁 Email Templates/`,
      `  │   ├── 📁 Call Scripts/`,
      `  │   └── 📁 SMS Templates/`,
      `  ├── 📁 Campañas/`,
      `  ├── 📁 Logos & Branding/`,
      `  └── 📁 Client Lists/`
    ];

    return { success: true, folders: createdFolders };
  } catch (error: any) {
    return { success: false, folders: [], error: error.message };
  }
}

// Check if Google Drive is connected using RAW SQL
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    
    const result = await db.execute(sql`
      SELECT id FROM google_drive_tokens LIMIT 1
    `);
    
    const rows = result as any[];
    return rows && rows.length > 0;
  } catch (error) {
    return false;
  }
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
      folderIds["Reportes/Daily"] || folderIds["daily"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload daily report:", error);
    return null;
  }
}

// Upload weekly report to Google Drive
export async function uploadWeeklyReport(reportContent: string, date: Date): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `Reporte_Semanal_${date.toISOString().split("T")[0]}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds["Reportes/Weekly"] || folderIds["weekly"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload weekly report:", error);
    return null;
  }
}

// Upload monthly report to Google Drive
export async function uploadMonthlyReport(reportContent: string, date: Date): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `Reporte_Mensual_${date.toISOString().split("T")[0]}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds["Reportes/Monthly"] || folderIds["monthly"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload monthly report:", error);
    return null;
  }
}

// Upload campaign report to Google Drive
export async function uploadCampaignReport(campaignName: string, reportContent: string): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const fileName = `${campaignName}_Report_${new Date().toISOString().split("T")[0]}.txt`;
    const fileBuffer = Buffer.from(reportContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      fileName,
      fileBuffer,
      "text/plain",
      folderIds["Campañas"] || folderIds["campaigns"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload campaign report:", error);
    return null;
  }
}

// Upload database backup to Google Drive
export async function uploadDatabaseBackup(backupBuffer: Buffer, filename: string): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const result = await uploadFileToDrive(
      oauth2Client,
      filename,
      backupBuffer,
      "application/sql",
      folderIds["Databases/Backups"] || folderIds["backups"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload database backup:", error);
    return null;
  }
}

// Upload template to Google Drive
export async function uploadTemplate(templateContent: string, filename: string, type: "email" | "call" | "sms"): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const folderMap: Record<string, string> = {
      email: "Templates/Email Templates",
      call: "Templates/Call Scripts",
      sms: "Templates/SMS Templates"
    };
    
    const fileBuffer = Buffer.from(templateContent, "utf-8");
    
    const targetFolder = folderIds[folderMap[type]] || folderIds["emailTemplates"];
    
    const result = await uploadFileToDrive(
      oauth2Client,
      filename,
      fileBuffer,
      "text/plain",
      targetFolder
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload template:", error);
    return null;
  }
}

// Upload branding asset to Google Drive
export async function uploadBrandingAsset(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const result = await uploadFileToDrive(
      oauth2Client,
      filename,
      fileBuffer,
      mimeType,
      folderIds["Logos & Branding"] || folderIds["branding"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload branding asset:", error);
    return null;
  }
}

// Upload client list to Google Drive
export async function uploadClientList(fileBuffer: Buffer, filename: string, mimeType: string): Promise<string | null> {
  try {
    const { oauth2Client, folderIds } = await getAuthenticatedClient();
    
    const result = await uploadFileToDrive(
      oauth2Client,
      filename,
      fileBuffer,
      mimeType,
      folderIds["Client Lists"] || folderIds["clientLists"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload client list:", error);
    return null;
  }
}
