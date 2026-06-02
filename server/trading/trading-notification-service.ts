/**
 * Trading Notification Service
 * Notifica usuários sobre eventos de trading (abertura, fechamento, SL/TP)
 */

import { notifyOwner } from '../_core/notification';

export interface TradeNotification {
  type: 'trade_opened' | 'trade_closed' | 'stop_loss_hit' | 'take_profit_hit' | 'pnl_milestone';
  tradeId: number;
  asset: string;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  pnlPercent?: number;
  reason?: string;
}

export class TradingNotificationService {
  /**
   * Notificar abertura de trade
   */
  static async notifyTradeOpened(
    userId: number,
    tradeId: number,
    asset: string,
    quantity: number,
    entryPrice: number,
    strategyName?: string
  ): Promise<boolean> {
    try {
      const title = `📈 Trade Aberto: ${asset}`;
      const content = `
Estratégia: ${strategyName || 'Manual'}
Ativo: ${asset}
Quantidade: ${quantity} unidades
Preço de Entrada: R$ ${entryPrice.toFixed(2)}
Horário: ${new Date().toLocaleString('pt-BR')}

Seu trade foi aberto com sucesso. Acompanhe o monitoramento automático de Stop Loss e Take Profit.
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Notificação de trade aberto enviada para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao notificar trade aberto:`, error);
      return false;
    }
  }

  /**
   * Notificar fechamento de trade
   */
  static async notifyTradeClosed(
    userId: number,
    tradeId: number,
    asset: string,
    quantity: number,
    entryPrice: number,
    exitPrice: number,
    pnl: number,
    pnlPercent: number,
    reason: string = 'Fechamento manual'
  ): Promise<boolean> {
    try {
      const isProfit = pnl > 0;
      const emoji = isProfit ? '✅' : '❌';
      const title = `${emoji} Trade Fechado: ${asset} ${isProfit ? 'LUCRO' : 'PREJUÍZO'}`;

      const content = `
Ativo: ${asset}
Quantidade: ${quantity} unidades
Preço de Entrada: R$ ${entryPrice.toFixed(2)}
Preço de Saída: R$ ${exitPrice.toFixed(2)}
Motivo: ${reason}

Resultado:
P&L: R$ ${pnl.toFixed(2)}
Retorno: ${pnlPercent > 0 ? '+' : ''}${pnlPercent.toFixed(2)}%

Horário: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Notificação de trade fechado enviada para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao notificar trade fechado:`, error);
      return false;
    }
  }

  /**
   * Notificar acionamento de Stop Loss
   */
  static async notifyStopLossHit(
    userId: number,
    tradeId: number,
    asset: string,
    quantity: number,
    entryPrice: number,
    stopLossPrice: number,
    currentPrice: number,
    pnl: number
  ): Promise<boolean> {
    try {
      const title = `🛑 Stop Loss Acionado: ${asset}`;
      const content = `
Ativo: ${asset}
Quantidade: ${quantity} unidades
Preço de Entrada: R$ ${entryPrice.toFixed(2)}
Stop Loss: R$ ${stopLossPrice.toFixed(2)}
Preço Atual: R$ ${currentPrice.toFixed(2)}

Resultado: -R$ ${Math.abs(pnl).toFixed(2)}

Seu stop loss foi acionado. O trade foi fechado automaticamente para limitar perdas.
Horário: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Notificação de Stop Loss enviada para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao notificar Stop Loss:`, error);
      return false;
    }
  }

  /**
   * Notificar acionamento de Take Profit
   */
  static async notifyTakeProfitHit(
    userId: number,
    tradeId: number,
    asset: string,
    quantity: number,
    entryPrice: number,
    takeProfitPrice: number,
    currentPrice: number,
    pnl: number,
    pnlPercent: number
  ): Promise<boolean> {
    try {
      const title = `🎯 Take Profit Acionado: ${asset}`;
      const content = `
Ativo: ${asset}
Quantidade: ${quantity} unidades
Preço de Entrada: R$ ${entryPrice.toFixed(2)}
Take Profit: R$ ${takeProfitPrice.toFixed(2)}
Preço Atual: R$ ${currentPrice.toFixed(2)}

Resultado: +R$ ${pnl.toFixed(2)} (+${pnlPercent.toFixed(2)}%)

Parabéns! Seu take profit foi acionado. O trade foi fechado com lucro.
Horário: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Notificação de Take Profit enviada para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao notificar Take Profit:`, error);
      return false;
    }
  }

  /**
   * Notificar atingimento de meta de P&L
   */
  static async notifyPnLMilestone(
    userId: number,
    milestone: number,
    currentPnL: number,
    currentPnLPercent: number
  ): Promise<boolean> {
    try {
      const title = `🏆 Meta de P&L Atingida: R$ ${milestone.toLocaleString('pt-BR')}`;
      const content = `
Você atingiu uma meta importante de P&L!

Meta: R$ ${milestone.toLocaleString('pt-BR')}
P&L Atual: R$ ${currentPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Retorno: ${currentPnLPercent.toFixed(2)}%

Continue acompanhando suas estratégias e operações.
Horário: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Notificação de meta de P&L enviada para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao notificar meta de P&L:`, error);
      return false;
    }
  }

  /**
   * Notificar resumo diário de operações
   */
  static async notifyDailySummary(
    userId: number,
    totalTrades: number,
    winningTrades: number,
    totalPnL: number,
    totalPnLPercent: number
  ): Promise<boolean> {
    try {
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const emoji = totalPnL > 0 ? '📈' : '📉';

      const title = `${emoji} Resumo Diário de Operações`;
      const content = `
Operações Realizadas: ${totalTrades}
Operações Lucrativas: ${winningTrades}
Taxa de Acerto: ${winRate.toFixed(1)}%

P&L do Dia: R$ ${totalPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
Retorno: ${totalPnLPercent.toFixed(2)}%

Acompanhe seu desempenho no Dashboard.
Horário: ${new Date().toLocaleString('pt-BR')}
      `.trim();

      const result = await notifyOwner({ title, content });
      console.log(`[TradingNotification] ✅ Resumo diário enviado para usuário ${userId}`);
      return result;
    } catch (error) {
      console.error(`[TradingNotification] Erro ao enviar resumo diário:`, error);
      return false;
    }
  }
}
