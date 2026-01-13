import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { googleDriveTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";
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

        // Save tokens to database
        const tokenData = {
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token || null,
          expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scope: tokens.scope || null,
          tokenType: tokens.token_type || null,
          folderIds: JSON.stringify(folderIds),
        };

        // Delete existing tokens and insert new ones
        await db.delete(googleDriveTokens);
        await db.insert(googleDriveTokens).values(tokenData);

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
      const result = await db.select().from(googleDriveTokens).limit(1);
      return { connected: result.length > 0 };
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
      const result = await db.select().from(googleDriveTokens).limit(1);
      if (result.length === 0) {
        throw new Error("Google Drive no conectado");
      }

      const folderIds = result[0].folderIds 
        ? JSON.parse(result[0].folderIds) 
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
        // Get tokens from database
        const result = await db.select().from(googleDriveTokens).limit(1);
        if (result.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = result[0];
        const folderIds = JSON.parse(tokenRecord.folderIds || "{}");
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.accessToken,
          refresh_token: tokenRecord.refreshToken,
          expiry_date: tokenRecord.expiryDate?.getTime(),
          scope: tokenRecord.scope,
          token_type: tokenRecord.tokenType,
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
        // Get tokens from database
        const result = await db.select().from(googleDriveTokens).limit(1);
        if (result.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = result[0];
        const folderIds = JSON.parse(tokenRecord.folderIds || "{}");
        const folderId = folderIds[input.folderType];

        if (!folderId) {
          throw new Error(`Carpeta ${input.folderType} no encontrada`);
        }

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.accessToken,
          refresh_token: tokenRecord.refreshToken,
          expiry_date: tokenRecord.expiryDate?.getTime(),
          scope: tokenRecord.scope,
          token_type: tokenRecord.tokenType,
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
        // Get tokens from database
        const result = await db.select().from(googleDriveTokens).limit(1);
        if (result.length === 0) {
          throw new Error("Google Drive no conectado");
        }

        const tokenRecord = result[0];

        // Setup OAuth client
        const oauth2Client = getOAuth2Client();
        setCredentials(oauth2Client, {
          access_token: tokenRecord.accessToken,
          refresh_token: tokenRecord.refreshToken,
          expiry_date: tokenRecord.expiryDate?.getTime(),
          scope: tokenRecord.scope,
          token_type: tokenRecord.tokenType,
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
      await db.delete(googleDriveTokens);
      return {
        success: true,
        message: "Google Drive desconectado exitosamente",
      };
    } catch (error) {
      console.error("[Google Drive] Disconnect error:", error);
      throw new Error("Error al desconectar Google Drive");
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
