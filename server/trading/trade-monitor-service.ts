/**
 * Trade Monitor Service
 * Monitora posições abertas e verifica stop loss/take profit
 * Responsável por fechar trades automaticamente quando SL/TP é acionado
 */

import { getDb } from '../db';
import { paperTrades } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getLatestCandle } from '../market/candles-service';
import { PaperTradingEngine } from './paper-trading-engine';
import { TradeLoggerService } from './trade-logger-service';

export interface MonitoringResult {
  tradeId: number;
  asset: string;
  currentPrice: number;
  slStatus: 'triggered' | 'ok' | 'no_sl';
  tpStatus: 'triggered' | 'ok' | 'no_tp';
  closed: boolean;
  reason?: string;
  pnl?: number;
  pnlPercent?: number;
}

export class TradeMonitorService {
  /**
   * Monitorar uma posição aberta
   */
  static async monitorPosition(trade: any): Promise<MonitoringResult> {
    const result: MonitoringResult = {
      tradeId: trade.id,
      asset: trade.asset,
      currentPrice: 0,
      slStatus: 'no_sl',
      tpStatus: 'no_tp',
      closed: false,
    };

    try {
      // 1. Buscar preço atual
      const latestCandle = await getLatestCandle(trade.asset);
      if (!latestCandle) {
        console.warn(`[TradeMonitor] Sem dados de mercado para ${trade.asset}`);
        return result;
      }

      result.currentPrice = latestCandle.close;

      const entryPrice = Number(trade.entryPrice);
      const stopLoss = trade.stopLoss ? Number(trade.stopLoss) : null;
      const takeProfit = trade.takeProfit ? Number(trade.takeProfit) : null;

      // 2. Verificar stop loss
      let slTriggered = false;
      if (stopLoss) {
        slTriggered =
          (trade.type === 'buy' && latestCandle.close <= stopLoss) ||
          (trade.type === 'sell' && latestCandle.close >= stopLoss);

        result.slStatus = slTriggered ? 'triggered' : 'ok';

        // Log de verificação de SL
        await TradeLoggerService.logStopLossCheck(
          trade.id,
          trade.userId,
          trade.strategyId,
          trade.asset,
          latestCandle.close,
          stopLoss,
          slTriggered
        );
      }

      // 3. Verificar take profit
      let tpTriggered = false;
      if (takeProfit) {
        tpTriggered =
          (trade.type === 'buy' && latestCandle.close >= takeProfit) ||
          (trade.type === 'sell' && latestCandle.close <= takeProfit);

        result.tpStatus = tpTriggered ? 'triggered' : 'ok';

        // Log de verificação de TP
        await TradeLoggerService.logTakeProfitCheck(
          trade.id,
          trade.userId,
          trade.strategyId,
          trade.asset,
          latestCandle.close,
          takeProfit,
          tpTriggered
        );
      }

      // 4. Fechar posição se SL ou TP foi acionado
      if (slTriggered || tpTriggered) {
        const exitPrice = slTriggered ? stopLoss : takeProfit;
        const exitReason = slTriggered
          ? `Stop Loss acionado @ R$${stopLoss?.toFixed(2)}`
          : `Take Profit acionado @ R$${takeProfit?.toFixed(2)}`;

        await PaperTradingEngine.closePosition({
          tradeId: trade.id,
          exitPrice: exitPrice || latestCandle.close,
          exitReason,
        });

        const profitLoss = PaperTradingEngine.calculateProfitLoss(trade, exitPrice || latestCandle.close);
        const profitLossPercent = (profitLoss / (entryPrice * trade.quantity)) * 100;

        result.closed = true;
        result.reason = exitReason;
        result.pnl = profitLoss;
        result.pnlPercent = profitLossPercent;

        console.log(
          `[TradeMonitor] ✅ Posição fechada: ${trade.asset} | ${exitReason} | P&L: R$${profitLoss.toFixed(2)} (${profitLossPercent.toFixed(2)}%)`
        );

        return result;
      }

      // 5. Atualizar PnL não realizado (mesmo que não tenha fechado)
      const profitLoss = PaperTradingEngine.calculateProfitLoss(trade, latestCandle.close);
      const profitLossPercent = (profitLoss / (entryPrice * trade.quantity)) * 100;

      const db = await getDb();
      if (db) {
        await db
          .update(paperTrades)
          .set({
            lastPriceCheck: new Date(),
            lastUnrealizedPnL: profitLoss.toString(),
          })
          .where(eq(paperTrades.id, trade.id));

        // Log de atualização de PnL
        await TradeLoggerService.logPnLUpdate(
          trade.id,
          trade.userId,
          trade.strategyId,
          trade.asset,
          latestCandle.close,
          profitLoss,
          profitLossPercent
        );
      }

      result.pnl = profitLoss;
      result.pnlPercent = profitLossPercent;

      return result;
    } catch (error) {
      console.error(`[TradeMonitor] Erro ao monitorar trade ${trade.id}:`, error);
      throw error;
    }
  }

  /**
   * Monitorar todas as posições abertas
   */
  static async monitorAllOpenPositions(): Promise<{
    monitored: number;
    closed: number;
    results: MonitoringResult[];
    errors: string[];
  }> {
    const db = await getDb();
    if (!db) {
      return { monitored: 0, closed: 0, results: [], errors: ['Database not available'] };
    }

    const result = {
      monitored: 0,
      closed: 0,
      results: [] as MonitoringResult[],
      errors: [] as string[],
    };

    try {
      // 1. Buscar todas as posições abertas
      const openPositions = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.status, 'open'));

      console.log(`[TradeMonitor] Monitorando ${openPositions.length} posições abertas`);

      // 2. Monitorar cada posição
      for (const trade of openPositions) {
        try {
          const monitorResult = await this.monitorPosition(trade);
          result.results.push(monitorResult);
          result.monitored++;

          if (monitorResult.closed) {
            result.closed++;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Trade ${trade.id}: ${errorMsg}`);
          console.error(`[TradeMonitor] Erro ao monitorar trade ${trade.id}:`, error);
        }
      }

      console.log(
        `[TradeMonitor] ✅ Monitoramento completo: ${result.monitored} posições, ${result.closed} fechadas`
      );

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Fatal error: ${errorMsg}`);
      console.error('[TradeMonitor] Erro fatal:', error);
      return result;
    }
  }

  /**
   * Obter status de uma posição aberta
   */
  static async getPositionStatus(tradeId: number): Promise<{
    trade: any;
    currentPrice: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    slDistance?: number;
    tpDistance?: number;
  } | null> {
    const db = await getDb();
    if (!db) return null;

    try {
      const trade = await db
        .select()
        .from(paperTrades)
        .where(eq(paperTrades.id, tradeId))
        .limit(1)
        .then((rows: any[]) => rows[0] || null);

      if (!trade || trade.status !== 'open') return null;

      const latestCandle = await getLatestCandle(trade.asset);
      if (!latestCandle) return null;

      const entryPrice = Number(trade.entryPrice);
      const currentPrice = latestCandle.close;
      const unrealizedPnL = PaperTradingEngine.calculateProfitLoss(trade, currentPrice);
      const unrealizedPnLPercent = (unrealizedPnL / (entryPrice * trade.quantity)) * 100;

      const stopLoss = trade.stopLoss ? Number(trade.stopLoss) : null;
      const takeProfit = trade.takeProfit ? Number(trade.takeProfit) : null;

      return {
        trade,
        currentPrice,
        unrealizedPnL,
        unrealizedPnLPercent,
        slDistance: stopLoss ? Math.abs(currentPrice - stopLoss) : undefined,
        tpDistance: takeProfit ? Math.abs(currentPrice - takeProfit) : undefined,
      };
    } catch (error) {
      console.error(`[TradeMonitor] Erro ao obter status do trade ${tradeId}:`, error);
      return null;
    }
  }
}
