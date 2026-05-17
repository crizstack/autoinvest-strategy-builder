import { protectedProcedure, router } from '../_core/trpc';
import { z } from 'zod';
import { notifications } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getDb } from '../db';

export const notificationsRouter = router({
  // Get all notifications for user
  getAll: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const items = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, ctx.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(input?.limit || 50)
        .offset(input?.offset || 0);

      return items;
    }),

  // Get unread count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));

    return result.length;
  }),

  // Mark as read
  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),

  // Mark all as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.read, false)));

    return { success: true };
  }),

  // Create notification (for testing)
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(['execution', 'risk', 'market', 'system']),
        title: z.string(),
        message: z.string(),
        severity: z.enum(['info', 'warning', 'error', 'success']).optional(),
        strategyId: z.number().optional(),
        actionUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.insert(notifications).values({
        userId: ctx.user.id,
        type: input.type,
        title: input.title,
        message: input.message,
        severity: input.severity || 'info',
        strategyId: input.strategyId,
        actionUrl: input.actionUrl,
      });

      return { success: true };
    }),

  // Delete notification
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db
        .delete(notifications)
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, ctx.user.id)));

      return { success: true };
    }),

  // Delete all notifications
  deleteAll: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    await db.delete(notifications).where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});
