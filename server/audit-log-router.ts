import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const auditLogRouter = router({
  // Get all audit logs with filters (admin only)
  list: protectedProcedure
    .input(z.object({
      userId: z.number().optional(),
      action: z.string().optional(),
      entityType: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new Error("Unauthorized: Admin access required");
      }
      
      const logs = await db.getAllAuditLogs(input || {});
      return { logs };
    }),
});
