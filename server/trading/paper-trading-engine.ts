/**
 * Paper Trading Engine
 * Motor de paper trading com operações simuladas em tempo real
 * Gerencia abertura, fechamento e monitoramento de posições
 */

import { getDb } from '../db';
import { paperTrades, portfolios, users } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
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

    const tradeId = Number(result.insertId);

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
    const trade = await db.query.paperTrades.findFirst({
      where: eq(paperTrades.id, request.tradeId),
    });

    if (!trade) throw new Error('Trade not found');
    if (trade.status !== 'open') throw new Error('Trade is not open');

    const now = new Date();
    const entryPrice = Number(trade.entryPrice);
    const exitPrice = request.exitPrice;

    // Calcular PnL
    let profitLoss: number;
    if (trade.type === 'buy') {
      profitLoss = trade.quantity * (exitPrice - entryPrice);
    } else {
      profitLoss = trade.quantity * (entryPrice - exitPrice);
    }

    const profitLossPercent = (profitLoss / (trade.quantity * entryPrice)) * 100;

    // Atualizar trade
    await db
      .update(paperTrades)
      .set({
        exitPrice: exitPrice.toString(),
        exitTime: now,
        status: 'closed',
        profitLoss: profitLoss.toString(),
        profitLossPercent: profitLossPercent.toString(),
        exitReason: request.exitReason,
      })
      .where(eq(paperTrades.id, request.tradeId));

    // Atualizar portfolio
    await this.updatePortfolioOnTradeClose(trade.userId, profitLoss, profitLossPercent > 0);

    // Log
    const result = profitLoss > 0 ? '✅' : '❌';
    console.log(`${result} Posição fechada: ${trade.asset} @ R$${exitPrice} | P&L: R$${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`);

    return {
      id: trade.id,
      strategyId: trade.strategyId,
      userId: trade.userId,
      asset: trade.asset,
      type: trade.type,
      quantity: trade.quantity,
      entryPrice,
      entryTime: trade.entryTime,
      exitPrice,
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

    const trade = await db.query.paperTrades.findFirst({
      where: eq(paperTrades.id, tradeId),
    });

    if (!trade) throw new Error('Trade not found');
    if (trade.status !== 'open') throw new Error('Trade is not open');

    // Atualizar trade
    await db
      .update(paperTrades)
      .set({ status: 'canceled' })
      .where(eq(paperTrades.id, tradeId));

    // Reverter portfolio
    await this.updatePortfolioOnTradeCancel(trade.userId, trade.quantity, Number(trade.entryPrice), trade.type);

    console.log(`🚫 Posição cancelada: ${trade.asset}`);
  }

  /**
   * Monitorar posições abertas para stop loss/take profit
   */
  static async monitorOpenPositions(userId: number): Promise<void> {
    const db = await getDb();
    if (!db) return;

    // Buscar todas as posições abertas do usuário
    const openTrades = await db.query.paperTrades.findMany({
      where: and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')),
    });

    for (const trade of openTrades) {
      try {
        // Buscar preço atual
        const latestCandle = await getLatestCandle(trade.asset);
        if (!latestCandle) continue;

        const currentPrice = latestCandle.close;
        const entryPrice = Number(trade.entryPrice);

        // Verificar stop loss
        if (trade.type === 'buy') {
          const loss = ((currentPrice - entryPrice) / entryPrice) * 100;
          // Se houver stop loss definido e foi acionado
          // (implementar lógica de stop loss aqui)
        } else {
          const loss = ((entryPrice - currentPrice) / entryPrice) * 100;
          // Se houver stop loss definido e foi acionado
        }
      } catch (error) {
        console.error(`Erro ao monitorar ${trade.asset}:`, error);
      }
    }
  }

  /**
   * Obter todas as posições abertas do usuário
   */
  static async getOpenPositions(userId: number): Promise<PaperTrade[]> {
    const db = await getDb();
    if (!db) return [];

    const trades = await db.query.paperTrades.findMany({
      where: and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'open')),
    });

    return trades.map((t) => ({
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
   * Obter histórico de trades fechados
   */
  static async getClosedTrades(userId: number, limit: number = 50): Promise<PaperTrade[]> {
    const db = await getDb();
    if (!db) return [];

    const trades = await db.query.paperTrades.findMany({
      where: and(eq(paperTrades.userId, userId), eq(paperTrades.status, 'closed')),
      limit,
    });

    return trades.map((t) => ({
      id: t.id,
      strategyId: t.strategyId,
      userId: t.userId,
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
  }

  /**
   * Obter PnL em tempo real de uma posição aberta
   */
  static async getPositionPnL(tradeId: number): Promise<{ profitLoss: number; profitLossPercent: number } | null> {
    const db = await getDb();
    if (!db) return null;

    const trade = await db.query.paperTrades.findFirst({
      where: eq(paperTrades.id, tradeId),
    });

    if (!trade || trade.status !== 'open') return null;

    try {
      const latestCandle = await getLatestCandle(trade.asset);
      if (!latestCandle) return null;

      const currentPrice = latestCandle.close;
      const entryPrice = Number(trade.entryPrice);

      let profitLoss: number;
      if (trade.type === 'buy') {
        profitLoss = trade.quantity * (currentPrice - entryPrice);
      } else {
        profitLoss = trade.quantity * (entryPrice - currentPrice);
      }

      const profitLossPercent = (profitLoss / (trade.quantity * entryPrice)) * 100;

      return { profitLoss, profitLossPercent };
    } catch (error) {
      console.error(`Erro ao calcular PnL de ${trade.asset}:`, error);
      return null;
    }
  }

  /**
   * Atualizar portfolio ao abrir posição
   */
  private static async updatePortfolioOnTradeOpen(
    userId: number,
    quantity: number,
    price: number,
    type: 'buy' | 'sell'
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    if (!portfolio) return;

    const cost = quantity * price;
    const newBalance = Number(portfolio.currentBalance) - cost;

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
  private static async updatePortfolioOnTradeClose(userId: number, profitLoss: number, isWin: boolean): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    if (!portfolio) return;

    const newBalance = Number(portfolio.currentBalance) + profitLoss;
    const newTotalTrades = (portfolio.totalTrades || 0) + 1;
    const newWinningTrades = (portfolio.winningTrades || 0) + (isWin ? 1 : 0);
    const newWinRate = (newWinningTrades / newTotalTrades) * 100;
    const newTotalReturn = ((newBalance - Number(portfolio.initialBalance)) / Number(portfolio.initialBalance)) * 100;

    await db
      .update(portfolios)
      .set({
        currentBalance: newBalance.toString(),
        totalTrades: newTotalTrades,
        winningTrades: newWinningTrades,
        winRate: newWinRate.toString(),
        totalReturn: newTotalReturn.toString(),
      })
      .where(eq(portfolios.userId, userId));
  }

  /**
   * Atualizar portfolio ao cancelar posição
   */
  private static async updatePortfolioOnTradeCancel(
    userId: number,
    quantity: number,
    price: number,
    type: 'buy' | 'sell'
  ): Promise<void> {
    const db = await getDb();
    if (!db) return;

    const portfolio = await db.query.portfolios.findFirst({
      where: eq(portfolios.userId, userId),
    });

    if (!portfolio) return;

    const cost = quantity * price;
    const newBalance = Number(portfolio.currentBalance) + cost;

    await db
      .update(portfolios)
      .set({
        currentBalance: newBalance.toString(),
      })
      .where(eq(portfolios.userId, userId));
  }
}
