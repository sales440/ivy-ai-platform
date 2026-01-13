import { google, Auth } from 'googleapis';
import { Readable } from 'stream';

type OAuth2Client = Auth.OAuth2Client;

// OAuth credentials from Google Cloud Console
const GOOGLE_CLIENT_ID = '845210461598-10r61sdcqdv54rbr6rh08qb58hqdso4.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = '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';
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://upbeat-creativity-production-27ac.up.railway.app/api/google/callback'
  : 'http://localhost:3000/api/google/callback';

// Folder structure in Google Drive
const DRIVE_FOLDERS = {
  ROOT: 'Ivy.AI - FAGOR',
  DATABASES: 'Databases',
  BACKUPS: 'Backups',
  EXPORTS: 'Exports',
  REPORTS: 'Reportes',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  TEMPLATES: 'Templates',
  EMAIL_TEMPLATES: 'Email Templates',
  CALL_SCRIPTS: 'Call Scripts',
  SMS_TEMPLATES: 'SMS Templates',
  CAMPAIGNS: 'Campañas',
  BRANDING: 'Logos & Branding',
  CLIENT_LISTS: 'Client Lists',
};

// Initialize OAuth2 client
export function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI
  );
}

// Generate authorization URL
export function getAuthUrl(): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
    ],
    prompt: 'consent',
  });
}

// Exchange authorization code for tokens
export async function getTokensFromCode(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

// Set credentials from stored tokens
export function setCredentials(oauth2Client: OAuth2Client, tokens: any) {
  oauth2Client.setCredentials(tokens);
}

// Get or create folder by name
async function getOrCreateFolder(
  drive: any,
  folderName: string,
  parentId?: string
): Promise<string> {
  try {
    // Search for existing folder
    const query = parentId
      ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id!;
    }

    // Create folder if it doesn't exist
    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentId) {
      fileMetadata.parents = [parentId];
    }

    const folder = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
    });

    return folder.data.id!;
  } catch (error) {
    console.error(`[Google Drive] Error creating folder ${folderName}:`, error);
    throw error;
  }
}

// Initialize folder structure
export async function initializeFolderStructure(oauth2Client: OAuth2Client): Promise<Record<string, string>> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    // Create root folder
    const rootId = await getOrCreateFolder(drive, DRIVE_FOLDERS.ROOT);

    // Create main folders
    const databasesId = await getOrCreateFolder(drive, DRIVE_FOLDERS.DATABASES, rootId);
    const reportsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.REPORTS, rootId);
    const templatesId = await getOrCreateFolder(drive, DRIVE_FOLDERS.TEMPLATES, rootId);
    const campaignsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.CAMPAIGNS, rootId);
    const brandingId = await getOrCreateFolder(drive, DRIVE_FOLDERS.BRANDING, rootId);
    const clientListsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.CLIENT_LISTS, rootId);

    // Create subfolders
    const backupsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.BACKUPS, databasesId);
    const exportsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.EXPORTS, databasesId);
    
    const dailyId = await getOrCreateFolder(drive, DRIVE_FOLDERS.DAILY, reportsId);
    const weeklyId = await getOrCreateFolder(drive, DRIVE_FOLDERS.WEEKLY, reportsId);
    const monthlyId = await getOrCreateFolder(drive, DRIVE_FOLDERS.MONTHLY, reportsId);

    const emailTemplatesId = await getOrCreateFolder(drive, DRIVE_FOLDERS.EMAIL_TEMPLATES, templatesId);
    const callScriptsId = await getOrCreateFolder(drive, DRIVE_FOLDERS.CALL_SCRIPTS, templatesId);
    const smsTemplatesId = await getOrCreateFolder(drive, DRIVE_FOLDERS.SMS_TEMPLATES, templatesId);

    console.log('[Google Drive] Folder structure initialized successfully');

    return {
      root: rootId,
      databases: databasesId,
      backups: backupsId,
      exports: exportsId,
      reports: reportsId,
      daily: dailyId,
      weekly: weeklyId,
      monthly: monthlyId,
      templates: templatesId,
      emailTemplates: emailTemplatesId,
      callScripts: callScriptsId,
      smsTemplates: smsTemplatesId,
      campaigns: campaignsId,
      branding: brandingId,
      clientLists: clientListsId,
    };
  } catch (error) {
    console.error('[Google Drive] Error initializing folder structure:', error);
    throw error;
  }
}

// Upload file to Google Drive
export async function uploadFileToDrive(
  oauth2Client: OAuth2Client,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  folderId: string
): Promise<{ id: string; webViewLink: string }> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, webViewLink',
    });

    console.log(`[Google Drive] File uploaded: ${fileName} (${response.data.id})`);

    return {
      id: response.data.id!,
      webViewLink: response.data.webViewLink!,
    };
  } catch (error) {
    console.error(`[Google Drive] Error uploading file ${fileName}:`, error);
    throw error;
  }
}

// List files in folder
export async function listFilesInFolder(
  oauth2Client: OAuth2Client,
  folderId: string
): Promise<Array<{ id: string; name: string; mimeType: string; createdTime: string }>> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, createdTime)',
      orderBy: 'createdTime desc',
    });

    const files = response.data.files || [];
    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      createdTime: file.createdTime!,
    }));
  } catch (error) {
    console.error('[Google Drive] Error listing files:', error);
    throw error;
  }
}

// Delete file from Google Drive
export async function deleteFileFromDrive(
  oauth2Client: OAuth2Client,
  fileId: string
): Promise<void> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    await drive.files.delete({
      fileId,
    });

    console.log(`[Google Drive] File deleted: ${fileId}`);
  } catch (error) {
    console.error(`[Google Drive] Error deleting file ${fileId}:`, error);
    throw error;
  }
}

// Download file from Google Drive
export async function downloadFileFromDrive(
  oauth2Client: OAuth2Client,
  fileId: string
): Promise<Buffer> {
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      { responseType: 'arraybuffer' }
    );

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error(`[Google Drive] Error downloading file ${fileId}:`, error);
    throw error;
  }
}
