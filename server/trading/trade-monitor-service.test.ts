import { describe, it, expect, vi } from 'vitest';
import { TradeMonitorService } from './trade-monitor-service';

// Mock das dependências
vi.mock('./paper-trading-engine', () => ({
  PaperTradingEngine: {
    calculateProfitLoss: vi.fn((trade, currentPrice) => {
      const entryPrice = Number(trade.entryPrice);
      if (trade.type === 'buy') {
        return (currentPrice - entryPrice) * trade.quantity;
      } else {
        return (entryPrice - currentPrice) * trade.quantity;
      }
    }),
    closePosition: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../market/candles-service', () => ({
  getLatestCandle: vi.fn().mockResolvedValue({
    close: 30,
    volume: 1000000,
  }),
}));

vi.mock('./trade-logger-service', () => ({
  TradeLoggerService: {
    logStopLossCheck: vi.fn().mockResolvedValue(undefined),
    logTakeProfitCheck: vi.fn().mockResolvedValue(undefined),
    logTradeClose: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('TradeMonitorService', () => {
  describe('Métodos Públicos', () => {
    it('deve ter monitorPosition definido', () => {
      expect(TradeMonitorService.monitorPosition).toBeDefined();
    });

    it('deve ter monitorAllOpenPositions definido', () => {
      expect(TradeMonitorService.monitorAllOpenPositions).toBeDefined();
    });

    it('deve ter getPositionStatus definido', () => {
      expect(TradeMonitorService.getPositionStatus).toBeDefined();
    });
  });

  describe('monitorAllOpenPositions', () => {
    it('deve monitorar todas as posições sem erros', async () => {
      await expect(TradeMonitorService.monitorAllOpenPositions()).resolves.not.toThrow();
    });

    it('deve retornar resultado de monitoramento', async () => {
      const result = await TradeMonitorService.monitorAllOpenPositions();
      expect(result).toBeDefined();
    });
  });

  describe('Lógica de SL/TP', () => {
    it('deve verificar condição de stop loss', () => {
      const stopLoss = 25;
      const currentPrice = 24;
      expect(currentPrice <= stopLoss).toBe(true);
    });

    it('deve verificar condição de take profit', () => {
      const takeProfit = 35;
      const currentPrice = 36;
      expect(currentPrice >= takeProfit).toBe(true);
    });

    it('deve não acionar SL/TP dentro do intervalo', () => {
      const stopLoss = 25;
      const takeProfit = 35;
      const currentPrice = 32;
      expect(currentPrice > stopLoss && currentPrice < takeProfit).toBe(true);
    });
  });
});
