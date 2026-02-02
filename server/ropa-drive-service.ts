/**
 * ROPA Google Drive Service
 * Provides ROPA with full access to manage files and folders in Google Drive
 */

import mysql from 'mysql2/promise';
import { google } from 'googleapis';
import { 
  getOAuth2Client, 
  setCredentials, 
  downloadFileFromDrive, 
  listFilesInFolder,
  listSubfolders,
  getFolderTree,
  createFolder as createDriveFolder,
  deleteFolder as deleteDriveFolder,
  moveFile as moveDriveFile,
  copyFile as copyDriveFile,
  getFolderByName,
  createClientFolderStructure as createClientFolders,
} from './google-drive';
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
      root: 'Ivy.AI - FAGOR',
      branding: 'Logos & Branding',
      emailTemplates: 'Email Templates',
      callScripts: 'Call Scripts',
      smsTemplates: 'SMS Templates',
      campaigns: 'Campañas',
      clientLists: 'Client Lists',
      exports: 'Exports',
      backups: 'Backups',
      reports: 'Reportes',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      templates: 'Templates',
      databases: 'Databases',
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

// List subfolders in a specific folder
export async function listFolderContents(folderId?: string): Promise<{
  success: boolean;
  folders: Array<{ id: string; name: string; createdTime: string }>;
  files: Array<{ id: string; name: string; mimeType: string; createdTime: string }>;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, folders: [], files: [], error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const targetFolderId = folderId || folderIds.root;

    if (!targetFolderId) {
      return { success: false, folders: [], files: [], error: 'No se encontró la carpeta raíz' };
    }

    const subfolders = await listSubfolders(oauth2Client, targetFolderId);
    const files = await listFilesInFolder(oauth2Client, targetFolderId);
    
    // Filter out folders from files (they're already in subfolders)
    const actualFiles = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');

    return { success: true, folders: subfolders, files: actualFiles };
  } catch (error: any) {
    console.error('[ROPA Drive] Error listing folder contents:', error);
    return { success: false, folders: [], files: [], error: error.message };
  }
}

// Get full folder tree structure
export async function getFullFolderTree(depth: number = 3): Promise<{
  success: boolean;
  tree?: any;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const rootId = folderIds.root;

    if (!rootId) {
      return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI' };
    }

    const tree = await getFolderTree(oauth2Client, rootId, depth);
    return { success: true, tree };
  } catch (error: any) {
    console.error('[ROPA Drive] Error getting folder tree:', error);
    return { success: false, error: error.message };
  }
}

// Create a new folder
export async function createFolder(folderName: string, parentFolderIdOrName?: string): Promise<{
  success: boolean;
  folder?: { id: string; name: string; webViewLink: string };
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    
    // Determine parent folder ID
    let parentId = folderIds.root;
    if (parentFolderIdOrName) {
      // Check if it's a known folder key
      if (folderIds[parentFolderIdOrName]) {
        parentId = folderIds[parentFolderIdOrName];
      } else if (parentFolderIdOrName.length > 20) {
        // Looks like a folder ID
        parentId = parentFolderIdOrName;
      } else {
        // Try to find folder by name
        const found = await getFolderByName(oauth2Client, parentFolderIdOrName, folderIds.root);
        if (found) {
          parentId = found.id;
        }
      }
    }

    const folder = await createDriveFolder(oauth2Client, folderName, parentId);
    console.log(`[ROPA Drive] Created folder: ${folderName}`);
    return { success: true, folder };
  } catch (error: any) {
    console.error('[ROPA Drive] Error creating folder:', error);
    return { success: false, error: error.message };
  }
}

// Delete a folder
export async function deleteFolder(folderIdOrName: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    
    let folderId = folderIdOrName;
    if (folderIdOrName.length < 20) {
      // Try to find folder by name
      const found = await getFolderByName(oauth2Client, folderIdOrName, folderIds.root);
      if (found) {
        folderId = found.id;
      } else {
        return { success: false, error: `No se encontró la carpeta: ${folderIdOrName}` };
      }
    }

    await deleteDriveFolder(oauth2Client, folderId);
    console.log(`[ROPA Drive] Deleted folder: ${folderIdOrName}`);
    return { success: true };
  } catch (error: any) {
    console.error('[ROPA Drive] Error deleting folder:', error);
    return { success: false, error: error.message };
  }
}

// Move a file to a different folder
export async function moveFile(fileId: string, destinationFolderIdOrName: string): Promise<{
  success: boolean;
  file?: { id: string; name: string; parents: string[] };
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    
    // Determine destination folder ID
    let destFolderId = destinationFolderIdOrName;
    if (folderIds[destinationFolderIdOrName]) {
      destFolderId = folderIds[destinationFolderIdOrName];
    } else if (destinationFolderIdOrName.length < 20) {
      // Try to find folder by name
      const found = await getFolderByName(oauth2Client, destinationFolderIdOrName, folderIds.root);
      if (found) {
        destFolderId = found.id;
      } else {
        return { success: false, error: `No se encontró la carpeta destino: ${destinationFolderIdOrName}` };
      }
    }

    const file = await moveDriveFile(oauth2Client, fileId, destFolderId);
    console.log(`[ROPA Drive] Moved file: ${fileId} to ${destinationFolderIdOrName}`);
    return { success: true, file };
  } catch (error: any) {
    console.error('[ROPA Drive] Error moving file:', error);
    return { success: false, error: error.message };
  }
}

// Copy a file to a different folder
export async function copyFile(fileId: string, destinationFolderIdOrName: string, newFileName?: string): Promise<{
  success: boolean;
  file?: { id: string; name: string; webViewLink: string };
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    
    // Determine destination folder ID
    let destFolderId = destinationFolderIdOrName;
    if (folderIds[destinationFolderIdOrName]) {
      destFolderId = folderIds[destinationFolderIdOrName];
    } else if (destinationFolderIdOrName.length < 20) {
      // Try to find folder by name
      const found = await getFolderByName(oauth2Client, destinationFolderIdOrName, folderIds.root);
      if (found) {
        destFolderId = found.id;
      } else {
        return { success: false, error: `No se encontró la carpeta destino: ${destinationFolderIdOrName}` };
      }
    }

    const file = await copyDriveFile(oauth2Client, fileId, destFolderId, newFileName);
    console.log(`[ROPA Drive] Copied file: ${fileId} to ${destinationFolderIdOrName}`);
    return { success: true, file };
  } catch (error: any) {
    console.error('[ROPA Drive] Error copying file:', error);
    return { success: false, error: error.message };
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

// Helper function to format folder tree
function formatTree(node: any, indent: string = ''): string {
  let output = `${indent}📁 ${node.name}\n`;
  
  // List subfolders
  for (const subfolder of node.subfolders || []) {
    output += formatTree(subfolder, indent + '  ');
  }
  
  // List files (max 3 per folder)
  const files = node.files || [];
  files.slice(0, 3).forEach((file: any) => {
    output += `${indent}  📄 ${file.name}\n`;
  });
  if (files.length > 3) {
    output += `${indent}  ... y ${files.length - 3} archivos más\n`;
  }
  
  return output;
}

// Get folder tree as formatted string for display
export async function getFolderTreeSummary(): Promise<string> {
  try {
    const result = await getFullFolderTree(3);
    if (!result.success || !result.tree) {
      return `No se pudo obtener la estructura de carpetas: ${result.error}`;
    }

    return formatTree(result.tree);
  } catch (error: any) {
    return `Error al obtener estructura de carpetas: ${error.message}`;
  }
}

// Create complete client folder structure in Google Drive
export async function createClientFolderStructure(
  clientId: string,
  clientName: string
): Promise<{
  success: boolean;
  clientFolderId?: string;
  folderIds?: Record<string, string>;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds.root;

    if (!rootFolderId) {
      return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI' };
    }

    const result = await createClientFolders(oauth2Client, clientId, clientName, rootFolderId);

    return {
      success: true,
      clientFolderId: result.clientFolderId,
      folderIds: result.folderIds,
    };
  } catch (error: any) {
    console.error('[ROPA Drive] Error creating client folder structure:', error);
    return { success: false, error: error.message };
  }
}

// Get client folder by ID
export async function getClientFolder(clientId: string): Promise<{
  success: boolean;
  folder?: { id: string; name: string };
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds.root;

    if (!rootFolderId) {
      return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI' };
    }

    // Find Clientes folder
    const clientesFolder = await getFolderByName(oauth2Client, 'Clientes', rootFolderId);
    if (!clientesFolder) {
      return { success: false, error: 'No se encontró la carpeta Clientes' };
    }

    // Search for client folder by ID prefix
    const subfolders = await listSubfolders(oauth2Client, clientesFolder.id);
    const clientFolder = subfolders.find(f => f.name.startsWith(clientId));

    if (!clientFolder) {
      return { success: false, error: `No se encontró carpeta para cliente ${clientId}` };
    }

    return {
      success: true,
      folder: { id: clientFolder.id, name: clientFolder.name },
    };
  } catch (error: any) {
    console.error('[ROPA Drive] Error getting client folder:', error);
    return { success: false, error: error.message };
  }
}

// Navigate to specific client subfolder
export async function getClientSubfolder(
  clientId: string,
  subfolderPath: string // e.g., "Emails/Borradores" or "Reportes/Campañas"
): Promise<{
  success: boolean;
  folder?: { id: string; name: string; path: string };
  files?: Array<{ id: string; name: string; mimeType: string }>;
  error?: string;
}> {
  try {
    const clientFolderResult = await getClientFolder(clientId);
    if (!clientFolderResult.success || !clientFolderResult.folder) {
      return { success: false, error: clientFolderResult.error };
    }

    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client } = auth;
    const parts = subfolderPath.split('/');
    let currentFolderId = clientFolderResult.folder.id;
    let currentPath = clientFolderResult.folder.name;

    // Navigate through the path
    for (const part of parts) {
      const folder = await getFolderByName(oauth2Client, part, currentFolderId);
      if (!folder) {
        return { success: false, error: `No se encontró la subcarpeta "${part}" en ${currentPath}` };
      }
      currentFolderId = folder.id;
      currentPath = `${currentPath}/${part}`;
    }

    // Get files in the folder
    const files = await listFilesInFolder(oauth2Client, currentFolderId);

    return {
      success: true,
      folder: { id: currentFolderId, name: parts[parts.length - 1], path: currentPath },
      files: files.map(f => ({ id: f.id, name: f.name, mimeType: f.mimeType })),
    };
  } catch (error: any) {
    console.error('[ROPA Drive] Error getting client subfolder:', error);
    return { success: false, error: error.message };
  }
}

// List all clients with their folder structure
export async function listAllClients(): Promise<{
  success: boolean;
  clients?: Array<{ id: string; name: string; folderId: string }>;
  error?: string;
}> {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) {
      return { success: false, error: 'Google Drive no conectado' };
    }

    const { oauth2Client, folderIds } = auth;
    const rootFolderId = folderIds.root;

    if (!rootFolderId) {
      return { success: false, error: 'No se encontró la carpeta raíz de Ivy.AI' };
    }

    // Find Clientes folder
    const clientesFolder = await getFolderByName(oauth2Client, 'Clientes', rootFolderId);
    if (!clientesFolder) {
      return { success: true, clients: [] }; // No clients folder yet
    }

    // List all client folders
    const subfolders = await listSubfolders(oauth2Client, clientesFolder.id);
    const clients = subfolders.map(f => {
      // Parse client ID and name from folder name (format: "IVY-2026-0001 - ClientName")
      const match = f.name.match(/^(IVY-\d{4}-\d{4})\s*-\s*(.+)$/);
      return {
        id: match ? match[1] : f.name,
        name: match ? match[2] : f.name,
        folderId: f.id,
      };
    });

    return { success: true, clients };
  } catch (error: any) {
    console.error('[ROPA Drive] Error listing clients:', error);
    return { success: false, error: error.message };
  }
}

export default {
  listAllFiles,
  listFolderContents,
  getFullFolderTree,
  getFolderTreeSummary,
  createFolder,
  deleteFolder,
  moveFile,
  copyFile,
  getFileContent,
  searchFiles,
  getClientListData,
  getFilesSummary,
  createClientFolderStructure,
  getClientFolder,
  getClientSubfolder,
  listAllClients,
};
