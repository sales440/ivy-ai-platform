import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { eq, sql } from "drizzle-orm";
import { companyFiles } from "../drizzle/schema";
import { uploadFileToDrive, initializeFolderStructure, getOAuth2Client } from "./google-drive";

/**
 * File Upload Router - Uploads files to Google Drive
 * FIXED: Using raw SQL to avoid Drizzle ORM column mapping issues with google_drive_tokens
 */
export const fileUploadRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        mimeType: z.string(),
        companyId: z.number(),
        companyName: z.string(),
        fileType: z.enum(["logo", "email_example", "branding", "document", "client_list", "other"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Decode base64
        const buffer = Buffer.from(input.fileData, "base64");

        // Get OAuth2 client with user's tokens using RAW SQL
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        // Use raw SQL to avoid column mapping issues
        const tokenResult = await db.execute(sql`
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

        const rows = tokenResult as any[];
        if (!rows || rows.length === 0) {
          throw new Error("Google Drive not connected. Please connect your Google Drive account first.");
        }

        const tokenRecord = rows[0];
        console.log("[File Upload] Token record found:", {
          id: tokenRecord.id,
          hasAccessToken: !!tokenRecord.access_token,
          hasRefreshToken: !!tokenRecord.refresh_token
        });

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
          access_token: tokenRecord.access_token,
          refresh_token: tokenRecord.refresh_token || undefined,
          expiry_date: tokenRecord.expiry_date ? new Date(tokenRecord.expiry_date).getTime() : undefined,
          token_type: tokenRecord.token_type || 'Bearer',
          scope: tokenRecord.scope || undefined,
        });

        // Ensure folder structure exists in Google Drive
        const folderIds = await initializeFolderStructure(oauth2Client);

        // Determine target folder based on file type
        let targetFolderId: string;
        switch (input.fileType) {
          case "logo":
          case "branding":
            targetFolderId = folderIds.branding;
            break;
          case "email_example":
            targetFolderId = folderIds.emailTemplates;
            break;
          case "client_list":
            targetFolderId = folderIds.clientLists;
            break;
          case "document":
            targetFolderId = folderIds.documents;
            break;
          default:
            targetFolderId = folderIds.root;
        }

        // Upload to Google Drive
        const driveFile = await uploadFileToDrive(
          oauth2Client,
          input.fileName,
          buffer,
          input.mimeType,
          targetFolderId
        );

        // Save to database
        const [file] = await db.insert(companyFiles).values({
          companyId: input.companyId,
          companyName: input.companyName,
          fileName: input.fileName,
          s3Url: driveFile.webViewLink || "",
          s3Key: driveFile.id, // Store Google Drive file ID
          mimeType: input.mimeType,
          fileType: input.fileType,
          uploadedBy: ctx.user.openId,
          fileSize: buffer.length,
        });

        console.log(`[File Upload] Uploaded ${input.fileName} to Google Drive (${input.fileType})`);

        return {
          success: true,
          fileId: driveFile.id,
          fileName: input.fileName,
          url: driveFile.webViewLink,
        };
      } catch (error: any) {
        console.error("[File Upload] Error:", error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }
    }),

  listByCompany: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const files = await db
        .select()
        .from(companyFiles)
        .where(eq(companyFiles.companyId, input.companyId))
        .orderBy(companyFiles.createdAt);

      return files;
    }),

  delete: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get file info
      const [file] = await db
        .select()
        .from(companyFiles)
        .where(eq(companyFiles.id, input.fileId))
        .limit(1);

      if (!file) {
        throw new Error("File not found");
      }

      // Delete from database
      await db.delete(companyFiles).where(eq(companyFiles.id, input.fileId));

      // Note: Google Drive file deletion would require additional implementation
      // For now, we only delete from database

      console.log(`[File Upload] Deleted file ${file.fileName} (ID: ${input.fileId})`);

      return { success: true };
    }),

  // Check if Google Drive is connected
  checkConnection: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { connected: false, error: "Database not available" };

    try {
      const result = await db.execute(sql`
        SELECT id, user_id, LEFT(access_token, 10) as token_preview, created_at 
        FROM google_drive_tokens 
        LIMIT 1
      `);
      
      const rows = result as any[];
      if (rows && rows.length > 0) {
        return { 
          connected: true, 
          tokenId: rows[0].id,
          createdAt: rows[0].created_at
        };
      }
      return { connected: false, error: "No tokens found" };
    } catch (error: any) {
      console.error("[File Upload] Check connection error:", error);
      return { connected: false, error: error.message };
    }
  }),
});
