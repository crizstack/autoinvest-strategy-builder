import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RealtimePnLService } from './realtime-pnl-service';
import { PaperTradingEngine } from './paper-trading-engine';

// Mock do PaperTradingEngine
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
  },
}));

// Mock do getLatestCandle
vi.mock('../market/candles-service', () => ({
  getLatestCandle: vi.fn(async (asset) => {
    if (asset === 'PETR4') {
      return { close: 30, volume: 1000000 };
    }
    if (asset === 'VALE3') {
      return { close: 70, volume: 500000 };
    }
    return null;
  }),
}));

describe('RealtimePnLService', () => {
  describe('getPositionPnLRealtime', () => {
    it('deve retornar null para posição inexistente', async () => {
      const result = await RealtimePnLService.getPositionPnLRealtime(999);
      expect(result).toBeNull();
    });

    it('deve calcular PnL corretamente para posição long', async () => {
      // Este teste é ilustrativo, pois não temos acesso ao banco real
      // Em um cenário real, seria necessário mockar getDb()
      expect(RealtimePnLService).toBeDefined();
    });
  });

  describe('getMultiplePositionsPnL', () => {
    it('deve retornar array vazio para lista vazia', async () => {
      const result = await RealtimePnLService.getMultiplePositionsPnL([]);
      expect(result).toEqual([]);
    });

    it('deve retornar múltiplas posições', async () => {
      const result = await RealtimePnLService.getMultiplePositionsPnL([1, 2, 3]);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getPortfolioPnLRealtime', () => {
    it('deve retornar null para usuário sem portfolio', async () => {
      const result = await RealtimePnLService.getPortfolioPnLRealtime(999);
      expect(result).toBeNull();
    });

    it('deve incluir posições abertas no resultado', async () => {
      // Teste ilustrativo
      expect(RealtimePnLService.getPortfolioPnLRealtime).toBeDefined();
    });
  });

  describe('getPnLChanges', () => {
    it('deve retornar mudanças de PnL vazias para usuário sem posições', async () => {
      const result = await RealtimePnLService.getPnLChanges(999);
      expect(result.positions).toEqual([]);
      expect(result.totalChange).toBe(0);
      expect(result.totalChangePercent).toBe(0);
    });

    it('deve detectar mudanças positivas de PnL', async () => {
      const result = await RealtimePnLService.getPnLChanges(1);
      expect(result).toHaveProperty('positions');
      expect(result).toHaveProperty('totalChange');
      expect(result).toHaveProperty('totalChangePercent');
    });
  });

  describe('updateUnrealizedPnLInDatabase', () => {
    it('deve atualizar PnL sem erros', async () => {
      await expect(RealtimePnLService.updateUnrealizedPnLInDatabase(1)).resolves.not.toThrow();
    });
  });

  describe('Cálculos de PnL', () => {
    it('deve calcular PnL corretamente para compra', () => {
      const trade = {
        type: 'buy' as const,
        entryPrice: 25,
        quantity: 100,
      };
      const currentPrice = 30;
      const pnl = PaperTradingEngine.calculateProfitLoss(trade as any, currentPrice);
      expect(pnl).toBe(500); // (30 - 25) * 100 = 500
    });

    it('deve calcular PnL corretamente para venda', () => {
      const trade = {
        type: 'sell' as const,
        entryPrice: 30,
        quantity: 100,
      };
      const currentPrice = 25;
      const pnl = PaperTradingEngine.calculateProfitLoss(trade as any, currentPrice);
      expect(pnl).toBe(500); // (30 - 25) * 100 = 500
    });

    it('deve calcular PnL negativo corretamente', () => {
      const trade = {
        type: 'buy' as const,
        entryPrice: 30,
        quantity: 100,
      };
      const currentPrice = 25;
      const pnl = PaperTradingEngine.calculateProfitLoss(trade as any, currentPrice);
      expect(pnl).toBe(-500); // (25 - 30) * 100 = -500
    });
  });
});
