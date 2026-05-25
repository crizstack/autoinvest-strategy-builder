import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { portfolios } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const portfolioRouter = router({
  /**
   * Obter portfolio do usuário
   */
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    let portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, ctx.user.id),
    });

    // Se não existe, criar com valores padrão
    if (!portfolio) {
      const initialBalance = '10000.00';
      await db.insert(portfolios).values({
        userId: ctx.user.id,
        initialBalance,
        currentBalance: initialBalance,
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
      });

      portfolio = await db.query.portfolios.findFirst({
        where: eq(portfolios.userId, ctx.user.id),
      });
    }

    return {
      id: portfolio?.id,
      userId: portfolio?.userId,
      initialBalance: portfolio?.initialBalance,
      currentBalance: portfolio?.currentBalance,
      totalReturn: portfolio?.totalReturn,
      totalTrades: portfolio?.totalTrades,
      winningTrades: portfolio?.winningTrades,
      winRate: portfolio?.winRate,
      openPositions: portfolio?.openPositions,
      updatedAt: portfolio?.updatedAt,
    };
  }),

  /**
   * Atualizar portfolio
   */
  updatePortfolio: protectedProcedure
    .input(
      z.object({
        currentBalance: z.number().optional(),
        totalReturn: z.number().optional(),
        totalTrades: z.number().optional(),
        winningTrades: z.number().optional(),
        winRate: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const updates: any = {};
      if (input.currentBalance !== undefined) updates.currentBalance = input.currentBalance.toString();
      if (input.totalReturn !== undefined) updates.totalReturn = input.totalReturn.toString();
      if (input.totalTrades !== undefined) updates.totalTrades = input.totalTrades;
      if (input.winningTrades !== undefined) updates.winningTrades = input.winningTrades;
      if (input.winRate !== undefined) updates.winRate = input.winRate.toString();

      await db.update(portfolios).set(updates).where(eq(portfolios.userId, ctx.user.id));

      return { success: true };
    }),

  /**
   * Resetar portfolio
   */
  resetPortfolio: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const initialBalance = '10000.00';

    await db
      .update(portfolios)
      .set({
        currentBalance: initialBalance,
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
      })
      .where(eq(portfolios.userId, ctx.user.id));

    return { success: true };
  }),
});
