/**
 * Quantitative Backtest Engine
 * Motor de backtest quantitativo com cálculos reais
 * Executa candle por candle e calcula métricas profissionais
 */

import { StrategyExecutorV2, type MarketData } from '../strategy/executor-v2';
import type { ExecutableStrategy, StrategyExecutionResult } from '../../shared/strategy-types';

export interface HistoricalCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Trade {
  id: string;
  entryTime: Date;
  entryPrice: number;
  entrySignal: string;
  quantity: number;
  exitTime?: Date;
  exitPrice?: number;
  exitSignal?: string;
  profit?: number;
  profitPercent?: number;
  stopLoss?: number;
  takeProfit?: number;
  durationDays?: number;
}

export interface QuantitativeMetrics {
  // Retorno
  totalReturn: number; // %
  totalProfit: number; // R$
  totalLoss: number; // R$

  // Operações
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // %

  // Risco
  maxDrawdown: number; // %
  maxDrawdownValue: number; // R$
  averageDrawdown: number; // %

  // Rentabilidade
  profitFactor: number; // lucro total / perda total
  recoveryFactor: number; // lucro total / max drawdown
  avgWin: number; // R$
  avgLoss: number; // R$
  avgWinPercent: number; // %
  avgLossPercent: number; // %
  profitLossRatio: number; // avg win / avg loss

  // Risco-Retorno
  sharpeRatio: number;
  sortinoRatio: number;
  camarRatio: number;

  // Sequências
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  avgTradeDuration: number; // dias

  // Expectativa
  expectancy: number; // lucro esperado por trade
  payoffRatio: number; // (win% * avg win) / (loss% * avg loss)
}

export interface QuantitativeBacktestResult {
  strategyId: string;
  asset: string;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
  metrics: QuantitativeMetrics;
  trades: Trade[];
  equityCurve: Array<{ timestamp: Date; value: number }>;
  drawdownCurve: Array<{ timestamp: Date; value: number }>;
  executionResults: StrategyExecutionResult[];
  errors: string[];
}

export class QuantitativeBacktestEngine {
  /**
   * Executar backtest quantitativo
   */
  static async runBacktest(
    strategy: ExecutableStrategy,
    candles: HistoricalCandle[],
    initialCapital: number = 10000
  ): Promise<QuantitativeBacktestResult> {
    const trades: Trade[] = [];
    const executionResults: StrategyExecutionResult[] = [];
    const errors: string[] = [];
    const equityCurve: Array<{ timestamp: Date; value: number }> = [];
    const drawdownCurve: Array<{ timestamp: Date; value: number }> = [];

    let capital = initialCapital;
    let position: Trade | null = null;
    let peak = initialCapital;

    try {
      // Validar dados
      if (!candles || candles.length < 20) {
        errors.push('Backtest requer pelo menos 20 candles');
        return this.createEmptyResult(strategy, candles, initialCapital, errors);
      }

      // Executar estratégia para cada candle
      for (let i = 20; i < candles.length; i++) {
        const currentCandle = candles[i];
        const recentCandles = candles.slice(Math.max(0, i - 100), i + 1);

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
        const executionResult = await StrategyExecutorV2.execute(strategy, marketData);
        executionResults.push(executionResult);

        // Processar sinal
        if (executionResult.signal === 'buy' && !position) {
          // Abrir posição
          const quantity = Math.floor(capital / currentCandle.close);
          if (quantity > 0) {
            position = {
              id: `trade-${trades.length + 1}`,
              entryTime: currentCandle.timestamp,
              entryPrice: currentCandle.close,
              entrySignal: executionResult.signal,
              quantity,
              stopLoss: executionResult.riskLevels?.stopLoss,
              takeProfit: executionResult.riskLevels?.takeProfit,
            };
            capital -= quantity * currentCandle.close;
          }
        } else if (executionResult.signal === 'sell' && position) {
          // Fechar posição por sinal
          this.closePosition(position, currentCandle, executionResult.signal, trades);
          capital += position.quantity * currentCandle.close + (position.profit || 0);
          position = null;
        }

        // Verificar stop loss e take profit
        if (position) {
          const currentProfit = position.quantity * (currentCandle.close - position.entryPrice);
          const currentProfitPercent = (currentProfit / (position.quantity * position.entryPrice)) * 100;

          // Stop Loss
          if (position.stopLoss && currentProfitPercent <= -position.stopLoss) {
            this.closePosition(position, currentCandle, 'stop_loss', trades);
            capital += position.quantity * currentCandle.close + (position.profit || 0);
            position = null;
          }
          // Take Profit
          else if (position.takeProfit && currentProfitPercent >= position.takeProfit) {
            this.closePosition(position, currentCandle, 'take_profit', trades);
            capital += position.quantity * currentCandle.close + (position.profit || 0);
            position = null;
          }
        }

        // Atualizar equity curve
        const currentEquity = capital + (position ? position.quantity * currentCandle.close : 0);
        equityCurve.push({ timestamp: currentCandle.timestamp, value: currentEquity });

        // Atualizar drawdown
        if (currentEquity > peak) {
          peak = currentEquity;
        }
        const drawdown = ((peak - currentEquity) / peak) * 100;
        drawdownCurve.push({ timestamp: currentCandle.timestamp, value: drawdown });
      }

      // Fechar posição aberta ao final
      if (position && candles.length > 0) {
        const lastCandle = candles[candles.length - 1];
        this.closePosition(position, lastCandle, 'end_of_backtest', trades);
        capital += position.quantity * lastCandle.close + (position.profit || 0);
      }

      // Calcular métricas
      const metrics = this.calculateMetrics(trades, equityCurve, initialCapital, capital);

      return {
        strategyId: strategy.id,
        asset: strategy.asset,
        startDate: candles[0].timestamp,
        endDate: candles[candles.length - 1].timestamp,
        initialCapital,
        finalCapital: capital,
        metrics,
        trades,
        equityCurve,
        drawdownCurve,
        executionResults,
        errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return this.createEmptyResult(strategy, candles, initialCapital, errors);
    }
  }

  /**
   * Fechar posição
   */
  private static closePosition(
    position: Trade,
    candle: HistoricalCandle,
    signal: string,
    trades: Trade[]
  ): void {
    const exitPrice = candle.close;
    const profit = position.quantity * (exitPrice - position.entryPrice);
    const profitPercent = (profit / (position.quantity * position.entryPrice)) * 100;
    const durationDays = Math.floor(
      (candle.timestamp.getTime() - position.entryTime.getTime()) / (1000 * 60 * 60 * 24)
    );

    position.exitTime = candle.timestamp;
    position.exitPrice = exitPrice;
    position.exitSignal = signal;
    position.profit = profit;
    position.profitPercent = profitPercent;
    position.durationDays = durationDays;

    trades.push(position);
  }

  /**
   * Calcular métricas quantitativas
   */
  private static calculateMetrics(
    trades: Trade[],
    equityCurve: Array<{ timestamp: Date; value: number }>,
    initialCapital: number,
    finalCapital: number
  ): QuantitativeMetrics {
    const winningTrades = trades.filter((t) => t.profit && t.profit > 0);
    const losingTrades = trades.filter((t) => t.profit && t.profit < 0);

    const totalProfit = winningTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0));

    const totalReturn = ((finalCapital - initialCapital) / initialCapital) * 100;
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const avgWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const avgWinPercent = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profitPercent || 0), 0) / winningTrades.length
      : 0;

    const avgLossPercent = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.profitPercent || 0), 0) / losingTrades.length)
      : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    const { maxDrawdown, maxDrawdownValue, averageDrawdown } = this.calculateDrawdown(equityCurve, initialCapital);

    const recoveryFactor = maxDrawdownValue > 0 ? totalProfit / maxDrawdownValue : 0;

    const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

    const sharpeRatio = this.calculateSharpeRatio(equityCurve);
    const sortinoRatio = this.calculateSortinoRatio(equityCurve);
    const camarRatio = this.calculateCamarRatio(totalReturn, maxDrawdown);

    const { maxConsecutiveWins, maxConsecutiveLosses } = this.calculateConsecutiveWinsLosses(trades);

    const avgTradeDuration = trades.length > 0
      ? trades.reduce((sum, t) => sum + (t.durationDays || 0), 0) / trades.length
      : 0;

    const expectancy = trades.length > 0 ? (totalProfit - totalLoss) / trades.length : 0;

    const payoffRatio =
      avgLossPercent > 0 ? (avgWinPercent * (winRate / 100)) / (avgLossPercent * ((100 - winRate) / 100)) : 0;

    return {
      totalReturn,
      totalProfit,
      totalLoss,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate,
      maxDrawdown,
      maxDrawdownValue,
      averageDrawdown,
      profitFactor,
      recoveryFactor,
      avgWin,
      avgLoss,
      avgWinPercent,
      avgLossPercent,
      profitLossRatio,
      sharpeRatio,
      sortinoRatio,
      camarRatio,
      maxConsecutiveWins,
      maxConsecutiveLosses,
      avgTradeDuration,
      expectancy,
      payoffRatio,
    };
  }

  /**
   * Calcular drawdown
   */
  private static calculateDrawdown(
    equityCurve: Array<{ timestamp: Date; value: number }>,
    initialCapital: number
  ): { maxDrawdown: number; maxDrawdownValue: number; averageDrawdown: number } {
    let maxDrawdown = 0;
    let maxDrawdownValue = 0;
    let peak = initialCapital;
    const drawdowns: number[] = [];

    for (const point of equityCurve) {
      if (point.value > peak) {
        peak = point.value;
      }

      const drawdown = ((peak - point.value) / peak) * 100;
      const drawdownValue = peak - point.value;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownValue = drawdownValue;
      }

      if (drawdown > 0) {
        drawdowns.push(drawdown);
      }
    }

    const averageDrawdown = drawdowns.length > 0 ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length : 0;

    return { maxDrawdown, maxDrawdownValue, averageDrawdown };
  }

  /**
   * Calcular Sharpe Ratio
   */
  private static calculateSharpeRatio(
    equityCurve: Array<{ timestamp: Date; value: number }>,
    riskFreeRate: number = 0.02
  ): number {
    if (equityCurve.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;

    const sharpeRatio = (avgReturn - riskFreeRate / 252) / stdDev * Math.sqrt(252);
    return Math.round(sharpeRatio * 100) / 100;
  }

  /**
   * Calcular Sortino Ratio
   */
  private static calculateSortinoRatio(
    equityCurve: Array<{ timestamp: Date; value: number }>,
    riskFreeRate: number = 0.02
  ): number {
    if (equityCurve.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value;
      returns.push(dailyReturn);
    }

    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Downside deviation (apenas retornos negativos)
    const downside = returns.filter((r) => r < 0);
    const downsideVariance = downside.reduce((sum, r) => sum + Math.pow(r - 0, 2), 0) / returns.length;
    const downsideStdDev = Math.sqrt(downsideVariance);

    if (downsideStdDev === 0) return 0;

    const sortinoRatio = (avgReturn - riskFreeRate / 252) / downsideStdDev * Math.sqrt(252);
    return Math.round(sortinoRatio * 100) / 100;
  }

  /**
   * Calcular Calmar Ratio
   */
  private static calculateCamarRatio(totalReturn: number, maxDrawdown: number): number {
    if (maxDrawdown === 0) return 0;
    return Math.round((totalReturn / maxDrawdown) * 100) / 100;
  }

  /**
   * Calcular sequências de wins/losses
   */
  private static calculateConsecutiveWinsLosses(trades: Trade[]): {
    maxConsecutiveWins: number;
    maxConsecutiveLosses: number;
  } {
    let maxConsecutiveWins = 0;
    let maxConsecutiveLosses = 0;
    let currentWins = 0;
    let currentLosses = 0;

    for (const trade of trades) {
      if (trade.profit && trade.profit > 0) {
        currentWins++;
        currentLosses = 0;
        maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
      } else if (trade.profit && trade.profit < 0) {
        currentLosses++;
        currentWins = 0;
        maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
      }
    }

    return { maxConsecutiveWins, maxConsecutiveLosses };
  }

  /**
   * Criar resultado vazio
   */
  private static createEmptyResult(
    strategy: ExecutableStrategy,
    candles: HistoricalCandle[],
    initialCapital: number,
    errors: string[]
  ): QuantitativeBacktestResult {
    return {
      strategyId: strategy.id,
      asset: strategy.asset,
      startDate: candles[0]?.timestamp || new Date(),
      endDate: candles[candles.length - 1]?.timestamp || new Date(),
      initialCapital,
      finalCapital: initialCapital,
      metrics: {
        totalReturn: 0,
        totalProfit: 0,
        totalLoss: 0,
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        maxDrawdown: 0,
        maxDrawdownValue: 0,
        averageDrawdown: 0,
        profitFactor: 0,
        recoveryFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        avgWinPercent: 0,
        avgLossPercent: 0,
        profitLossRatio: 0,
        sharpeRatio: 0,
        sortinoRatio: 0,
        camarRatio: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        avgTradeDuration: 0,
        expectancy: 0,
        payoffRatio: 0,
      },
      trades: [],
      equityCurve: [],
      drawdownCurve: [],
      executionResults: [],
      errors,
    };
  }
}
