import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { PaperTradingEngine } from '../trading/paper-trading-engine';
import { getDb } from '../db';
import { paperTrades } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const paperTradingRouter = router({
  /**
   * Abrir uma posição
   */
  openPosition: protectedProcedure
    .input(
      z.object({
        strategyId: z.number(),
        asset: z.string().min(1).max(10),
        type: z.enum(['buy', 'sell']),
        quantity: z.number().int().positive(),
        entryPrice: z.number().positive(),
        stopLoss: z.number().optional(),
        takeProfit: z.number().optional(),
        entryReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const trade = await PaperTradingEngine.openPosition({
        strategyId: input.strategyId,
        userId: ctx.user.id,
        asset: input.asset,
        type: input.type,
        quantity: input.quantity,
        entryPrice: input.entryPrice,
        stopLoss: input.stopLoss,
        takeProfit: input.takeProfit,
        entryReason: input.entryReason,
      });

      return { success: true, trade };
    }),

  /**
   * Fechar uma posição
   */
  closePosition: protectedProcedure
    .input(
      z.object({
        tradeId: z.number(),
        exitPrice: z.number().positive(),
        exitReason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verificar se trade pertence ao usuário
      const db = await getDb();
      if (!db) {
        console.warn('[PaperTrading] Database not available');
        throw new Error('Database not available');
      }

      const tradeResult = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.id, input.tradeId))
        .limit(1);
      const trade = tradeResult[0];

      if (!trade || trade.userId !== ctx.user.id) {
        throw new Error('Trade not found or unauthorized');
      }

      const closedTrade = await PaperTradingEngine.closePosition({
        tradeId: input.tradeId,
        exitPrice: input.exitPrice,
        exitReason: input.exitReason,
      });

      return { success: true, trade: closedTrade };
    }),

  /**
   * Cancelar uma posição
   */
  cancelPosition: protectedProcedure
    .input(z.object({ tradeId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        console.warn('[PaperTrading] Database not available');
        throw new Error('Database not available');
      }

      const tradeResult = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.id, input.tradeId))
        .limit(1);
      const trade = tradeResult[0];

      if (!trade || trade.userId !== ctx.user.id) {
        throw new Error('Trade not found or unauthorized');
      }

      await PaperTradingEngine.cancelPosition(input.tradeId);

      return { success: true };
    }),

  /**
   * Obter posições abertas
   */
  getOpenPositions: protectedProcedure.query(async ({ ctx }) => {
    try {
      const positions = await PaperTradingEngine.getOpenPositions(ctx.user.id);
      return positions;
    } catch (error) {
      console.error('[PaperTrading] Error getting open positions:', error);
      return [];
    }
  }),

  /**
   * Obter histórico de trades fechados
   */
  getClosedTrades: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      try {
        const trades = await PaperTradingEngine.getClosedTrades(ctx.user.id, input.limit);
        return trades;
      } catch (error) {
        console.error('[PaperTrading] Error getting closed trades:', error);
        return [];
      }
    }),

  /**
   * Obter todos os trades (abertos e fechados)
   */
  getAllTrades: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[PaperTrading] Database not available');
        return [];
      }

      const trades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, ctx.user.id))
        .orderBy(desc(paperTrades.entryTime));

      return trades.map((t) => ({
        id: t.id,
        strategyId: t.strategyId,
        asset: t.asset,
        type: t.type,
        quantity: t.quantity,
        entryPrice: Number(t.entryPrice),
        entryTime: t.entryTime,
        exitPrice: t.exitPrice ? Number(t.exitPrice) : undefined,
        exitTime: t.exitTime || undefined,
        status: t.status,
        profitLoss: t.profitLoss ? Number(t.profitLoss) : undefined,
        profitLossPercent: t.profitLossPercent ? Number(t.profitLossPercent) : undefined,
        entryReason: t.entryReason || undefined,
        exitReason: t.exitReason || undefined,
      }));
    } catch (error) {
      console.error('[PaperTrading] Error getting all trades:', error);
      return [];
    }
  }),

  /**
   * Obter PnL em tempo real de uma posição
   */
  getPositionPnL: protectedProcedure
    .input(z.object({ tradeId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          console.warn('[PaperTrading] Database not available');
          return { pnl: 0, pnlPercent: 0 };
        }

        const tradeResult = await db
          .select()
          .from(paperTrades)
          .where(eq(paperTrades.id, input.tradeId))
          .limit(1);
        const trade = tradeResult[0];

        if (!trade || trade.userId !== ctx.user.id) {
          throw new Error('Trade not found or unauthorized');
        }

        const pnl = await PaperTradingEngine.getPositionPnL(input.tradeId);
        return pnl;
      } catch (error) {
        console.error('[PaperTrading] Error getting position PnL:', error);
        return { pnl: 0, pnlPercent: 0 };
      }
    }),

  /**
   * Obter estatísticas de trades
   */
  getTradeStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        console.warn('[PaperTrading] Database not available');
        return {
          totalTrades: 0,
          openTrades: 0,
          closedTrades: 0,
          winningTrades: 0,
          losingTrades: 0,
          winRate: 0,
          totalProfit: 0,
          totalLoss: 0,
          avgWin: 0,
          avgLoss: 0,
          profitFactor: 0,
        };
      }

      const allTrades = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.userId, ctx.user.id));

      const closedTrades = allTrades.filter((t) => t.status === 'closed');
      const winningTrades = closedTrades.filter((t) => t.profitLoss && Number(t.profitLoss) > 0);
      const losingTrades = closedTrades.filter((t) => t.profitLoss && Number(t.profitLoss) < 0);

      const totalProfit = winningTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0);
      const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + Number(t.profitLoss || 0), 0));

      const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
      const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

      const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;

      return {
        totalTrades: allTrades.length,
        openTrades: allTrades.filter((t) => t.status === 'open').length,
        closedTrades: closedTrades.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate,
        totalProfit,
        totalLoss,
        avgWin,
        avgLoss,
        profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      };
    } catch (error) {
      console.error('[PaperTrading] Error getting trade stats:', error);
      return {
        totalTrades: 0,
        openTrades: 0,
        closedTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        totalLoss: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
      };
    }
  }),
});
