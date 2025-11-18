import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { protectedProcedure, router } from './_core/trpc';
import { getDb } from './db';
import { scheduledTasks } from '../drizzle/schema';

export const scheduledTasksRouter = router({
  /**
   * List all scheduled tasks with optional filters
   */
  list: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
        taskType: z.enum(['send-email', 'update-lead-score', 'send-notification', 'custom']).optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const conditions = [eq(scheduledTasks.companyId, input.companyId)];

      if (input.status) {
        conditions.push(eq(scheduledTasks.status, input.status));
      }

      if (input.taskType) {
        conditions.push(eq(scheduledTasks.taskType, input.taskType));
      }

      const tasks = await db
        .select()
        .from(scheduledTasks)
        .where(and(...conditions))
        .orderBy(desc(scheduledTasks.createdAt))
        .limit(input.limit);

      return tasks;
    }),

  /**
   * Get a single scheduled task by ID
   */
  getById: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const result = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, input.taskId))
        .limit(1);

      if (result.length === 0) {
        throw new Error('Task not found');
      }

      return result[0];
    }),

  /**
   * Cancel a pending scheduled task
   */
  cancel: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check if task exists and is pending
      const task = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, input.taskId))
        .limit(1);

      if (task.length === 0) {
        throw new Error('Task not found');
      }

      if (task[0].status !== 'pending') {
        throw new Error(`Cannot cancel task with status: ${task[0].status}`);
      }

      // Update status to cancelled
      await db
        .update(scheduledTasks)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(scheduledTasks.id, input.taskId));

      return { success: true, message: 'Task cancelled successfully' };
    }),

  /**
   * Retry a failed scheduled task
   */
  retry: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Check if task exists and is failed
      const task = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.id, input.taskId))
        .limit(1);

      if (task.length === 0) {
        throw new Error('Task not found');
      }

      if (task[0].status !== 'failed') {
        throw new Error(`Cannot retry task with status: ${task[0].status}`);
      }

      // Reset status to pending and schedule for immediate execution
      await db
        .update(scheduledTasks)
        .set({
          status: 'pending',
          scheduledFor: new Date(),
          retryCount: 0,
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(scheduledTasks.id, input.taskId));

      return { success: true, message: 'Task scheduled for retry' };
    }),

  /**
   * Bulk cancel multiple tasks
   */
  bulkCancel: protectedProcedure
    .input(z.object({ taskIds: z.array(z.number()) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      if (input.taskIds.length === 0) {
        throw new Error('No tasks provided');
      }

      // Update all pending tasks to cancelled
      await db
        .update(scheduledTasks)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(scheduledTasks.id, input.taskIds),
            eq(scheduledTasks.status, 'pending')
          )
        );

      return { success: true, message: `Cancelled ${input.taskIds.length} tasks` };
    }),

  /**
   * Get statistics about scheduled tasks
   */
  stats: protectedProcedure
    .input(z.object({ companyId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const allTasks = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.companyId, input.companyId));

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const stats = {
        total: allTasks.length,
        pending: allTasks.filter(t => t.status === 'pending').length,
        processing: allTasks.filter(t => t.status === 'processing').length,
        completed: allTasks.filter(t => t.status === 'completed').length,
        failed: allTasks.filter(t => t.status === 'failed').length,
        cancelled: allTasks.filter(t => t.status === 'cancelled').length,
        completedToday: allTasks.filter(
          t => t.status === 'completed' && t.executedAt && t.executedAt >= todayStart
        ).length,
        failedToday: allTasks.filter(
          t => t.status === 'failed' && t.updatedAt >= todayStart
        ).length,
        byType: {
          'send-email': allTasks.filter(t => t.taskType === 'send-email').length,
          'update-lead-score': allTasks.filter(t => t.taskType === 'update-lead-score').length,
          'send-notification': allTasks.filter(t => t.taskType === 'send-notification').length,
          'custom': allTasks.filter(t => t.taskType === 'custom').length,
        },
      };

      return stats;
    }),

  /**
   * Get daily statistics for trend charts
   */
  dailyStats: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const allTasks = await db
        .select()
        .from(scheduledTasks)
        .where(eq(scheduledTasks.companyId, input.companyId));

      // Group tasks by date
      const dailyData: Record<string, { completed: number; failed: number; pending: number }> = {};

      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - input.days);

      // Initialize all dates with 0
      for (let i = 0; i < input.days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        dailyData[dateKey] = { completed: 0, failed: 0, pending: 0 };
      }

      // Count tasks by date and status
      allTasks.forEach(task => {
        const taskDate = new Date(task.createdAt);
        if (taskDate >= startDate) {
          const dateKey = taskDate.toISOString().split('T')[0];
          if (dailyData[dateKey]) {
            if (task.status === 'completed') {
              dailyData[dateKey].completed++;
            } else if (task.status === 'failed') {
              dailyData[dateKey].failed++;
            } else if (task.status === 'pending') {
              dailyData[dateKey].pending++;
            }
          }
        }
      });

      // Convert to array format for charts
      const result = Object.entries(dailyData)
        .map(([date, counts]) => ({
          date,
          ...counts,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return result;
    }),
});
