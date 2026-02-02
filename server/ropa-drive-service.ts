/**
 * ROPA Google Drive Service
 * Provides ROPA with access to read and process files from Google Drive
 */

import mysql from 'mysql2/promise';
import { google } from 'googleapis';
import { getOAuth2Client, setCredentials, downloadFileFromDrive, listFilesInFolder } from './google-drive';
import * as XLSX from 'xlsx';

// Get raw MySQL connection
async function getRawConnection(): Promise<mysql.Connection> {
  return mysql.createConnection(process.env.DATABASE_URL || '');
}

// Get Google Drive OAuth client with stored tokens
async function getAuthenticatedClient(): Promise<any | null> {
  let connection: mysql.Connection | null = null;
  try {
    connection = await getRawConnection();
    
    const [rows] = await connection.execute(
      "SELECT access_token, refresh_token, expiry_date, scope, token_type, folder_ids FROM google_drive_tokens LIMIT 1"
    ) as [any[], any];
    
    if (rows.length === 0) {
      console.log('[ROPA Drive] No Google Drive tokens found');
      return null;
    }

    const tokenRecord = rows[0];
    const oauth2Client = getOAuth2Client();
    setCredentials(oauth2Client, {
      access_token: tokenRecord.access_token,
      refresh_token: tokenRecord.refresh_token,
      expiry_date: tokenRecord.expiry_date,
      scope: tokenRecord.scope,
      token_type: tokenRecord.token_type,
    });

    const folderIds = typeof tokenRecord.folder_ids === 'string' 
      ? JSON.parse(tokenRecord.folder_ids) 
      : (tokenRecord.folder_ids || {});

    return { oauth2Client, folderIds };
  } catch (error) {
    console.error('[ROPA Drive] Error getting authenticated client:', error);
    return null;
  } finally {
    if (connection) await connection.end();
  }
}

// List all files in all Ivy.AI folders
export async function listAllFiles(): Promise<{
  success: boolean;
  files: Array<{
    id: string;
    name: string;
    folder: string;
    mimeType: string;
    createdTime: string;
  }>;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, files: [], error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const allFiles: Array<{
      id: string;
      name: string;
      folder: string;
      mimeType: string;
      createdTime: string;
    }> = [];

    // List files from each folder
    const folderNames: Record<string, string> = {
      branding: 'Logos & Branding',
      emailTemplates: 'Email Templates',
      callScripts: 'Call Scripts',
      smsTemplates: 'SMS Templates',
      campaigns: 'Campañas',
      clientLists: 'Client Lists',
      exports: 'Exports',
      backups: 'Backups',
    };

    for (const [key, displayName] of Object.entries(folderNames)) {
      const folderId = folderIds[key];
      if (folderId) {
        try {
          const files = await listFilesInFolder(oauth2Client, folderId);
          files.forEach(file => {
            allFiles.push({
              ...file,
              folder: displayName,
            });
          });
        } catch (e) {
          console.log(`[ROPA Drive] Could not list files in ${displayName}`);
        }
      }
    }

    console.log(`[ROPA Drive] Listed ${allFiles.length} files from Google Drive`);
    return { success: true, files: allFiles };
  } catch (error: any) {
    console.error('[ROPA Drive] Error listing files:', error);
    return { success: false, files: [], error: error.message };
  }
}

// Get file content by ID
export async function getFileContent(fileId: string): Promise<{
  success: boolean;
  content?: string;
  data?: any;
  mimeType?: string;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client } = auth;
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Get file metadata first
    const metadata = await drive.files.get({
      fileId,
      fields: 'name, mimeType',
    });

    const mimeType = metadata.data.mimeType || '';
    const fileName = metadata.data.name || '';

    // Download file content
    const buffer = await downloadFileFromDrive(oauth2Client, fileId);

    // Process based on file type
    if (mimeType.includes('spreadsheet') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      // Excel file - parse and extract data
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const data: Record<string, any[]> = {};
      
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        data[sheetName] = XLSX.utils.sheet_to_json(sheet);
      });

      return {
        success: true,
        mimeType,
        data,
        content: `Excel file with ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`,
      };
    } else if (mimeType.includes('csv') || fileName.endsWith('.csv')) {
      // CSV file
      const content = buffer.toString('utf-8');
      const lines = content.split('\n');
      const headers = lines[0]?.split(',') || [];
      
      return {
        success: true,
        mimeType,
        content,
        data: {
          headers,
          rowCount: lines.length - 1,
          preview: lines.slice(0, 10).join('\n'),
        },
      };
    } else if (mimeType.includes('text') || mimeType.includes('json') || fileName.endsWith('.txt') || fileName.endsWith('.json')) {
      // Text or JSON file
      const content = buffer.toString('utf-8');
      return {
        success: true,
        mimeType,
        content,
        data: mimeType.includes('json') ? JSON.parse(content) : null,
      };
    } else if (mimeType.includes('image')) {
      // Image file - return base64
      const base64 = buffer.toString('base64');
      return {
        success: true,
        mimeType,
        content: `data:${mimeType};base64,${base64}`,
        data: { type: 'image', size: buffer.length },
      };
    } else if (mimeType.includes('pdf')) {
      // PDF file - return info (full parsing would require additional library)
      return {
        success: true,
        mimeType,
        content: `PDF file (${buffer.length} bytes)`,
        data: { type: 'pdf', size: buffer.length },
      };
    } else if (mimeType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      // Word document - return info
      return {
        success: true,
        mimeType,
        content: `Word document (${buffer.length} bytes)`,
        data: { type: 'word', size: buffer.length },
      };
    } else {
      // Unknown type
      return {
        success: true,
        mimeType,
        content: `File (${buffer.length} bytes)`,
        data: { type: 'unknown', size: buffer.length },
      };
    }
  } catch (error: any) {
    console.error('[ROPA Drive] Error getting file content:', error);
    return { success: false, error: error.message };
  }
}

// Search files by name
export async function searchFiles(query: string): Promise<{
  success: boolean;
  files: Array<{
    id: string;
    name: string;
    folder: string;
    mimeType: string;
  }>;
  error?: string;
}> {
  try {
    const result = await listAllFiles();
    if (!result.success) {
      return { success: false, files: [], error: result.error };
    }

    const queryLower = query.toLowerCase();
    const matchingFiles = result.files.filter(file => 
      file.name.toLowerCase().includes(queryLower) ||
      file.folder.toLowerCase().includes(queryLower)
    );

    return { success: true, files: matchingFiles };
  } catch (error: any) {
    console.error('[ROPA Drive] Error searching files:', error);
    return { success: false, files: [], error: error.message };
  }
}

// Get client list data from Excel/CSV files
export async function getClientListData(fileId: string): Promise<{
  success: boolean;
  clients?: Array<Record<string, any>>;
  headers?: string[];
  totalCount?: number;
  error?: string;
}> {
  try {
    const result = await getFileContent(fileId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.data && typeof result.data === 'object') {
      // Excel file with multiple sheets
      if (result.mimeType?.includes('spreadsheet')) {
        const sheets = result.data as Record<string, any[]>;
        const firstSheetName = Object.keys(sheets)[0];
        const clients = sheets[firstSheetName] || [];
        const headers = clients.length > 0 ? Object.keys(clients[0]) : [];
        
        return {
          success: true,
          clients,
          headers,
          totalCount: clients.length,
        };
      }
      
      // CSV file
      if (result.data.headers) {
        return {
          success: true,
          headers: result.data.headers,
          totalCount: result.data.rowCount,
          clients: [],
        };
      }
    }

    return { success: false, error: 'Formato de archivo no soportado para lista de clientes' };
  } catch (error: any) {
    console.error('[ROPA Drive] Error getting client list data:', error);
    return { success: false, error: error.message };
  }
}

// Get summary of all files for ROPA context
export async function getFilesSummary(): Promise<string> {
  try {
    const result = await listAllFiles();
    if (!result.success) {
      return `No se pudo acceder a Google Drive: ${result.error}`;
    }

    if (result.files.length === 0) {
      return 'No hay archivos en Google Drive.';
    }

    // Group files by folder
    const byFolder: Record<string, string[]> = {};
    result.files.forEach(file => {
      if (!byFolder[file.folder]) {
        byFolder[file.folder] = [];
      }
      byFolder[file.folder].push(file.name);
    });

    let summary = `Archivos disponibles en Google Drive (${result.files.length} total):\n`;
    for (const [folder, files] of Object.entries(byFolder)) {
      summary += `\n${folder} (${files.length} archivos):\n`;
      files.slice(0, 5).forEach(f => {
        summary += `  - ${f}\n`;
      });
      if (files.length > 5) {
        summary += `  ... y ${files.length - 5} más\n`;
      }
    }

    return summary;
  } catch (error: any) {
    return `Error al obtener resumen de archivos: ${error.message}`;
  }
}

export default {
  listAllFiles,
  getFileContent,
  searchFiles,
  getClientListData,
  getFilesSummary,
};
