import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import {
  getAuthUrl,
  getTokensFromCode,
  getOAuth2Client,
  setCredentials,
  initializeFolderStructure,
  uploadFileToDrive,
  listFilesInFolder,
  deleteFileFromDrive,
  downloadFileFromDrive,
} from "./google-drive";
import { triggerManualBackup } from "./backup-scheduler";
import { triggerManualCleanup } from "./backup-retention";

/**
 * Google Drive Router
 * FIXED: Using raw SQL to avoid Drizzle ORM column mapping issues
 */
export const googleDriveRouter = router({
  // Get authorization URL for OAuth flow
  getAuthUrl: protectedProcedure.query(() => {
    return { authUrl: getAuthUrl() };
  }),

  // Exchange authorization code for tokens and save to database
  authorize: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const tokens = await getTokensFromCode(input.code);
        
        // Initialize folder structure
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, tokens);
        const folderIds = await initializeFolderStructure(oauth2Client);

        // Save tokens to database using RAW SQL
        const accessToken = tokens.access_token || '';
        const refreshToken = tokens.refresh_token || null;
        const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
        const scope = tokens.scope || null;
        const tokenType = tokens.token_type || 'Bearer';
        const folderIdsJson = JSON.stringify(folderIds);

        // Delete existing tokens
        await db.execute(sql`DELETE FROM google_drive_tokens`);

        // Insert new tokens with raw SQL
        await db.execute(sql`
          INSERT INTO google_drive_tokens 
            (user_id, access_token, refresh_token, expiry_date, scope, token_type, folder_ids, created_at, updated_at)
          VALUES 
            (1, ${accessToken}, ${refreshToken}, ${expiryDate}, ${scope}, ${tokenType}, ${folderIdsJson}, NOW(), NOW())
        `);

        console.log("[Google Drive] Authorization successful, tokens saved");

        return {
          success: true,
          message: "Google Drive conectado exitosamente",
          folderIds,
        };
      } catch (error) {
        console.error("[Google Drive] Authorization error:", error);
        throw new Error("Error al autorizar Google Drive");
      }
    }),

  // Check if Google Drive is connected
  isConnected: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { connected: false };

    try {
      const result = await db.execute(sql`
        SELECT id FROM google_drive_tokens LIMIT 1
      `);
      const rows = result as any[];
      return { connected: rows && rows.length > 0 };
    } catch (error) {
      console.error("[Google Drive] Error checking connection:", error);
      return { connected: false };
    }
  }),

  // Get folder IDs
  getFolderIds: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const result = await db.execute(sql`
        SELECT folder_ids FROM google_drive_tokens LIMIT 1
      `);
      const rows = result as any[];
      
      if (!rows || rows.length === 0) {
        throw new Error("Google Drive no conectado");
      }

      const folderIds = rows[0].folder_ids 
        ? JSON.parse(rows[0].folder_ids) 
        : {};

      return { folderIds };
    } catch (error) {
      console.error("[Google Drive] Error getting folder IDs:", error);
      throw new Error("Error al obtener carpetas de Google Drive");
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get tokens from database using RAW SQL
        const result = await db.execute(sql`
          SELECT 
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
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];
        const folderIds = JSON.parse(tokenRecord.folder_ids || "{}");
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date ? new Date(tokenRecord.expiry_date).getTime() : undefined,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type || 'Bearer',
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
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get tokens from database using RAW SQL
        const result = await db.execute(sql`
          SELECT 
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
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];
        const folderIds = JSON.parse(tokenRecord.folder_ids || "{}");
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date ? new Date(tokenRecord.expiry_date).getTime() : undefined,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type || 'Bearer',
        });

        // List files
        const files = await listFilesInFolder(oauth2Client, folderId);

        return { files };
      } catch (error) {
        console.error("[Google Drive] List files error:", error);
        throw new Error("Error al listar archivos de Google Drive");
      }
    }),

  // Delete file from Google Drive
  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.string() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Get tokens from database using RAW SQL
        const result = await db.execute(sql`
          SELECT 
            access_token,
            refresh_token,
            expiry_date,
            scope,
            token_type
          FROM google_drive_tokens 
          LIMIT 1
        `);
        const rows = result as any[];
        
        if (!rows || rows.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = rows[0];

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token,
          expiry_date: tokenRecord.expiry_date ? new Date(tokenRecord.expiry_date).getTime() : undefined,
          scope: tokenRecord.scope,
          token_type: tokenRecord.token_type || 'Bearer',
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
      }
    }),

  // Disconnect Google Drive
  disconnect: protectedProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      await db.execute(sql`DELETE FROM google_drive_tokens`);
      return {
        success: true,
        message: "Google Drive desconectado exitosamente",
      };
    } catch (error) {
      console.error("[Google Drive] Disconnect error:", error);
      throw new Error("Error al desconectar Google Drive");
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
