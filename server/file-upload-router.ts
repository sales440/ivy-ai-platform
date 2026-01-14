import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import { companyFiles } from "../drizzle/schema";
import { uploadFileToDrive, initializeFolderStructure, getOAuth2Client } from "./google-drive";
import { getDb as getDatabase } from "./db";
import { googleDriveTokens } from "../drizzle/schema";

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

        // Get OAuth2 client with user's tokens
        const db = await getDatabase();
        if (!db) {
          throw new Error("Database not available");
        }

        const [tokenRecord] = await db
          .select()
          .from(googleDriveTokens)
          .limit(1);

        if (!tokenRecord) {
          throw new Error("Google Drive not connected. Please connect your Google Drive account first.");
        }

        const oauth2Client = getOAuth2Client();
        oauth2Client.setCredentials({
          access_token: tokenRecord.accessToken,
          refresh_token: tokenRecord.refreshToken || undefined,
          expiry_date: tokenRecord.expiryDate?.getTime(),
          token_type: tokenRecord.tokenType || undefined,
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

        // Save to database (db already obtained above)

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
});
