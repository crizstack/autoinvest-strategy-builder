import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { backtests, strategies } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const backtestHistoryRouter = router({
  /**
   * Obter histórico de backtests de uma estratégia
   */
  getByStrategy: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Verificar se estratégia pertence ao usuário
      const strategy = await db.query.strategies.findFirst({
        where: and(eq(strategies.id, input.strategyId), eq(strategies.userId, ctx.user.id)),
      });

      if (!strategy) {
        throw new Error('Strategy not found or unauthorized');
      }

      // Buscar backtests
      const results = await db
        .select()
        .from(backtests)
        .where(eq(backtests.strategyId, input.strategyId))
        .orderBy(desc(backtests.createdAt));

      return results.map((bt) => ({
        id: bt.id,
        strategyId: bt.strategyId,
        startDate: bt.startDate,
        endDate: bt.endDate,
        totalTrades: bt.totalTrades,
        winningTrades: bt.winningTrades,
        losingTrades: bt.losingTrades,
        winRate: bt.winRate,
        totalReturn: bt.totalReturn,
        maxDrawdown: bt.maxDrawdown,
        sharpeRatio: bt.sharpeRatio,
        profitFactor: bt.profitFactor,
        initialCapital: bt.initialCapital,
        finalCapital: bt.finalCapital,
        status: bt.status,
        createdAt: bt.createdAt,
        completedAt: bt.completedAt,
      }));
    }),

  /**
   * Obter detalhes de um backtest específico
   */
  getById: protectedProcedure
    .input(z.object({ backtestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar backtest
      const backtest = await db.query.backtests.findFirst({
        where: eq(backtests.id, input.backtestId),
      });

      if (!backtest) {
        throw new Error('Backtest not found');
      }

      // Verificar se pertence ao usuário
      if (backtest.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      return {
        id: backtest.id,
        strategyId: backtest.strategyId,
        startDate: backtest.startDate,
        endDate: backtest.endDate,
        totalTrades: backtest.totalTrades,
        winningTrades: backtest.winningTrades,
        losingTrades: backtest.losingTrades,
        winRate: backtest.winRate,
        totalReturn: backtest.totalReturn,
        maxDrawdown: backtest.maxDrawdown,
        sharpeRatio: backtest.sharpeRatio,
        profitFactor: backtest.profitFactor,
        initialCapital: backtest.initialCapital,
        finalCapital: backtest.finalCapital,
        trades: backtest.trades ? JSON.parse(backtest.trades as string) : [],
        status: backtest.status,
        createdAt: backtest.createdAt,
        completedAt: backtest.completedAt,
      };
    }),

  /**
   * Obter todos os backtests do usuário
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const results = await db
      .select()
      .from(backtests)
      .where(eq(backtests.userId, ctx.user.id))
      .orderBy(desc(backtests.createdAt));

    return results.map((bt) => ({
      id: bt.id,
      strategyId: bt.strategyId,
      startDate: bt.startDate,
      endDate: bt.endDate,
      totalTrades: bt.totalTrades,
      winningTrades: bt.winningTrades,
      losingTrades: bt.losingTrades,
      winRate: bt.winRate,
      totalReturn: bt.totalReturn,
      maxDrawdown: bt.maxDrawdown,
      sharpeRatio: bt.sharpeRatio,
      profitFactor: bt.profitFactor,
      initialCapital: bt.initialCapital,
      finalCapital: bt.finalCapital,
      status: bt.status,
      createdAt: bt.createdAt,
      completedAt: bt.completedAt,
    }));
  }),

  /**
   * Deletar um backtest
   */
  delete: protectedProcedure
    .input(z.object({ backtestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      // Buscar backtest
      const backtest = await db.query.backtests.findFirst({
        where: eq(backtests.id, input.backtestId),
      });

      if (!backtest) {
        throw new Error('Backtest not found');
      }

      // Verificar se pertence ao usuário
      if (backtest.userId !== ctx.user.id) {
        throw new Error('Unauthorized');
      }

      // Deletar
      await db.delete(backtests).where(eq(backtests.id, input.backtestId));

      return { success: true };
    }),

  /**
   * Comparar múltiplos backtests
   */
  compare: protectedProcedure
    .input(z.object({ backtestIds: z.array(z.number()).min(2).max(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');

      const results = await Promise.all(
        input.backtestIds.map(async (id) => {
          const bt = await db.query.backtests.findFirst({
            where: eq(backtests.id, id),
          });

          if (!bt || bt.userId !== ctx.user.id) {
            return null;
          }

          return {
            id: bt.id,
            strategyId: bt.strategyId,
            startDate: bt.startDate,
            endDate: bt.endDate,
            totalTrades: bt.totalTrades,
            winningTrades: bt.winningTrades,
            losingTrades: bt.losingTrades,
            winRate: bt.winRate,
            totalReturn: bt.totalReturn,
            maxDrawdown: bt.maxDrawdown,
            sharpeRatio: bt.sharpeRatio,
            profitFactor: bt.profitFactor,
            initialCapital: bt.initialCapital,
            finalCapital: bt.finalCapital,
          };
        })
      );

      return results.filter((r) => r !== null);
    }),
});
