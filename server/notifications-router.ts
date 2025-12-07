import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

export const notificationsRouter = router({
  // Obtener todas las notificaciones del usuario actual
  list: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.getUserNotifications(ctx.user.id);
    return {
      notifications,
      unreadCount: notifications.filter(n => !n.isRead).length,
    };
  }),

  // Obtener solo notificaciones no leídas
  unread: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.getUserNotifications(ctx.user.id);
    const unread = notifications.filter(n => !n.isRead);
    return {
      notifications: unread,
      count: unread.length,
    };
  }),

  // Marcar una notificación como leída
  markAsRead: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.markNotificationAsRead(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  // Marcar todas las notificaciones como leídas
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  // Eliminar una notificación
  delete: protectedProcedure
    .input(z.object({
      notificationId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteNotification(input.notificationId, ctx.user.id);
      return { success: true };
    }),

  // Crear una notificación (admin only o sistema)
  create: protectedProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      message: z.string(),
      type: z.enum(["info", "success", "warning", "error"]).default("info"),
      category: z.enum(["workflow", "agent", "lead", "ticket", "system"]),
      relatedId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const notification = await db.createNotification(input);
      return { success: true, notification };
    }),
});
