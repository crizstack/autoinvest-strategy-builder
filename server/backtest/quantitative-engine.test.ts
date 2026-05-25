import { describe, it, expect, beforeEach } from 'vitest';
import { QuantitativeBacktestEngine, type HistoricalCandle } from './quantitative-engine';
import type { ExecutableStrategy } from '../../shared/strategy-types';

describe('Quantitative Backtest Engine', () => {
  const mockCandles: HistoricalCandle[] = [];
  const mockStrategy: ExecutableStrategy = {
    id: 'test-strategy',
    name: 'Test Strategy',
    asset: 'PETR4',
    blocks: [],
    connections: [],
  };

  // Gerar candles de teste
  beforeEach(() => {
    mockCandles.length = 0;
    let price = 100;

    for (let i = 0; i < 100; i++) {
      const change = (Math.random() - 0.5) * 2;
      price += change;

      mockCandles.push({
        timestamp: new Date(2024, 0, i + 1),
        open: price,
        high: price + Math.abs(change),
        low: price - Math.abs(change),
        close: price,
        volume: 1000000,
      });
    }
  });

  it('deve validar dados insuficientes', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, [], 10000);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.metrics.totalTrades).toBe(0);
  });

  it('deve calcular retorno total corretamente', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.finalCapital).toBeGreaterThanOrEqual(0);
    expect(result.metrics.totalReturn).toBeDefined();
    expect(typeof result.metrics.totalReturn).toBe('number');
  });

  it('deve calcular win rate', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    if (result.metrics.totalTrades > 0) {
      expect(result.metrics.winRate).toBeGreaterThanOrEqual(0);
      expect(result.metrics.winRate).toBeLessThanOrEqual(100);
    }
  });

  it('deve calcular drawdown máximo', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.metrics.maxDrawdownValue).toBeGreaterThanOrEqual(0);
  });

  it('deve calcular Sharpe Ratio', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.sharpeRatio).toBe('number');
  });

  it('deve calcular Sortino Ratio', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.sortinoRatio).toBe('number');
  });

  it('deve calcular Calmar Ratio', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.camarRatio).toBe('number');
  });

  it('deve calcular Profit Factor', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.profitFactor).toBe('number');
  });

  it('deve rastrear equity curve', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.equityCurve.length).toBeGreaterThan(0);
    expect(result.equityCurve[0].value).toBe(10000);
  });

  it('deve rastrear drawdown curve', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.drawdownCurve.length).toBeGreaterThan(0);
    expect(result.drawdownCurve[0].value).toBeGreaterThanOrEqual(0);
  });

  it('deve registrar trades com duração', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    if (result.trades.length > 0) {
      result.trades.forEach((trade) => {
        expect(trade.entryTime).toBeDefined();
        expect(trade.entryPrice).toBeGreaterThan(0);
        expect(trade.quantity).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it('deve calcular sequências de wins/losses', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.metrics.maxConsecutiveWins).toBeGreaterThanOrEqual(0);
    expect(result.metrics.maxConsecutiveLosses).toBeGreaterThanOrEqual(0);
  });

  it('deve calcular expectancy', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.expectancy).toBe('number');
  });

  it('deve calcular recovery factor', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(typeof result.metrics.recoveryFactor).toBe('number');
  });

  it('deve retornar resultado com todas as métricas', async () => {
    const result = await QuantitativeBacktestEngine.runBacktest(mockStrategy, mockCandles, 10000);

    expect(result.metrics).toHaveProperty('totalReturn');
    expect(result.metrics).toHaveProperty('totalProfit');
    expect(result.metrics).toHaveProperty('totalLoss');
    expect(result.metrics).toHaveProperty('totalTrades');
    expect(result.metrics).toHaveProperty('winningTrades');
    expect(result.metrics).toHaveProperty('losingTrades');
    expect(result.metrics).toHaveProperty('winRate');
    expect(result.metrics).toHaveProperty('maxDrawdown');
    expect(result.metrics).toHaveProperty('sharpeRatio');
    expect(result.metrics).toHaveProperty('sortinoRatio');
    expect(result.metrics).toHaveProperty('camarRatio');
    expect(result.metrics).toHaveProperty('profitFactor');
    expect(result.metrics).toHaveProperty('recoveryFactor');
    expect(result.metrics).toHaveProperty('avgWin');
    expect(result.metrics).toHaveProperty('avgLoss');
    expect(result.metrics).toHaveProperty('profitLossRatio');
    expect(result.metrics).toHaveProperty('expectancy');
    expect(result.metrics).toHaveProperty('payoffRatio');
  });
});
