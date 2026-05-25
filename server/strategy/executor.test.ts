/**
 * Testes para Strategy Executor
 */

import { describe, it, expect } from 'vitest';
import { IndicatorCalculator } from './indicators';
import { StrategyExecutor } from './executor';
import type { ExecutableStrategy, MarketData } from './executor';

describe('Indicator Calculator', () => {
  describe('RSI', () => {
    it('deve calcular RSI corretamente', () => {
      const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.00, 46.00, 46.00];
      const rsi = IndicatorCalculator.calculateRSI(prices, 14);
      expect(rsi).toBeGreaterThan(0);
      expect(rsi).toBeLessThan(100);
    });

    it('deve retornar 100 quando todos os ganhos', () => {
      const prices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
      const rsi = IndicatorCalculator.calculateRSI(prices, 14);
      expect(rsi).toBe(100);
    });

    it('deve retornar 0 quando todas as perdas', () => {
      const prices = [16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
      const rsi = IndicatorCalculator.calculateRSI(prices, 14);
      expect(rsi).toBe(0);
    });
  });

  describe('Média Móvel', () => {
    it('deve calcular SMA corretamente', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const sma = IndicatorCalculator.calculateSMA(prices, 5);
      expect(sma).toBe(18); // (16+17+18+19+20)/5 = 18
    });

    it('deve calcular EMA corretamente', () => {
      const prices = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
      const ema = IndicatorCalculator.calculateEMA(prices, 5);
      expect(ema).toBeGreaterThan(0);
    });
  });

  describe('MACD', () => {
    it('deve calcular MACD corretamente', () => {
      const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00, 46.00];
      const { macd, signal, histogram } = IndicatorCalculator.calculateMACD(prices);
      expect(macd).toBeDefined();
      expect(signal).toBeDefined();
      expect(histogram).toBeDefined();
    });
  });

  describe('Avaliação de Condições', () => {
    it('deve avaliar condição de preço acima', () => {
      const result = IndicatorCalculator.evaluatePriceCondition(100, 50, 'above');
      expect(result).toBe(true);
    });

    it('deve avaliar condição de preço abaixo', () => {
      const result = IndicatorCalculator.evaluatePriceCondition(50, 100, 'below');
      expect(result).toBe(true);
    });

    it('deve avaliar condição de indicador', () => {
      const result = IndicatorCalculator.evaluateIndicatorCondition(70, 50, 'above');
      expect(result).toBe(true);
    });

    it('deve avaliar volume', () => {
      const result = IndicatorCalculator.evaluateVolumeCondition(1000, 500, 'above');
      expect(result).toBe(true);
    });
  });
});

describe('Strategy Executor', () => {
  it('deve executar estratégia simples de preço', async () => {
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
          label: 'Preço > 25',
          params: { value: 25 },
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

    const marketData: MarketData = {
      asset: 'PETR4',
      currentPrice: 30,
      prices: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      volumes: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
      currentVolume: 2000,
      timestamp: new Date(),
    };

    const result = await StrategyExecutor.execute(strategy, marketData);
    expect(result.signal).toBe('buy');
    expect(result.errors).toHaveLength(0);
  });

  it('deve executar estratégia com RSI', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-2',
      name: 'RSI Strategy',
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
          label: 'Preço > 25',
          params: { value: 25 },
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
          label: 'Stop Loss 2%',
          params: { percentage: 2 },
        },
      ],
      connections: [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
        { source: 'action-1', target: 'risk-1' },
      ],
    };

    const prices = [
      44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.1, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.00,
    ];

    const marketData: MarketData = {
      asset: 'PETR4',
      currentPrice: 46,
      prices,
      volumes: new Array(prices.length).fill(1000),
      currentVolume: 1000,
      timestamp: new Date(),
    };

    const result = await StrategyExecutor.execute(strategy, marketData);
    expect(result.blockResults.length).toBeGreaterThan(0);
    expect(result.riskLevels?.stopLoss).toBe(2);
  });

  it('deve retornar erro para estratégia inválida', async () => {
    const strategy: ExecutableStrategy = {
      id: 'strat-invalid',
      name: 'Invalid Strategy',
      asset: 'PETR4',
      userId: 1,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
      blocks: [],
      connections: [],
    };

    const marketData: MarketData = {
      asset: 'PETR4',
      currentPrice: 30,
      prices: [20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      volumes: [1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000],
      currentVolume: 2000,
      timestamp: new Date(),
    };

    const result = await StrategyExecutor.execute(strategy, marketData);
    expect(result.blockResults.length).toBe(0);
  });
});
