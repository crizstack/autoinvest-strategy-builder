/**
 * Testes para Backtest Engine
 */

import { describe, it, expect } from 'vitest';
import { BacktestEngine, type HistoricalCandle } from './backtest-engine';
import type { ExecutableStrategy } from '../../shared/strategy-types';

describe('Backtest Engine', () => {
  // Gerar candles de teste
  const generateCandles = (count: number, startPrice: number = 100): HistoricalCandle[] => {
    const candles: HistoricalCandle[] = [];
    let price = startPrice;

    for (let i = 0; i < count; i++) {
      const change = (Math.random() - 0.5) * 2; // -1 a +1
      price += change;

      candles.push({
        timestamp: new Date(Date.now() - (count - i) * 24 * 60 * 60 * 1000),
        open: price,
        high: price + Math.abs(change),
        low: price - Math.abs(change),
        close: price,
        volume: 1000000 + Math.random() * 500000,
      });
    }

    return candles;
  };

  it('deve executar backtest simples', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-1',
      name: 'Price Strategy',
      asset: 'PETR4',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subType: 'price_above',
          label: 'Preço > 100',
          params: { value: 100 },
        },
        {
          id: 'action-1',
          type: 'action',
          subType: 'buy',
          label: 'Comprar',
          params: { orderType: 'market', quantity: 100 },
        },
        {
          id: 'action-2',
          type: 'action',
          subType: 'sell',
          label: 'Vender',
          params: { orderType: 'market' },
        },
      ],
      connections: [
        { source: 'trigger-1', target: 'action-1' },
        { source: 'action-1', target: 'action-2' },
      ],
    };

    const candles = generateCandles(100, 100);
    const result = await BacktestEngine.runBacktest(strategy, candles, 10000);

    expect(result.strategyId).toBe('strat-1');
    expect(result.asset).toBe('PETR4');
    expect(result.totalTrades).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(100);
  });

  it('deve calcular métricas corretamente', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-2',
      name: 'RSI Strategy',
      asset: 'VALE3',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subType: 'price_above',
          label: 'Preço > 100',
          params: { value: 100 },
        },
        {
          id: 'indicator-1',
          type: 'indicator',
          subType: 'rsi',
          label: 'RSI < 30',
          params: { period: 14, condition: 'below', value: 30 },
        },
        {
          id: 'action-1',
          type: 'action',
          subType: 'buy',
          label: 'Comprar',
          params: { orderType: 'market', quantity: 100 },
        },
        {
          id: 'risk-1',
          type: 'risk',
          subType: 'stop_loss',
          label: 'Stop Loss 5%',
          params: { percentage: 5 },
        },
        {
          id: 'risk-2',
          type: 'risk',
          subType: 'take_profit',
          label: 'Take Profit 10%',
          params: { percentage: 10 },
        },
      ],
      connections: [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
        { source: 'action-1', target: 'risk-1' },
        { source: 'action-1', target: 'risk-2' },
      ],
    };

    const candles = generateCandles(100, 100);
    const result = await BacktestEngine.runBacktest(strategy, candles, 10000);

    expect(result.totalTrades).toBeGreaterThanOrEqual(0);
    expect(result.winningTrades).toBeLessThanOrEqual(result.totalTrades);
    expect(result.losingTrades).toBeLessThanOrEqual(result.totalTrades);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.sharpeRatio).toBeDefined();
  });

  it('deve rejeitar backtest com poucos candles', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-3',
      name: 'Test Strategy',
      asset: 'ITUB4',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subType: 'price_above',
          label: 'Preço > 100',
          params: { value: 100 },
        },
        {
          id: 'action-1',
          type: 'action',
          subType: 'buy',
          label: 'Comprar',
          params: { orderType: 'market' },
        },
      ],
      connections: [{ source: 'trigger-1', target: 'action-1' }],
    };

    const candles = generateCandles(5, 100); // Apenas 5 candles
    const result = await BacktestEngine.runBacktest(strategy, candles, 10000);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('deve rastrear trades individuais', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-4',
      name: 'Trade Tracking',
      asset: 'BBDC4',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subType: 'price_above',
          label: 'Preço > 100',
          params: { value: 100 },
        },
        {
          id: 'action-1',
          type: 'action',
          subType: 'buy',
          label: 'Comprar',
          params: { orderType: 'market', quantity: 100 },
        },
      ],
      connections: [{ source: 'trigger-1', target: 'action-1' }],
    };

    const candles = generateCandles(50, 100);
    const result = await BacktestEngine.runBacktest(strategy, candles, 10000);

    if (result.trades.length > 0) {
      const trade = result.trades[0];
      expect(trade.id).toBeDefined();
      expect(trade.strategyId).toBe('strat-4');
      expect(trade.entryTime).toBeDefined();
      expect(trade.entryPrice).toBeGreaterThan(0);
      expect(trade.quantity).toBeGreaterThan(0);
    }
  });

  it('deve calcular profit corretamente', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-5',
      name: 'Profit Calculation',
      asset: 'ABEV3',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [
        {
          id: 'trigger-1',
          type: 'trigger',
          subType: 'price_above',
          label: 'Preço > 100',
          params: { value: 100 },
        },
        {
          id: 'action-1',
          type: 'action',
          subType: 'buy',
          label: 'Comprar',
          params: { orderType: 'market', quantity: 100 },
        },
      ],
      connections: [{ source: 'trigger-1', target: 'action-1' }],
    };

    const candles = generateCandles(100, 100);
    const result = await BacktestEngine.runBacktest(strategy, candles, 10000);

    expect(result.totalProfit).toBeDefined();
    expect(result.totalReturn).toBeDefined();

    // Verificar que profit fechado é consistente
    const closedTrades = result.trades.filter((t) => t.exitPrice !== undefined);
    closedTrades.forEach((trade) => {
      if (trade.profit !== undefined && trade.exitPrice !== undefined) {
        const expectedProfit = trade.quantity * (trade.exitPrice - trade.entryPrice);
        expect(Math.abs(trade.profit - expectedProfit)).toBeLessThan(0.01);
      }
    });
  });
});
