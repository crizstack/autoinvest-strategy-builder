import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { portfolios } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { PortfolioService } from '../portfolio/portfolio-service';

export const portfolioRouter = router({
  /**
   * Obter portfolio do usuário com estatísticas completas
   */
  getPortfolio: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
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

      const portfolio = await PortfolioService.getOrCreatePortfolio(ctx.user.id);
      return portfolio;
    } catch (error) {
      console.error('[Portfolio] Error getting portfolio:', error);
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
   * Obter estatísticas completas do portfolio
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = await PortfolioService.calculatePortfolioStats(ctx.user.id);
      return stats;
    } catch (error) {
      console.error('[Portfolio] Error getting stats:', error);
      return {
        totalBalance: 10000,
        initialBalance: 10000,
        totalReturn: 0,
        totalReturnPercent: 0,
        totalTrades: 0,
        winningTrades: 0,
        winRate: 0,
        openPositions: 0,
        totalOpenValue: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        profitFactor: 0,
      };
    }
  }),

  /**
   * Obter alocação por ativo
   */
  getAllocation: protectedProcedure.query(async ({ ctx }) => {
    try {
      const allocation = await PortfolioService.getAllocationBreakdown(ctx.user.id);
      return allocation;
    } catch (error) {
      console.error('[Portfolio] Error getting allocation:', error);
      return [];
    }
  }),

  /**
   * Obter histórico de snapshots
   */
  getHistory: protectedProcedure
    .input(z.object({ days: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      try {
        const history = await PortfolioService.getSnapshotHistory(ctx.user.id, input.days);
        return history;
      } catch (error) {
        console.error('[Portfolio] Error getting history:', error);
        return [];
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
    try {
      await PortfolioService.resetPortfolio(ctx.user.id);
      return { success: true };
    } catch (error) {
      console.error('[Portfolio] Error resetting portfolio:', error);
      return { success: false };
    }
  }),

  /**
   * Criar snapshot manual
   */
  createSnapshot: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      await PortfolioService.createSnapshot(ctx.user.id);
      return { success: true };
    } catch (error) {
      console.error('[Portfolio] Error creating snapshot:', error);
      return { success: false };
    }
  }),
});
