import { describe, it, expect } from 'vitest';
import { StrategyExecutorV2, type MarketData } from './executor-v2';
import type { ExecutableStrategy } from '../../shared/strategy-types';

describe('StrategyExecutorV2', () => {
  const createStrategy = (blocks: any[], connections: any[]): ExecutableStrategy => ({
    id: 'test-1',
    name: 'Test Strategy',
    asset: 'PETR4',
    blocks,
    connections,
    userId: 1,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMarketData = (currentPrice: number = 100): MarketData => ({
    asset: 'PETR4',
    currentPrice,
    previousPrice: 99,
    prices: Array(30).fill(0).map((_, i) => 100 + Math.sin(i / 10) * 5),
    volumes: Array(30).fill(1000000),
    currentVolume: 1000000,
    timestamp: new Date(),
  });

  describe('Simple Buy Signal', () => {
    it('should generate buy signal when price > trigger', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Price > 100', params: { value: 100 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [{ source: 'trigger-1', target: 'action-1' }];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.signal).toBe('buy');
      expect(result.signalStrength).toBe(100);
    });

    it('should not generate signal when condition is false', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Price > 100', params: { value: 100 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [{ source: 'trigger-1', target: 'action-1' }];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(95);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.signal).toBe('none');
    });
  });

  describe('Indicator Conditions', () => {
    it('should evaluate RSI indicator', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'indicator-1', type: 'indicator', subType: 'rsi', label: 'RSI < 30', params: { period: 14, condition: 'below', value: 30 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(100);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      // RSI should be calculated
      expect(result.blockResults.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    it('should evaluate MA indicator', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'indicator-1', type: 'indicator', subType: 'ma', label: 'Price > MA20', params: { period: 20, type: 'sma', condition: 'above', value: 100 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.blockResults.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Risk Levels', () => {
    it('should extract stop loss and take profit', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
        { id: 'risk-1', type: 'risk', subType: 'stop_loss', label: 'Stop Loss 2%', params: { percentage: 2 } },
        { id: 'risk-2', type: 'risk', subType: 'take_profit', label: 'Take Profit 5%', params: { percentage: 5 } },
      ];
      const connections = [
        { source: 'trigger-1', target: 'action-1' },
        { source: 'action-1', target: 'risk-1' },
        { source: 'action-1', target: 'risk-2' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.riskLevels).toBeDefined();
      expect(result.riskLevels?.stopLoss).toBe(2);
      expect(result.riskLevels?.takeProfit).toBe(5);
    });
  });

  describe('Complex Strategies', () => {
    it('should handle trigger → indicator → action flow', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Price > 100', params: { value: 100 } },
        { id: 'indicator-1', type: 'indicator', subType: 'rsi', label: 'RSI < 30', params: { period: 14, condition: 'below', value: 30 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.blockResults.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });

    it('should handle multiple indicators', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'indicator-1', type: 'indicator', subType: 'rsi', label: 'RSI', params: { period: 14, condition: 'below', value: 30 } },
        { id: 'indicator-2', type: 'indicator', subType: 'ma', label: 'MA', params: { period: 20, type: 'sma', condition: 'above', value: 100 } },
        { id: 'operator-1', type: 'operator', subType: 'and', label: 'AND', params: {} },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'trigger-1', target: 'indicator-2' },
        { source: 'indicator-1', target: 'operator-1' },
        { source: 'indicator-2', target: 'operator-1' },
        { source: 'operator-1', target: 'action-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.blockResults.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('Sell and Close Signals', () => {
    it('should generate sell signal', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'action-1', type: 'action', subType: 'sell', label: 'Sell', params: {} },
      ];
      const connections = [{ source: 'trigger-1', target: 'action-1' }];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.signal).toBe('sell');
    });

    it('should generate close signal', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'action-1', type: 'action', subType: 'close', label: 'Close', params: {} },
      ];
      const connections = [{ source: 'trigger-1', target: 'action-1' }];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.signal).toBe('close');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid strategy', async () => {
      const blocks: any[] = [];
      const connections: any[] = [];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      expect(result.signal).toBe('none');
      // Estrategia vazia nao gera sinal
      expect(result.blockResults.length).toBe(0);
    });

    it('should handle insufficient data for indicators', async () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Start', params: { value: 50 } },
        { id: 'indicator-1', type: 'indicator', subType: 'rsi', label: 'RSI', params: { period: 100, condition: 'below', value: 30 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: {} },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const marketData = createMarketData(105);

      const result = await StrategyExecutorV2.execute(strategy, marketData);

      // Should not crash, just not generate signal
      expect(result.errors.length).toBe(0);
      expect(result.signal).toBe('none');
    });
  });
});
