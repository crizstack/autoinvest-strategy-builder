import { describe, it, expect } from 'vitest';
import { TradeExplanationService } from './tradeExplanationService';
import type { IndicatorSignal, TradeContext } from '../../shared/types/tradeLog';

describe('TradeExplanationService', () => {
  const mockIndicators: IndicatorSignal[] = [
    {
      name: 'RSI',
      value: 28,
      threshold: 30,
      condition: 'RSI < 30',
      strength: 'strong',
    },
  ];

  const mockContext: TradeContext = {
    price: 28.5,
    volume: 1000000,
    bid: 28.48,
    ask: 28.52,
    spread: 0.04,
    volatility: 0.015,
    trend: 'uptrend',
    marketCondition: 'trending',
  };

  describe('generateEntryExplanation', () => {
    it('deve gerar explicação de entrada com um indicador', () => {
      const { reason, confidence } = TradeExplanationService.generateEntryExplanation(
        mockIndicators,
        mockContext
      );

      expect(reason).toContain('Compra');
      expect(reason).toContain('RSI');
      expect(confidence).toBeGreaterThan(0);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('deve gerar explicação para entrada manual', () => {
      const { reason, confidence } = TradeExplanationService.generateEntryExplanation([], mockContext);

      expect(reason).toContain('manual');
      expect(confidence).toBe(50);
    });

    it('deve calcular confiança baseada em força dos sinais', () => {
      const strongSignals: IndicatorSignal[] = [
        { name: 'RSI', value: 25, condition: 'RSI < 30', strength: 'strong' },
        { name: 'MACD', value: 0.1, condition: 'MACD > Signal', strength: 'strong' },
      ];

      const { confidence } = TradeExplanationService.generateEntryExplanation(
        strongSignals,
        mockContext
      );

      expect(confidence).toBeGreaterThan(80);
    });
  });

  describe('generateExitExplanation', () => {
    it('deve gerar explicação para saída por profit target', () => {
      const { reason, type } = TradeExplanationService.generateExitExplanation([], 'profit_target');

      expect(reason).toContain('Meta de lucro');
      expect(type).toBe('profit_target');
    });

    it('deve gerar explicação para saída por stop loss', () => {
      const { reason, type } = TradeExplanationService.generateExitExplanation([], 'stop_loss');

      expect(reason).toContain('Stop loss');
      expect(type).toBe('stop_loss');
    });

    it('deve gerar explicação para saída por sinal', () => {
      const { reason } = TradeExplanationService.generateExitExplanation(mockIndicators, 'signal');

      expect(reason).toContain('Sinal de saída');
      expect(reason).toContain('RSI');
    });

    it('deve gerar explicação para saída manual', () => {
      const { reason, type } = TradeExplanationService.generateExitExplanation([], 'manual');

      expect(reason).toContain('manual');
      expect(type).toBe('manual');
    });
  });

  describe('generateMarketContext', () => {
    it('deve gerar contexto de uptrend', () => {
      const context = { ...mockContext, trend: 'uptrend' as const };
      const text = TradeExplanationService.generateMarketContext(context);

      expect(text).toContain('alta');
    });

    it('deve gerar contexto de downtrend', () => {
      const context = { ...mockContext, trend: 'downtrend' as const };
      const text = TradeExplanationService.generateMarketContext(context);

      expect(text).toContain('baixa');
    });

    it('deve incluir informação de volatilidade alta', () => {
      const context = { ...mockContext, volatility: 0.03 };
      const text = TradeExplanationService.generateMarketContext(context);

      expect(text).toContain('volatilidade');
    });

    it('deve incluir informação de spread elevado', () => {
      const context = { ...mockContext, spread: 0.05 };
      const text = TradeExplanationService.generateMarketContext(context);

      expect(text).toContain('spread');
    });
  });

  describe('generateFullExplanation', () => {
    it('deve gerar explicação completa', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'profit_target',
        mockContext,
        2.5,
        'Operação bem executada'
      );

      expect(explanation.entryReason).toBeTruthy();
      expect(explanation.exitReason).toBeTruthy();
      expect(explanation.marketContext).toBeTruthy();
      expect(explanation.riskReward).toBe(2.5);
      expect(explanation.notes).toBe('Operação bem executada');
      expect(explanation.entryConfidence).toBeGreaterThan(0);
    });

    it('deve incluir indicadores na explicação', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'signal',
        mockContext,
        1.8
      );

      expect(explanation.entryIndicators).toHaveLength(1);
      expect(explanation.entryIndicators[0].name).toBe('RSI');
    });
  });

  describe('generateImprovement', () => {
    it('deve retornar null para trade lucrativo', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'profit_target',
        mockContext,
        2.5
      );

      const improvement = TradeExplanationService.generateImprovement(explanation, 850);
      expect(improvement).toBeNull();
    });

    it('deve sugerir ajuste de stop loss', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'stop_loss',
        mockContext,
        0.5
      );

      const improvement = TradeExplanationService.generateImprovement(explanation, -160);
      expect(improvement).toContain('stop loss');
    });

    it('deve sugerir esperar confirmação para sinal fraco', () => {
      const weakSignal: IndicatorSignal = {
        name: 'RSI',
        value: 35,
        condition: 'RSI < 40',
        strength: 'weak',
      };

      const explanation = TradeExplanationService.generateFullExplanation(
        [weakSignal],
        mockIndicators,
        'signal',
        mockContext,
        1.2
      );

      const improvement = TradeExplanationService.generateImprovement(explanation, -100);
      expect(improvement).toContain('confirmação');
    });

    it('deve sugerir usar sinais automáticos para saída manual', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'manual',
        mockContext,
        1.5
      );

      const improvement = TradeExplanationService.generateImprovement(explanation, -200);
      expect(improvement).toContain('automáticos');
    });
  });

  describe('formatExplanation', () => {
    it('deve formatar explicação para exibição', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'profit_target',
        mockContext,
        2.5,
        'Nota importante'
      );

      const formatted = TradeExplanationService.formatExplanation(explanation);

      expect(formatted).toContain('Entrada');
      expect(formatted).toContain('Saída');
      expect(formatted).toContain('Contexto');
      expect(formatted).toContain('Risco/Recompensa');
      expect(formatted).toContain('Nota importante');
    });

    it('deve incluir indicadores no formato', () => {
      const explanation = TradeExplanationService.generateFullExplanation(
        mockIndicators,
        mockIndicators,
        'signal',
        mockContext,
        2.0
      );

      const formatted = TradeExplanationService.formatExplanation(explanation);

      expect(formatted).toContain('RSI');
    });
  });

  describe('Indicadores específicos', () => {
    it('deve gerar explicação para MACD', () => {
      const macdSignal: IndicatorSignal = {
        name: 'MACD',
        value: 0.15,
        condition: 'MACD > Signal Line',
        strength: 'strong',
      };

      const { reason } = TradeExplanationService.generateEntryExplanation([macdSignal], mockContext);

      expect(reason).toContain('MACD');
      expect(reason).toContain('Compra');
    });

    it('deve gerar explicação para Bollinger Bands', () => {
      const bbSignal: IndicatorSignal = {
        name: 'Bollinger Bands',
        value: 29.5,
        condition: 'Preço > Banda Superior',
        strength: 'medium',
      };

      const { reason } = TradeExplanationService.generateEntryExplanation([bbSignal], mockContext);

      expect(reason).toContain('Bollinger');
    });

    it('deve gerar explicação para Moving Average', () => {
      const maSignal: IndicatorSignal = {
        name: 'Moving Average',
        value: 28.2,
        condition: 'MA20 > MA50',
        strength: 'strong',
      };

      const { reason } = TradeExplanationService.generateEntryExplanation([maSignal], mockContext);

      expect(reason).toContain('média móvel');
    });

    it('deve gerar explicação para múltiplos indicadores', () => {
      const multipleSignals: IndicatorSignal[] = [
        { name: 'RSI', value: 28, condition: 'RSI < 30', strength: 'strong' },
        { name: 'MACD', value: 0.1, condition: 'MACD > Signal', strength: 'strong' },
      ];

      const { reason } = TradeExplanationService.generateEntryExplanation(multipleSignals, mockContext);

      expect(reason).toContain('Múltiplos');
      expect(reason).toContain('RSI');
      expect(reason).toContain('MACD');
    });
  });
});
