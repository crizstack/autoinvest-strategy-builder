import { describe, it, expect } from 'vitest';
import { MetricsService, Trade, EquityCurvePoint } from './metricsService';

describe('MetricsService', () => {
  const mockTrades: Trade[] = [
    { date: '2024-01-15', type: 'BUY', price: 28.50, quantity: 100, result: 850 },
    { date: '2024-01-18', type: 'SELL', price: 29.35, quantity: 100, result: 850 },
    { date: '2024-01-22', type: 'BUY', price: 27.80, quantity: 150, result: 1245 },
    { date: '2024-01-25', type: 'SELL', price: 29.10, quantity: 150, result: 1245 },
    { date: '2024-01-28', type: 'BUY', price: 28.20, quantity: 80, result: -160 },
  ];

  const mockEquityCurve: EquityCurvePoint[] = [
    { date: '2024-01-01', value: 10000 },
    { date: '2024-01-05', value: 10500 },
    { date: '2024-01-10', value: 10200 },
    { date: '2024-01-15', value: 11200 },
    { date: '2024-01-20', value: 10800 },
    { date: '2024-01-25', value: 12500 },
    { date: '2024-01-30', value: 12300 },
  ];

  describe('calculateSharpeRatio', () => {
    it('deve calcular Sharpe Ratio corretamente', () => {
      const sharpe = MetricsService.calculateSharpeRatio(mockEquityCurve);
      expect(typeof sharpe).toBe('number');
      expect(sharpe).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar 0 para curva vazia', () => {
      const sharpe = MetricsService.calculateSharpeRatio([]);
      expect(sharpe).toBe(0);
    });

    it('deve retornar 0 para curva com um ponto', () => {
      const sharpe = MetricsService.calculateSharpeRatio([{ date: '2024-01-01', value: 10000 }]);
      expect(sharpe).toBe(0);
    });
  });

  describe('calculateProfitFactor', () => {
    it('deve calcular Profit Factor corretamente', () => {
      const pf = MetricsService.calculateProfitFactor(mockTrades);
      expect(pf).toBeGreaterThan(0);
      // 4 trades vencedores (850 + 850 + 1245 + 1245 = 4190)
      // 1 trade perdedor (-160)
      // Profit Factor = 4190 / 160 = 26.1875
      expect(pf).toBeCloseTo(26.19, 1);
    });

    it('deve retornar 0 para lista vazia', () => {
      const pf = MetricsService.calculateProfitFactor([]);
      expect(pf).toBe(0);
    });

    it('deve retornar Infinity para sem perdas', () => {
      const tradesComGanho: Trade[] = [
        { date: '2024-01-15', type: 'BUY', price: 28.50, quantity: 100, result: 850 },
        { date: '2024-01-18', type: 'SELL', price: 29.35, quantity: 100, result: 850 },
      ];
      const pf = MetricsService.calculateProfitFactor(tradesComGanho);
      expect(pf).toBe(Infinity);
    });
  });

  describe('calculateMaxDrawdown', () => {
    it('deve calcular drawdown máximo corretamente', () => {
      const { maxDrawdown, maxDrawdownPercent } =
        MetricsService.calculateMaxDrawdown(mockEquityCurve);
      expect(maxDrawdown).toBeGreaterThan(0);
      expect(maxDrawdownPercent).toBeGreaterThan(0);
      expect(maxDrawdownPercent).toBeLessThan(100);
    });

    it('deve retornar 0 para curva vazia', () => {
      const { maxDrawdown, maxDrawdownPercent } = MetricsService.calculateMaxDrawdown([]);
      expect(maxDrawdown).toBe(0);
      expect(maxDrawdownPercent).toBe(0);
    });

    it('deve retornar 0 para curva com um ponto', () => {
      const { maxDrawdown, maxDrawdownPercent } = MetricsService.calculateMaxDrawdown([
        { date: '2024-01-01', value: 10000 },
      ]);
      expect(maxDrawdown).toBe(0);
      expect(maxDrawdownPercent).toBe(0);
    });
  });

  describe('calculateWinRate', () => {
    it('deve calcular taxa de acerto corretamente', () => {
      const winRate = MetricsService.calculateWinRate(mockTrades);
      // 4 vencedores de 5 = 80%
      expect(winRate).toBe(80);
    });

    it('deve retornar 0 para lista vazia', () => {
      const winRate = MetricsService.calculateWinRate([]);
      expect(winRate).toBe(0);
    });

    it('deve retornar 100 para todos vencedores', () => {
      const trades: Trade[] = [
        { date: '2024-01-15', type: 'BUY', price: 28.50, quantity: 100, result: 850 },
        { date: '2024-01-18', type: 'SELL', price: 29.35, quantity: 100, result: 850 },
      ];
      const winRate = MetricsService.calculateWinRate(trades);
      expect(winRate).toBe(100);
    });
  });

  describe('calculateRecoveryFactor', () => {
    it('deve calcular fator de recuperação corretamente', () => {
      const rf = MetricsService.calculateRecoveryFactor(3180, 300);
      expect(rf).toBeCloseTo(10.6, 1);
    });

    it('deve retornar Infinity para drawdown zero', () => {
      const rf = MetricsService.calculateRecoveryFactor(1000, 0);
      expect(rf).toBe(Infinity);
    });

    it('deve retornar 0 para lucro zero e drawdown zero', () => {
      const rf = MetricsService.calculateRecoveryFactor(0, 0);
      expect(rf).toBe(0);
    });
  });

  describe('calculateConsecutiveStreaks', () => {
    it('deve calcular sequências consecutivas corretamente', () => {
      const { maxConsecutiveWins, maxConsecutiveLosses } =
        MetricsService.calculateConsecutiveStreaks(mockTrades);
      expect(maxConsecutiveWins).toBe(4);
      expect(maxConsecutiveLosses).toBe(1);
    });

    it('deve retornar 0 para lista vazia', () => {
      const { maxConsecutiveWins, maxConsecutiveLosses } = MetricsService.calculateConsecutiveStreaks([]);
      expect(maxConsecutiveWins).toBe(0);
      expect(maxConsecutiveLosses).toBe(0);
    });

    it('deve calcular sequências com alternância corretamente', () => {
      const trades: Trade[] = [
        { date: '2024-01-15', type: 'BUY', price: 28.50, quantity: 100, result: 100 },
        { date: '2024-01-18', type: 'SELL', price: 29.35, quantity: 100, result: -50 },
        { date: '2024-01-22', type: 'BUY', price: 27.80, quantity: 150, result: 200 },
        { date: '2024-01-25', type: 'SELL', price: 29.10, quantity: 150, result: -75 },
      ];
      const { maxConsecutiveWins, maxConsecutiveLosses } =
        MetricsService.calculateConsecutiveStreaks(trades);
      expect(maxConsecutiveWins).toBe(1);
      expect(maxConsecutiveLosses).toBe(1);
    });
  });

  describe('calculateExpectancy', () => {
    it('deve calcular expectativa matemática corretamente', () => {
      const expectancy = MetricsService.calculateExpectancy(mockTrades);
      // (850 + 850 + 1245 + 1245 - 160) / 5 = 4030 / 5 = 806
      expect(expectancy).toBeCloseTo(806, 0);
    });

    it('deve retornar 0 para lista vazia', () => {
      const expectancy = MetricsService.calculateExpectancy([]);
      expect(expectancy).toBe(0);
    });
  });

  describe('calculateAllMetrics', () => {
    it('deve calcular todas as métricas corretamente', () => {
      const metrics = MetricsService.calculateAllMetrics(mockTrades, mockEquityCurve);

      expect(metrics.totalTrades).toBe(5);
      expect(metrics.winningTrades).toBe(4);
      expect(metrics.losingTrades).toBe(1);
      expect(metrics.winRate).toBe(80);
      expect(metrics.totalProfit).toBe(4190);
      expect(metrics.totalLoss).toBe(160);
      expect(metrics.sharpeRatio).toBeGreaterThan(0);
      expect(metrics.profitFactor).toBeGreaterThan(0);
      expect(metrics.maxDrawdown).toBeGreaterThan(0);
      expect(metrics.recoveryFactor).toBeGreaterThan(0);
    });
  });

  describe('compareStrategies', () => {
    it('deve comparar estratégias corretamente', () => {
      const strategy1 = {
        totalProfit: 3800,
        totalLoss: 200,
        totalTrades: 5,
        winningTrades: 4,
        losingTrades: 1,
        winRate: 80,
        sharpeRatio: 1.85,
        profitFactor: 2.1,
        maxDrawdown: 300,
        maxDrawdownPercent: 2.5,
        recoveryFactor: 12.67,
        maxConsecutiveWins: 3,
        maxConsecutiveLosses: 1,
        avgWin: 950,
        avgLoss: 200,
        profitLossRatio: 4.75,
        expectancy: 720,
      };

      const strategy2 = {
        totalProfit: 2500,
        totalLoss: 300,
        totalTrades: 7,
        winningTrades: 5,
        losingTrades: 2,
        winRate: 71,
        sharpeRatio: 1.45,
        profitFactor: 1.8,
        maxDrawdown: 400,
        maxDrawdownPercent: 3.2,
        recoveryFactor: 6.25,
        maxConsecutiveWins: 2,
        maxConsecutiveLosses: 2,
        avgWin: 500,
        avgLoss: 150,
        profitLossRatio: 3.33,
        expectancy: 314,
      };

      const comparison = MetricsService.compareStrategies(strategy1, strategy2);

      expect(comparison.better).toBe('strategy1');
      expect(comparison.metrics.length).toBe(5);
      expect(comparison.metrics[0].name).toBe('Lucro Total');
    });
  });
});
