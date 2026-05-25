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
    if (!db) {
      // Retornar valores padrão se DB não está disponível
      return {
        id: 0,
        userId: ctx.user.id,
        initialBalance: '10000.00',
        currentBalance: '10000.00',
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
        openPositions: null,
        updatedAt: new Date(),
      };
    }

    try {
      let portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, ctx.user.id))
        .limit(1);

      // Se não existe, criar com valores padrão
      if (!portfolio || portfolio.length === 0) {
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

        portfolio = await db
          .select()
          .from(portfolios)
          .where(eq(portfolios.userId, ctx.user.id))
          .limit(1);
      }

      const p = portfolio[0];
      return {
        id: p?.id || 0,
        userId: p?.userId,
        initialBalance: p?.initialBalance,
        currentBalance: p?.currentBalance,
        totalReturn: p?.totalReturn,
        totalTrades: p?.totalTrades,
        winningTrades: p?.winningTrades,
        winRate: p?.winRate,
        openPositions: p?.openPositions,
        updatedAt: p?.updatedAt,
      };
    } catch (error) {
      console.error('[Portfolio] Error getting portfolio:', error);
      // Retornar valores padrão em caso de erro
      return {
        id: 0,
        userId: ctx.user.id,
        initialBalance: '10000.00',
        currentBalance: '10000.00',
        totalReturn: '0.00',
        totalTrades: 0,
        winningTrades: 0,
        winRate: '0.00',
        openPositions: null,
        updatedAt: new Date(),
      };
    }
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
      if (!db) {
        console.warn('[Portfolio] Database not available for update');
        return { success: false };
      }

      try {
        const updates: any = {};
        if (input.currentBalance !== undefined) updates.currentBalance = input.currentBalance.toString();
        if (input.totalReturn !== undefined) updates.totalReturn = input.totalReturn.toString();
        if (input.totalTrades !== undefined) updates.totalTrades = input.totalTrades;
        if (input.winningTrades !== undefined) updates.winningTrades = input.winningTrades;
        if (input.winRate !== undefined) updates.winRate = input.winRate.toString();

        await db.update(portfolios).set(updates).where(eq(portfolios.userId, ctx.user.id));
        return { success: true };
      } catch (error) {
        console.error('[Portfolio] Error updating portfolio:', error);
        return { success: false };
      }
    }),

  /**
   * Resetar portfolio
   */
  resetPortfolio: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      console.warn('[Portfolio] Database not available for reset');
      return { success: false };
    }

    try {
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
    } catch (error) {
      console.error('[Portfolio] Error resetting portfolio:', error);
      return { success: false };
    }
  }),
});
