import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import mysql from "mysql2/promise";
import {
  getAuthUrl,
  getTokensFromCode,
  getOAuth2Client,
  setCredentials,
  initializeFolderStructure,
  uploadFileToDrive,
  listFilesInFolder,
  deleteFileFromDrive,
} from "./google-drive";
import { triggerManualBackup } from "./backup-scheduler";
import { triggerManualCleanup } from "./backup-retention";

/**
 * Get raw MySQL connection - bypasses Drizzle ORM completely
 */
async function getRawConnection() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL not configured");
  }
  
  const url = new URL(databaseUrl);
  const config = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: { rejectUnauthorized: false }
  };
  
  return mysql.createConnection(config);
}

/**
 * Ensure google_drive_tokens table exists
 */
async function ensureTableExists(connection: mysql.Connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS google_drive_tokens (
      id int AUTO_INCREMENT PRIMARY KEY,
      user_id varchar(64) NOT NULL,
      access_token text NOT NULL,
      refresh_token text,
      expiry_date bigint,
      scope text,
      token_type varchar(64),
      folder_ids json,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user (user_id)
    )
  `;
  await connection.execute(createTableSQL);
}

export const googleDriveRouter = router({
  // Get authorization URL for OAuth flow
  getAuthUrl: protectedProcedure.query(() => {
    return { authUrl: getAuthUrl() };
  }),

  // Check if Google Drive is connected - PUBLIC so it works without auth
  isConnected: publicProcedure.query(async () => {
    let connection: mysql.Connection | null = null;
    try {
      connection = await getRawConnection();
      await ensureTableExists(connection);
      
      const [rows] = await connection.execute(
        "SELECT id, access_token FROM google_drive_tokens LIMIT 1"
      ) as [any[], any];
      
      const connected = rows.length > 0 && !!rows[0]?.access_token;
      console.log("[Google Drive] Connection check:", connected ? "CONNECTED" : "NOT CONNECTED");
      
      return { connected };
    } catch (error) {
      console.error("[Google Drive] Error checking connection:", error);
      return { connected: false };
    } finally {
      if (connection) await connection.end();
    }
  }),

  // Get folder IDs
  getFolderIds: protectedProcedure.query(async () => {
    let connection: mysql.Connection | null = null;
    try {
      connection = await getRawConnection();
      await ensureTableExists(connection);
      
      const [rows] = await connection.execute(
        "SELECT folder_ids FROM google_drive_tokens LIMIT 1"
      ) as [any[], any];
      
      if (rows.length === 0) {
        throw new Error("Google Drive no conectado");
      }

      const folderIds = rows[0].folder_ids 
        ? (typeof rows[0].folder_ids === 'string' ? JSON.parse(rows[0].folder_ids) : rows[0].folder_ids)
        : {};

      return { folderIds };
    } catch (error) {
      console.error("[Google Drive] Error getting folder IDs:", error);
      throw new Error("Error al obtener carpetas de Google Drive");
    } finally {
      if (connection) await connection.end();
    }
  }),

  // Upload file to Google Drive
  uploadFile: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileBuffer: z.string(), // Base64 encoded
        mimeType: z.string(),
        folderType: z.enum([
          "backups",
          "exports",
          "daily",
          "weekly",
          "monthly",
          "emailTemplates",
          "callScripts",
          "smsTemplates",
          "campaigns",
          "branding",
          "clientLists",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      let connection: mysql.Connection | null = null;
      try {
        connection = await getRawConnection();
        await ensureTableExists(connection);
        
        const [rows] = await connection.execute(
          "SELECT access_token, refresh_token, expiry_date, scope, token_type, folder_ids FROM google_drive_tokens LIMIT 1"
        ) as [any[], any];
        
        if (rows.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];
        const folderIds = typeof tokenRecord.folder_ids === 'string' 
          ? JSON.parse(tokenRecord.folder_ids) 
          : (tokenRecord.folder_ids || {});
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type,
        });

        // Decode base64 buffer
        const fileBuffer = Buffer.from(input.fileBuffer, "base64");

        // Upload to Google Drive
        const uploadResult = await uploadFileToDrive(
          oauth2Client,
          input.fileName,
          fileBuffer,
          input.mimeType,
          folderId
        );

        return {
          success: true,
          fileId: uploadResult.id,
          webViewLink: uploadResult.webViewLink,
          message: `Archivo ${input.fileName} subido exitosamente`,
        };
      } catch (error) {
        console.error("[Google Drive] Upload error:", error);
        throw new Error("Error al subir archivo a Google Drive");
      } finally {
        if (connection) await connection.end();
      }
    }),

  // List files in a folder
  listFiles: protectedProcedure
    .input(
      z.object({
        folderType: z.enum([
          "backups",
          "exports",
          "daily",
          "weekly",
          "monthly",
          "emailTemplates",
          "callScripts",
          "smsTemplates",
          "campaigns",
          "branding",
          "clientLists",
        ]),
      })
    )
    .query(async ({ input }) => {
      let connection: mysql.Connection | null = null;
      try {
        connection = await getRawConnection();
        await ensureTableExists(connection);
        
        const [rows] = await connection.execute(
          "SELECT access_token, refresh_token, expiry_date, scope, token_type, folder_ids FROM google_drive_tokens LIMIT 1"
        ) as [any[], any];
        
        if (rows.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];
        const folderIds = typeof tokenRecord.folder_ids === 'string' 
          ? JSON.parse(tokenRecord.folder_ids) 
          : (tokenRecord.folder_ids || {});
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type,
        });

        // List files
        const files = await listFilesInFolder(oauth2Client, folderId);

        return { files };
      } catch (error) {
        console.error("[Google Drive] List files error:", error);
        throw new Error("Error al listar archivos de Google Drive");
      } finally {
        if (connection) await connection.end();
      }
    }),

  // Delete file from Google Drive
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input }) => {
      let connection: mysql.Connection | null = null;
      try {
        connection = await getRawConnection();
        await ensureTableExists(connection);
        
        const [rows] = await connection.execute(
          "SELECT access_token, refresh_token, expiry_date, scope, token_type FROM google_drive_tokens LIMIT 1"
        ) as [any[], any];
        
        if (rows.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type,
        });

        // Delete file
        await deleteFileFromDrive(oauth2Client, input.fileId);

        return {
          success: true,
          message: "Archivo eliminado exitosamente",
        };
      } catch (error) {
        console.error("[Google Drive] Delete file error:", error);
        throw new Error("Error al eliminar archivo de Google Drive");
      } finally {
        if (connection) await connection.end();
      }
    }),

  // Disconnect Google Drive
  disconnect: protectedProcedure.mutation(async () => {
    let connection: mysql.Connection | null = null;
    try {
      connection = await getRawConnection();
      await connection.execute("DELETE FROM google_drive_tokens");
      return {
        success: true,
        message: "Google Drive desconectado exitosamente",
      };
    } catch (error) {
      console.error("[Google Drive] Disconnect error:", error);
      throw new Error("Error al desconectar Google Drive");
    } finally {
      if (connection) await connection.end();
    }
  }),

  // Initialize folder structure manually
  initializeFolders: protectedProcedure.mutation(async () => {
    try {
      const { createFolderStructure } = await import('./google-drive-sync');
      const result = await createFolderStructure();
      
      if (result.success) {
        return { 
          success: true, 
          message: 'Estructura de carpetas creada exitosamente',
          folders: result.folders 
        };
      } else {
        return { 
          success: false, 
          error: result.error || 'Error desconocido' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }),

  // Trigger manual backup
  triggerBackup: protectedProcedure.mutation(async () => {
    try {
      const result = await triggerManualBackup();
      return {
        success: result.success,
        message: result.success ? "Backup creado exitosamente" : "Error al crear backup",
        backupId: result.backupId,
        driveLink: result.driveLink,
      };
    } catch (error) {
      console.error("[Google Drive] Manual backup error:", error);
      throw new Error("Error al crear backup manual");
    }
  }),

  // Trigger manual cleanup
  triggerCleanup: protectedProcedure.mutation(async () => {
    try {
      const result = await triggerManualCleanup();
      return {
        success: result.success,
        message: "Limpieza de archivos antiguos completada",
        deleted: result.deleted,
        kept: result.kept,
        errors: result.errors,
      };
    } catch (error) {
      console.error("[Google Drive] Manual cleanup error:", error);
      throw new Error("Error al ejecutar limpieza manual");
    }
  }),
});
