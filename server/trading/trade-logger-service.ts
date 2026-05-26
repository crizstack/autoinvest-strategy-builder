/**
 * Trade Logger Service
 * Registra todas as operações de trading para auditoria e análise
 */

import { getDb } from '../db';

export interface TradeLogEntry {
  tradeId: number;
  userId: number;
  strategyId: number;
  asset: string;
  action: 'open' | 'close' | 'monitor' | 'update_pnl' | 'sl_check' | 'tp_check' | string;
  details: {
    price?: number;
    quantity?: number;
    pnl?: number;
    pnlPercent?: number;
    reason?: string;
    signal?: string;
    stopLoss?: number;
    takeProfit?: number;
    [key: string]: any;
  };
  timestamp?: Date;
}

export class TradeLoggerService {
  /**
   * Registrar operação de trade
   */
  static async logTradeOperation(entry: TradeLogEntry): Promise<void> {
    try {
      const logMessage = this.formatLogMessage(entry);
      console.log(`[TradeLog] ${logMessage}`);

      // TODO: Persistir em tabela de logs quando implementada
      // await db.insert(tradeLogs).values({
      //   tradeId: entry.tradeId,
      //   userId: entry.userId,
      //   strategyId: entry.strategyId,
      //   asset: entry.asset,
      //   action: entry.action,
      //   details: JSON.stringify(entry.details),
      //   timestamp: entry.timestamp || new Date(),
      // });
    } catch (error) {
      console.error('[TradeLogger] Erro ao registrar operação:', error);
    }
  }

  /**
   * Formatar mensagem de log
   */
  private static formatLogMessage(entry: TradeLogEntry): string {
    const timestamp = entry.timestamp || new Date();
    const time = timestamp.toLocaleTimeString('pt-BR');

    switch (entry.action) {
      case 'open':
        return `[${time}] ✅ ABRIR: ${entry.asset} | Estratégia: ${entry.details.signal} | Qtd: ${entry.details.quantity} @ R$${entry.details.price} | SL: R$${entry.details.stopLoss} | TP: R$${entry.details.takeProfit}`;

      case 'close':
        return `[${time}] ❌ FECHAR: ${entry.asset} | Motivo: ${entry.details.reason} | P&L: R$${entry.details.pnl} (${entry.details.pnlPercent}%) | Preço: R$${entry.details.price}`;

      case 'update_pnl':
        return `[${time}] 📊 PnL ATUALIZADO: ${entry.asset} | P&L: R$${entry.details.pnl} (${entry.details.pnlPercent}%) | Preço: R$${entry.details.price}`;

      case 'sl_check':
        return `[${time}] 🔍 SL CHECK: ${entry.asset} | Preço: R$${entry.details.price} | SL: R$${entry.details.stopLoss} | Status: ${entry.details.triggered ? 'ACIONADO' : 'OK'}`;

      case 'tp_check':
        return `[${time}] 🔍 TP CHECK: ${entry.asset} | Preço: R$${entry.details.price} | TP: R$${entry.details.takeProfit} | Status: ${entry.details.triggered ? 'ACIONADO' : 'OK'}`;

      case 'monitor':
        return `[${time}] 👁️ MONITORANDO: ${entry.asset} | Preço: R$${entry.details.price} | P&L: R$${entry.details.pnl}`;

      default:
        return `[${time}] ${entry.action.toUpperCase()}: ${entry.asset}`;
    }
  }

  /**
   * Registrar abertura de trade
   */
  static async logTradeOpen(
    tradeId: number,
    userId: number,
    strategyId: number,
    asset: string,
    type: 'buy' | 'sell',
    quantity: number,
    price: number,
    stopLoss?: number,
    takeProfit?: number,
    reason?: string
  ): Promise<void> {
    await this.logTradeOperation({
      tradeId,
      userId,
      strategyId,
      asset,
      action: 'open',
      details: {
        signal: type.toUpperCase(),
        quantity,
        price,
        stopLoss,
        takeProfit,
        reason,
      },
    });
  }

  /**
   * Registrar fechamento de trade
   */
  static async logTradeClose(
    tradeId: number,
    userId: number,
    strategyId: number,
    asset: string,
    exitPrice: number,
    profitLoss: number,
    profitLossPercent: number,
    reason: string
  ): Promise<void> {
    await this.logTradeOperation({
      tradeId,
      userId,
      strategyId,
      asset,
      action: 'close',
      details: {
        price: exitPrice,
        pnl: profitLoss,
        pnlPercent: profitLossPercent,
        reason,
      },
    });
  }

  /**
   * Registrar atualização de PnL
   */
  static async logPnLUpdate(
    tradeId: number,
    userId: number,
    strategyId: number,
    asset: string,
    currentPrice: number,
    profitLoss: number,
    profitLossPercent: number
  ): Promise<void> {
    await this.logTradeOperation({
      tradeId,
      userId,
      strategyId,
      asset,
      action: 'update_pnl',
      details: {
        price: currentPrice,
        pnl: profitLoss,
        pnlPercent: profitLossPercent,
      },
    });
  }

  /**
   * Registrar verificação de stop loss
   */
  static async logStopLossCheck(
    tradeId: number,
    userId: number,
    strategyId: number,
    asset: string,
    currentPrice: number,
    stopLoss: number,
    triggered: boolean
  ): Promise<void> {
    await this.logTradeOperation({
      tradeId,
      userId,
      strategyId,
      asset,
      action: 'sl_check',
      details: {
        price: currentPrice,
        stopLoss,
        triggered,
      },
    });
  }

  /**
   * Registrar verificação de take profit
   */
  static async logTakeProfitCheck(
    tradeId: number,
    userId: number,
    strategyId: number,
    asset: string,
    currentPrice: number,
    takeProfit: number,
    triggered: boolean
  ): Promise<void> {
    await this.logTradeOperation({
      tradeId,
      userId,
      strategyId,
      asset,
      action: 'tp_check',
      details: {
        price: currentPrice,
        takeProfit,
        triggered,
      },
    });
  }
}
