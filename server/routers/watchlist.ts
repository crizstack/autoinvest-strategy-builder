import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { watchlist, assets } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';

export const watchlistRouter = router({
  // Get all watchlist items for user
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const items = await db
      .select({
        id: watchlist.id,
        symbol: assets.symbol,
        name: assets.name,
        sector: assets.sector,
        addedAt: watchlist.addedAt,
        notes: watchlist.notes,
      })
      .from(watchlist)
      .innerJoin(assets, eq(watchlist.assetId, assets.id))
      .where(eq(watchlist.userId, ctx.user.id));

    return items;
  }),

  // Add asset to watchlist
  add: protectedProcedure
    .input(z.object({ assetId: z.number(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      // Check if already in watchlist
      const existing = await db
        .select()
        .from(watchlist)
        .where(
          and(
            eq(watchlist.userId, ctx.user.id),
            eq(watchlist.assetId, input.assetId)
          )
        );

      if (existing.length > 0) {
        throw new Error('Asset already in watchlist');
      }

      await db.insert(watchlist).values({
        userId: ctx.user.id,
        assetId: input.assetId,
        notes: input.notes,
      });

      return { success: true };
    }),

  // Remove from watchlist
  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      // Verify ownership
      const item = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.id, input.id));

      if (item.length === 0 || item[0].userId !== ctx.user.id) {
        throw new Error('Not found or unauthorized');
      }

      await db.delete(watchlist).where(eq(watchlist.id, input.id));
      return { success: true };
    }),

  // Update notes
  updateNotes: protectedProcedure
    .input(z.object({ id: z.number(), notes: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      // Verify ownership
      const item = await db
        .select()
        .from(watchlist)
        .where(eq(watchlist.id, input.id));

      if (item.length === 0 || item[0].userId !== ctx.user.id) {
        throw new Error('Not found or unauthorized');
      }

      await db
        .update(watchlist)
        .set({ notes: input.notes })
        .where(eq(watchlist.id, input.id));

      return { success: true };
    }),

  // Check if asset is in watchlist
  isInWatchlist: protectedProcedure
    .input(z.object({ assetId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const item = await db
        .select()
        .from(watchlist)
        .where(
          and(
            eq(watchlist.userId, ctx.user.id),
            eq(watchlist.assetId, input.assetId)
          )
        );

      return item.length > 0;
    }),
});
