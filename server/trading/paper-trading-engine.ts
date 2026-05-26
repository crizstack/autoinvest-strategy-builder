/**
 * Paper Trading Engine
 * Motor de paper trading com operações simuladas em tempo real
 * Gerencia abertura, fechamento e monitoramento de posições
 */

import { getDb } from '../db';
import { paperTrades, portfolios, users } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getLatestCandle } from '../market/candles-service';

export interface OpenPositionRequest {
  strategyId: number;
  userId: number;
  asset: string;
  type: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  entryReason?: string;
}

export interface ClosePositionRequest {
  tradeId: number;
  exitPrice: number;
  exitReason?: string;
}

export interface PaperTrade {
  id: number;
  strategyId: number;
  userId: number;
  asset: string;
  type: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  entryTime: Date;
  exitPrice?: number;
  exitTime?: Date;
  status: 'open' | 'closed' | 'canceled';
  profitLoss?: number;
  profitLossPercent?: number;
  entryReason?: string;
  exitReason?: string;
}

export class PaperTradingEngine {
  /**
   * Abrir uma posição
   */
  static async openPosition(request: OpenPositionRequest): Promise<PaperTrade> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const now = new Date();

    // Inserir trade
    const result = await db.insert(paperTrades).values({
      strategyId: request.strategyId,
      userId: request.userId,
      asset: request.asset,
      type: request.type,
      quantity: request.quantity,
      entryPrice: request.entryPrice.toString(),
      entryTime: now,
      status: 'open',
      entryReason: request.entryReason,
    });

    // Buscar o trade criado para obter o ID
    const createdTrade = await db.select().from(paperTrades)
      .where(and(eq(paperTrades.userId, request.userId), eq(paperTrades.asset, request.asset)))
      .orderBy(desc(paperTrades.entryTime))
      .limit(1)
      .then(rows => rows[0]);
    
    const tradeId = createdTrade?.id || 0;

    // Atualizar portfolio
    await this.updatePortfolioOnTradeOpen(request.userId, request.quantity, request.entryPrice, request.type);

    // Log
    console.log(`📈 Posição aberta: ${request.asset} ${request.type.toUpperCase()} x${request.quantity} @ R$${request.entryPrice}`);

    return {
      id: tradeId,
      strategyId: request.strategyId,
      userId: request.userId,
      asset: request.asset,
      type: request.type,
      quantity: request.quantity,
      entryPrice: request.entryPrice,
      entryTime: now,
      status: 'open',
      entryReason: request.entryReason,
    };
  }

  /**
   * Fechar uma posição
   */
  static async closePosition(request: ClosePositionRequest): Promise<PaperTrade> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Buscar trade
    const [trade] = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.id, request.tradeId))
      .limit(1);

    if (!trade) throw new Error(`Trade ${request.tradeId} not found`);
    if (trade.status !== 'open') throw new Error(`Trade ${request.tradeId} is not open`);

    const now = new Date();
    const profitLoss = this.calculateProfitLoss(trade, request.exitPrice);
    const profitLossPercent = (profitLoss / (Number(trade.entryPrice) * trade.quantity)) * 100;

    // Atualizar trade
    await db
      .update(paperTrades)
      .set({
        exitPrice: request.exitPrice.toString(),
        exitTime: now,
        status: 'closed',
        profitLoss: profitLoss.toString(),
        profitLossPercent: profitLossPercent.toString(),
        exitReason: request.exitReason,
      })
      .where(eq(paperTrades.id, request.tradeId));

    // Atualizar portfolio
    await this.updatePortfolioOnTradeClose(trade.userId, profitLoss);

    // Log
    console.log(`📉 Posição fechada: ${trade.asset} ${trade.type.toUpperCase()} | P&L: R$${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`);

    return {
      id: trade.id,
      strategyId: trade.strategyId,
      userId: trade.userId,
      asset: trade.asset,
      type: trade.type,
      quantity: trade.quantity,
      entryPrice: Number(trade.entryPrice),
      entryTime: trade.entryTime,
      exitPrice: request.exitPrice,
      exitTime: now,
      status: 'closed',
      profitLoss,
      profitLossPercent,
      entryReason: trade.entryReason || undefined,
      exitReason: request.exitReason,
    };
  }

  /**
   * Cancelar uma posição
   */
  static async cancelPosition(tradeId: number): Promise<void> {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const [trade] = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.id, tradeId))
      .limit(1);

    if (!trade) throw new Error(`Trade ${tradeId} not found`);
    if (trade.status !== 'open') throw new Error(`Trade ${tradeId} is not open`);

    await db
      .update(paperTrades)
      .set({
        status: 'canceled',
        exitTime: new Date(),
      })
      .where(eq(paperTrades.id, tradeId));

    console.log(`❌ Posição cancelada: ${trade.asset}`);
  }

  /**
   * Obter posições abertas
   */
  static async getOpenPositions(userId: number): Promise<PaperTrade[]> {
    const db = await getDb();
    if (!db) return [];

    const trades = await db
      .select()
      .from(paperTrades)
      .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')));

    return trades.map((t: any) => ({
      id: t.id,
      strategyId: t.strategyId,
      userId: t.userId,
      asset: t.asset,
      type: t.type,
      quantity: t.quantity,
      entryPrice: Number(t.entryPrice),
      entryTime: t.entryTime,
      status: t.status,
      entryReason: t.entryReason || undefined,
    }));
  }

  /**
   * Obter trades fechados
   */
  static async getClosedTrades(userId: number, limit: number = 100): Promise<PaperTrade[]> {
    const db = await getDb();
    if (!db) return [];

    const trades = await db
      .select()
      .from(paperTrades)
      .where(and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'closed')))
      .limit(limit);

    return trades.map((t: any) => ({
      id: t.id,
      strategyId: t.strategyId,
      userId: t.userId,
      asset: t.asset,
      type: t.type,
      quantity: t.quantity,
      entryPrice: Number(t.entryPrice),
      entryTime: t.entryTime,
      exitPrice: t.exitPrice ? Number(t.exitPrice) : undefined,
      exitTime: t.exitTime,
      status: t.status,
      profitLoss: t.profitLoss ? Number(t.profitLoss) : undefined,
      profitLossPercent: t.profitLossPercent ? Number(t.profitLossPercent) : undefined,
      entryReason: t.entryReason || undefined,
      exitReason: t.exitReason || undefined,
    }));
  }

  /**
   * Obter todos os trades
   */
  static async getAllTrades(userId: number, limit: number = 100): Promise<PaperTrade[]> {
    const db = await getDb();
    if (!db) return [];

    const trades = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.userId, userId))
      .limit(limit);

    return trades.map((t: any) => ({
      id: t.id,
      strategyId: t.strategyId,
      userId: t.userId,
      asset: t.asset,
      type: t.type,
      quantity: t.quantity,
      entryPrice: Number(t.entryPrice),
      entryTime: t.entryTime,
      exitPrice: t.exitPrice ? Number(t.exitPrice) : undefined,
      exitTime: t.exitTime,
      status: t.status,
      profitLoss: t.profitLoss ? Number(t.profitLoss) : undefined,
      profitLossPercent: t.profitLossPercent ? Number(t.profitLossPercent) : undefined,
      entryReason: t.entryReason || undefined,
      exitReason: t.exitReason || undefined,
    }));
  }

  /**
   * Obter PnL de uma posição aberta
   */
  static async getPositionPnL(tradeId: number): Promise<{ profitLoss: number; profitLossPercent: number } | null> {
    const db = await getDb();
    if (!db) return null;

    const [trade] = await db
      .select()
      .from(paperTrades)
      .where(eq(paperTrades.id, tradeId))
      .limit(1);

    if (!trade || trade.status !== 'open') return null;

    try {
      const latestCandle = await getLatestCandle(trade.asset);
      if (!latestCandle) return null;

      const profitLoss = this.calculateProfitLoss(trade, latestCandle.close);
      const profitLossPercent = (profitLoss / (Number(trade.entryPrice) * trade.quantity)) * 100;

      return { profitLoss, profitLossPercent };
    } catch (error) {
      console.error(`Erro ao calcular PnL de ${tradeId}:`, error);
      return null;
    }
  }

  /**
   * Atualizar portfolio ao abrir posição
   */
  private static async updatePortfolioOnTradeOpen(userId: number, quantity: number, entryPrice: number, type: 'buy' | 'sell'): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .limit(1);

    if (!portfolio) return;

    const cost = quantity * entryPrice;
    const newBalance = Number(portfolio.currentBalance || 0) - cost;

    await db
      .update(portfolios)
      .set({
        currentBalance: newBalance.toString(),
      })
      .where(eq(portfolios.userId, userId));
  }

  /**
   * Atualizar portfolio ao fechar posição
   */
  private static async updatePortfolioOnTradeClose(userId: number, profitLoss: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId))
      .limit(1);

    if (!portfolio) return;

    const newBalance = Number(portfolio.currentBalance || 0) + profitLoss;
    const newTotalReturn = Number(portfolio.totalReturn || 0) + profitLoss;
    const totalTrades = (portfolio.totalTrades || 0) + 1;
    const winningTrades = profitLoss > 0 ? (portfolio.winningTrades || 0) + 1 : portfolio.winningTrades || 0;
    const winRate = (winningTrades / totalTrades) * 100;

    await db
      .update(portfolios)
      .set({
        currentBalance: newBalance.toString(),
        totalReturn: newTotalReturn.toString(),
        totalTrades,
        winningTrades,
        winRate: winRate.toString(),
      })
      .where(eq(portfolios.userId, userId));
  }

  /**
   * Calcular lucro/prejuízo
   */
  private static calculateProfitLoss(trade: any, exitPrice: number): number {
    const entryPrice = Number(trade.entryPrice);
    if (trade.type === 'buy') {
      return (exitPrice - entryPrice) * trade.quantity;
    } else {
      return (entryPrice - exitPrice) * trade.quantity;
    }
  }
}
