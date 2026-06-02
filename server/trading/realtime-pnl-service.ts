/**
 * Realtime PnL Service
 * Atualiza PnL de posições abertas em tempo real
 * Fornece dados para dashboard e UI em tempo real
 */

import { getDb } from '../db';
import { paperTrades, portfolios } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { getLatestCandle } from '../market/candles-service';
import { PaperTradingEngine } from './paper-trading-engine';

export interface PositionPnLUpdate {
  tradeId: number;
  asset: string;
  currentPrice: number;
  entryPrice: number;
  quantity: number;
  type: 'buy' | 'sell';
  pnl: number;
  pnlPercent: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
}

export interface PortfolioPnLUpdate {
  userId: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  currentBalance: number;
  totalReturn: number;
  openPositionsCount: number;
  positions: PositionPnLUpdate[];
}

export class RealtimePnLService {
  /**
   * Obter PnL em tempo real de uma posição
   */
  static async getPositionPnLRealtime(tradeId: number): Promise<PositionPnLUpdate | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      const [trade] = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.id, tradeId))
        .limit(1);

      if (!trade || trade.status !== 'open') return null;

      const latestCandle = await getLatestCandle(trade.asset);
      if (!latestCandle) return null;

      const entryPrice = Number(trade.entryPrice);
      const currentPrice = latestCandle.close;
      const pnl = PaperTradingEngine.calculateProfitLoss(trade, currentPrice);
      const pnlPercent = (pnl / (entryPrice * trade.quantity)) * 100;

      return {
        tradeId: trade.id,
        asset: trade.asset,
        currentPrice,
        entryPrice,
        quantity: trade.quantity,
        type: trade.type,
        pnl,
        pnlPercent,
        unrealizedPnL: pnl,
        unrealizedPnLPercent: pnlPercent,
      };
    } catch (error) {
      console.error(`[RealtimePnL] Erro ao obter PnL de ${tradeId}:`, error);
      return null;
    }
  }

  /**
   * Obter PnL em tempo real de múltiplas posições
   */
  static async getMultiplePositionsPnL(tradeIds: number[]): Promise<PositionPnLUpdate[]> {
    const results: PositionPnLUpdate[] = [];

    for (const tradeId of tradeIds) {
      const pnlUpdate = await this.getPositionPnLRealtime(tradeId);
      if (pnlUpdate) {
        results.push(pnlUpdate);
      }
    }

    return results;
  }

  /**
   * Obter PnL em tempo real do portfolio do usuário
   */
  static async getPortfolioPnLRealtime(userId: number): Promise<PortfolioPnLUpdate | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      // 1. Buscar portfolio
      const [portfolio] = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.userId, userId))
        .limit(1);

      if (!portfolio) return null;

      // 2. Buscar posições abertas
      const openPositions = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')));

      // 3. Calcular PnL de cada posição
      const positionUpdates: PositionPnLUpdate[] = [];
      let totalUnrealizedPnL = 0;

      for (const trade of openPositions) {
        const pnlUpdate = await this.getPositionPnLRealtime(trade.id);
        if (pnlUpdate) {
          positionUpdates.push(pnlUpdate);
          totalUnrealizedPnL += pnlUpdate.unrealizedPnL;
        }
      }

      // 4. Calcular percentual total
      const initialBalance = Number(portfolio.initialBalance || 0);
      const totalUnrealizedPnLPercent =
        initialBalance > 0 ? (totalUnrealizedPnL / initialBalance) * 100 : 0;

      // 5. Calcular saldo atual (incluindo PnL não realizado)
      const currentBalance = Number(portfolio.currentBalance || 0) + totalUnrealizedPnL;
      const totalReturn = Number(portfolio.totalReturn || 0) + totalUnrealizedPnL;

      return {
        userId,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent,
        currentBalance,
        totalReturn,
        openPositionsCount: openPositions.length,
        positions: positionUpdates,
      };
    } catch (error) {
      console.error(`[RealtimePnL] Erro ao obter PnL do portfolio ${userId}:`, error);
      return null;
    }
  }

  /**
   * Atualizar PnL não realizado no banco (para persistência)
   */
  static async updateUnrealizedPnLInDatabase(userId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    try {
      // Buscar posições abertas
      const openPositions = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')));

      // Atualizar cada posição
      for (const trade of openPositions) {
        const latestCandle = await getLatestCandle(trade.asset);
        if (latestCandle) {
          const pnl = PaperTradingEngine.calculateProfitLoss(trade, latestCandle.close);

          await db
            .update(paperTrades)
            .set({
              lastUnrealizedPnL: pnl.toString(),
              lastPriceCheck: new Date(),
            })
            .where(eq(paperTrades.id, trade.id));
        }
      }

      console.log(`[RealtimePnL] ✅ PnL não realizado atualizado para usuário ${userId}`);
    } catch (error) {
      console.error(`[RealtimePnL] Erro ao atualizar PnL no banco:`, error);
    }
  }

  /**
   * Obter mudanças de PnL desde a última verificação
   */
  static async getPnLChanges(userId: number): Promise<{
    positions: Array<{
      tradeId: number;
      asset: string;
      pnlChange: number;
      pnlChangePercent: number;
      direction: 'up' | 'down' | 'neutral';
    }>;
    totalChange: number;
    totalChangePercent: number;
  }> {
    const db = await getDb();
    if (!db) {
      return { positions: [], totalChange: 0, totalChangePercent: 0 };
    }

    try {
      const openPositions = await db
        .select()
        .from(paperTrades)
        .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')));

      const positionChanges = [];
      let totalChange = 0;

      for (const trade of openPositions) {
        const latestCandle = await getLatestCandle(trade.asset);
        if (latestCandle) {
          const currentPnL = PaperTradingEngine.calculateProfitLoss(trade, latestCandle.close);
          const lastPnL = trade.lastUnrealizedPnL ? Number(trade.lastUnrealizedPnL) : 0;
          const pnlChange = currentPnL - lastPnL;
          const pnlChangePercent =
            lastPnL !== 0 ? (pnlChange / Math.abs(lastPnL)) * 100 : pnlChange > 0 ? 100 : 0;

          positionChanges.push({
            tradeId: trade.id,
            asset: trade.asset,
            pnlChange,
            pnlChangePercent,
            direction: (pnlChange > 0 ? 'up' : pnlChange < 0 ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
          });

          totalChange += pnlChange;
        }
      }

      const totalChangePercent =
        positionChanges.length > 0
          ? positionChanges.reduce((sum, p) => sum + p.pnlChangePercent, 0) / positionChanges.length
          : 0;

      return {
        positions: positionChanges as Array<{
          tradeId: number;
          asset: string;
          pnlChange: number;
          pnlChangePercent: number;
          direction: 'up' | 'down' | 'neutral';
        }>,
        totalChange,
        totalChangePercent,
      };
    } catch (error) {
      console.error(`[RealtimePnL] Erro ao obter mudanças de PnL:`, error);
      return { positions: [], totalChange: 0, totalChangePercent: 0 };
    }
  }
}
