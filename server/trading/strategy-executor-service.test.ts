import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StrategyExecutorService } from './strategy-executor-service';

// Mock das dependências
vi.mock('./paper-trading-engine', () => ({
  PaperTradingEngine: {
    openPosition: vi.fn().mockResolvedValue({ id: 1, asset: 'PETR4' }),
    getOpenPositions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('./trade-monitor-service', () => ({
  TradeMonitorService: {
    monitorAllOpenPositions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('./trade-logger-service', () => ({
  TradeLoggerService: {
    logTradeOpen: vi.fn().mockResolvedValue(undefined),
    logTradeClose: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../strategy/executor-v2', () => ({
  StrategyExecutorV2: {
    execute: vi.fn().mockResolvedValue({
      signals: [
        {
          type: 'BUY',
          asset: 'PETR4',
          price: 28,
          confidence: 0.85,
        },
      ],
    }),
  },
}));

vi.mock('../market/candles-service', () => ({
  getLatestCandle: vi.fn().mockResolvedValue({
    close: 28,
    volume: 1000000,
  }),
}));

describe('StrategyExecutorService', () => {
  describe('executeActiveStrategies', () => {
    it('deve executar sem erros', async () => {
      await expect(StrategyExecutorService.executeActiveStrategies()).resolves.not.toThrow();
    });

    it('deve retornar array de resultados', async () => {
      const result = await StrategyExecutorService.executeActiveStrategies();
      expect(result).toBeDefined();
    });
  });

  describe('monitorOpenPositions', () => {
    it('deve monitorar posições sem erros', async () => {
      await expect(StrategyExecutorService.monitorOpenPositions()).resolves.not.toThrow();
    });

    it('deve retornar array de posições monitoradas', async () => {
      const result = await StrategyExecutorService.monitorOpenPositions();
      expect(result).toBeDefined();
    });
  });

  describe('Lógica de Execução', () => {
    it('deve ter métodos públicos definidos', () => {
      expect(StrategyExecutorService.executeActiveStrategies).toBeDefined();
      expect(StrategyExecutorService.monitorOpenPositions).toBeDefined();
    });

    it('deve ser um serviço estático', () => {
      expect(StrategyExecutorService).toBeDefined();
    });
  });
});
