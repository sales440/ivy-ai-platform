import { getDb } from "./db";
import { googleDriveTokens } from "../drizzle/schema";
import { getOAuth2Client, setCredentials, uploadFileToDrive, initializeFolderStructure } from "./google-drive";

/**
 * Automatic sync service for uploading files to Google Drive
 * Used by ROPA for automatic report and backup uploads
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

/**
 * Create complete folder structure in Google Drive
 */
export async function createFolderStructure(): Promise<{ success: boolean; folders: string[]; error?: string }> {
  try {
    const { oauth2Client } = await getAuthenticatedClient();
    
    // Use existing initializeFolderStructure function
    const folderIds = await initializeFolderStructure(oauth2Client);
    
    // Save folder IDs to database
    const db = await getDb();
    if (db) {
      await db.update(googleDriveTokens)
        .set({ folderIds: JSON.stringify(folderIds) });
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

// Check if Google Drive is connected
export async function isGoogleDriveConnected(): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;
    const result = await db.select().from(googleDriveTokens).limit(1);
    return result.length > 0;
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
      folderIds["Reportes/Daily"]
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
      folderIds["weekly"]
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
      folderIds["monthly"]
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
      folderIds["campaigns"]
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
      folderIds["Databases/Backups"]
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
    
    const folderMap = {
      email: "Templates/Email Templates",
      call: "Templates/Call Scripts",
      sms: "Templates/SMS Templates"
    };
    
    const fileBuffer = Buffer.from(templateContent, "utf-8");
    
    const result = await uploadFileToDrive(
      oauth2Client,
      filename,
      fileBuffer,
      "text/plain",
      folderIds[folderMap[type]]
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
      folderIds["Logos & Branding"]
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
      folderIds["Client Lists"]
    );
    
    return result.webViewLink || null;
  } catch (error) {
    console.error("[Google Drive] Failed to upload client list:", error);
    return null;
  }
}
