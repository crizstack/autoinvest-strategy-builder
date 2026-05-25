/**
 * Motor de Backtest
 * Simula execução de estratégia em dados históricos
 */

import { StrategyExecutor, type MarketData } from '../strategy/executor';
import type { ExecutableStrategy, StrategyExecutionResult } from '../../shared/strategy-types';

export interface HistoricalCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface BacktestTrade {
  id: string;
  strategyId: string;
  type: 'buy' | 'sell' | 'close';
  entryTime: Date;
  entryPrice: number;
  quantity: number;
  exitTime?: Date;
  exitPrice?: number;
  profit?: number;
  profitPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
}

export interface BacktestResult {
  strategyId: string;
  asset: string;
  startDate: Date;
  endDate: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalProfit: number;
  totalReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: BacktestTrade[];
  executionResults: StrategyExecutionResult[];
  errors: string[];
}

export class BacktestEngine {
  /**
   * Executa backtest de uma estratégia
   */
  static async runBacktest(
    strategy: ExecutableStrategy,
    candles: HistoricalCandle[],
    initialCapital: number = 10000
  ): Promise<BacktestResult> {
    const startTime = Date.now();
    const trades: BacktestTrade[] = [];
    const executionResults: StrategyExecutionResult[] = [];
    const errors: string[] = [];
    let capital = initialCapital;
    let position: BacktestTrade | null = null;
    const equityCurve: number[] = [initialCapital];

    try {
      // Validar dados
      if (!candles || candles.length < 20) {
        errors.push('Backtest requer pelo menos 20 candles');
        return this.createEmptyResult(strategy, candles, errors);
      }

      // Executar estratégia para cada candle
      for (let i = 20; i < candles.length; i++) {
        const currentCandle = candles[i];
        const recentCandles = candles.slice(Math.max(0, i - 50), i + 1);

        // Preparar dados de mercado
        const marketData: MarketData = {
          asset: strategy.asset,
          currentPrice: currentCandle.close,
          previousPrice: i > 0 ? candles[i - 1].close : undefined,
          prices: recentCandles.map((c) => c.close),
          volumes: recentCandles.map((c) => c.volume),
          currentVolume: currentCandle.volume,
          timestamp: currentCandle.timestamp,
        };

        // Executar estratégia
        const executionResult = await StrategyExecutor.execute(strategy, marketData);
        executionResults.push(executionResult);

        // Processar sinal
        if (executionResult.signal === 'buy' && !position) {
          // Abrir posição
          const quantity = Math.floor(capital / currentCandle.close);
          if (quantity > 0) {
            position = {
              id: `trade-${trades.length + 1}`,
              strategyId: strategy.id,
              type: 'buy',
              entryTime: currentCandle.timestamp,
              entryPrice: currentCandle.close,
              quantity,
              stopLoss: executionResult.riskLevels?.stopLoss,
              takeProfit: executionResult.riskLevels?.takeProfit,
            };
            capital -= quantity * currentCandle.close;
          }
        } else if (executionResult.signal === 'sell' && position) {
          // Fechar posição
          const exitPrice = currentCandle.close;
          const profit = position.quantity * (exitPrice - position.entryPrice);
          const profitPercent = (profit / (position.quantity * position.entryPrice)) * 100;

          position.exitTime = currentCandle.timestamp;
          position.exitPrice = exitPrice;
          position.profit = profit;
          position.profitPercent = profitPercent;

          trades.push(position);
          capital += position.quantity * exitPrice;
          position = null;
        }

        // Verificar stop loss e take profit
        if (position) {
          const currentProfit = position.quantity * (currentCandle.close - position.entryPrice);
          const currentProfitPercent = (currentProfit / (position.quantity * position.entryPrice)) * 100;

          // Stop Loss
          if (position.stopLoss && currentProfitPercent <= -position.stopLoss) {
            const exitPrice = currentCandle.close;
            const profit = position.quantity * (exitPrice - position.entryPrice);

            position.exitTime = currentCandle.timestamp;
            position.exitPrice = exitPrice;
            position.profit = profit;
            position.profitPercent = -position.stopLoss;

            trades.push(position);
            capital += position.quantity * exitPrice;
            position = null;
          }
          // Take Profit
          else if (position.takeProfit && currentProfitPercent >= position.takeProfit) {
            const exitPrice = currentCandle.close;
            const profit = position.quantity * (exitPrice - position.entryPrice);

            position.exitTime = currentCandle.timestamp;
            position.exitPrice = exitPrice;
            position.profit = profit;
            position.profitPercent = position.takeProfit;

            trades.push(position);
            capital += position.quantity * exitPrice;
            position = null;
          }
        }

        equityCurve.push(capital);
      }

      // Fechar posição aberta ao final
      if (position && candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        const exitPrice = lastCandle.close;
        const profit = position.quantity * (exitPrice - position.entryPrice);

        position.exitTime = lastCandle.timestamp;
        position.exitPrice = exitPrice;
        position.profit = profit;
        position.profitPercent = (profit / (position.quantity * position.entryPrice)) * 100;

        trades.push(position);
        capital += position.quantity * exitPrice;
      }

      // Calcular métricas
      const winningTrades = trades.filter((t) => t.profit && t.profit > 0).length;
      const losingTrades = trades.filter((t) => t.profit && t.profit < 0).length;
      const totalProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0);
      const totalReturn = ((capital - initialCapital) / initialCapital) * 100;
      const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
      const maxDrawdown = this.calculateMaxDrawdown(equityCurve);
      const sharpeRatio = this.calculateSharpeRatio(equityCurve);

      return {
        strategyId: strategy.id,
        asset: strategy.asset,
        startDate: candles[0].timestamp,
        endDate: candles[candles.length - 1].timestamp,
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        winRate,
        totalProfit,
        totalReturn,
        maxDrawdown,
        sharpeRatio,
        trades,
        executionResults,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.createEmptyResult(strategy, candles, errors);
    }
  }

  /**
   * Calcula drawdown máximo
   */
  private static calculateMaxDrawdown(equityCurve: number[]): number {
    let maxDrawdown = 0;
    let peak = equityCurve[0];

    for (const value of equityCurve) {
      if (value > peak) {
        peak = value;
      }
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calcula Sharpe Ratio
   */
  private static calculateSharpeRatio(equityCurve: number[], riskFreeRate: number = 0.02): number {
    if (equityCurve.length < 2) return 0;

    // Calcular retornos diários
    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1];
      returns.push(dailyReturn);
    }

    // Média de retornos
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Desvio padrão
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    // Sharpe Ratio = (Retorno Médio - Taxa Livre de Risco) / Desvio Padrão
    const sharpeRatio = (avgReturn - riskFreeRate / 252) / stdDev * Math.sqrt(252);

    return Math.round(sharpeRatio * 100) / 100;
  }

  /**
   * Cria resultado vazio
   */
  private static createEmptyResult(
    strategy: ExecutableStrategy,
    candles: HistoricalCandle[],
    errors: string[]
  ): BacktestResult {
    return {
      strategyId: strategy.id,
      asset: strategy.asset,
      startDate: candles[0]?.timestamp || new Date(),
      endDate: candles[candles.length - 1]?.timestamp || new Date(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalProfit: 0,
      totalReturn: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      trades: [],
      executionResults: [],
      errors,
    };
  }
}
