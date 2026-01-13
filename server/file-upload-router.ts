import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";
import { companyFiles } from "../drizzle/schema";

export const fileUploadRouter = router({
  upload: protectedProcedure
    .input(
      z.object({        fileName: z.string(),
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

        // Generate unique file key
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileExtension = input.fileName.split(".").pop();
        const fileKey = `companies/${input.companyId}/${input.fileType}/${timestamp}-${randomSuffix}.${fileExtension}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        // Save to database
        const db = await getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const [file] = await db.insert(companyFiles).values({
          companyId: input.companyId,
          companyName: input.companyName,
          fileName: input.fileName,
          s3Url: url,
          s3Key: fileKey,
          mimeType: input.mimeType,
          fileType: input.fileType,
          uploadedBy: ctx.user.openId,
          fileSize: buffer.length,
        });

        return {
          success: true,
          file: {
            id: file.insertId,
            fileName: input.fileName,
            url,
            fileType: input.fileType,
          },
        };
      } catch (error: any) {
        console.error("[File Upload] Error:", error);
        return {
          success: false,
          error: error.message || "Failed to upload file",
        };
      }
    }),

  list: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        fileType: z.enum(["logo", "email_example", "branding", "document", "client_list", "other"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        return { files: [] };
      }

      let whereClause = eq(companyFiles.companyId, input.companyId);

      if (input.fileType) {
        whereClause = and(whereClause, eq(companyFiles.fileType, input.fileType)) as any;
      }

      const files = await db.select().from(companyFiles).where(whereClause);
      return { files };
    }),

  delete: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      await db.delete(companyFiles).where(eq(companyFiles.id, input.fileId));

      return { success: true };
    }),
});
