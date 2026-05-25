/**
 * Testes para Strategy Engine
 * Valida validador e parser de estratégia
 */

import { describe, it, expect } from 'vitest';
import { StrategyValidator } from './validator';
import { StrategyParser } from './parser';
import type { ExecutableStrategy } from '../../shared/strategy-types';

describe('Strategy Engine', () => {
  describe('Validator', () => {
    it('deve validar estratégia completa e válida', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
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
            id: 'operator-1',
            type: 'operator',
            subType: 'and',
            label: 'AND',
            params: {},
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
          { source: 'indicator-1', target: 'operator-1' },
          { source: 'operator-1', target: 'action-1' },
          { source: 'action-1', target: 'risk-1' },
        ],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('deve rejeitar estratégia sem ativo', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
        name: 'Invalid Strategy',
        asset: '',
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
        ],
        connections: [],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.message.includes('Ativo'))).toBe(true);
    });

    it('deve rejeitar estratégia sem trigger', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
        name: 'Invalid Strategy',
        asset: 'PETR4',
        userId: 1,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        blocks: [
          {
            id: 'action-1',
            type: 'action',
            subType: 'buy',
            label: 'Comprar',
            params: { orderType: 'market' },
          },
        ],
        connections: [],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.message.includes('Trigger'))).toBe(true);
    });

    it('deve rejeitar estratégia sem ação', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
        name: 'Invalid Strategy',
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
        ],
        connections: [],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.message.includes('Ação'))).toBe(true);
    });

    it('deve detectar blocos desconectados', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
        name: 'Invalid Strategy',
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
            params: { orderType: 'market' },
          },
          {
            id: 'risk-1',
            type: 'risk',
            subType: 'stop_loss',
            label: 'Stop Loss',
            params: { percentage: 2 },
          },
        ],
        connections: [{ source: 'trigger-1', target: 'action-1' }],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.message.includes('desconectado'))).toBe(true);
    });

    it('deve validar parâmetros de RSI', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
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
            label: 'RSI',
            params: { period: 14, condition: 'below', value: 150 }, // Valor inválido
          },
          {
            id: 'action-1',
            type: 'action',
            subType: 'buy',
            label: 'Comprar',
            params: { orderType: 'market' },
          },
        ],
        connections: [
          { source: 'trigger-1', target: 'indicator-1' },
          { source: 'indicator-1', target: 'action-1' },
        ],
      };

      const validation = StrategyValidator.validate(strategy);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.message.includes('0 e 100'))).toBe(true);
    });
  });

  describe('Parser', () => {
    it('deve construir grafo de execução válido', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
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
            params: { orderType: 'market' },
          },
        ],
        connections: [
          { source: 'trigger-1', target: 'indicator-1' },
          { source: 'indicator-1', target: 'action-1' },
        ],
      };

      const graph = StrategyParser.buildExecutionGraph(strategy);
      expect(graph.isValid).toBe(true);
      expect(graph.executionOrder).toHaveLength(3);
      expect(graph.errors).toHaveLength(0);
    });

    it('deve detectar ciclos', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
        name: 'Invalid Strategy',
        asset: 'PETR4',
        userId: 1,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        blocks: [
          {
            id: 'block-1',
            type: 'indicator',
            subType: 'rsi',
            label: 'RSI',
            params: { period: 14, condition: 'below', value: 30 },
          },
          {
            id: 'block-2',
            type: 'indicator',
            subType: 'ma',
            label: 'MA',
            params: { period: 20, type: 'sma', condition: 'above', value: 100 },
          },
        ],
        connections: [
          { source: 'block-1', target: 'block-2' },
          { source: 'block-2', target: 'block-1' }, // Ciclo!
        ],
      };

      const graph = StrategyParser.buildExecutionGraph(strategy);
      expect(graph.isValid).toBe(false);
      expect(graph.errors.some((e) => e.includes('ciclo'))).toBe(true);
    });

    it('deve ordenar blocos topologicamente', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
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
            label: 'RSI',
            params: { period: 14, condition: 'below', value: 30 },
          },
          {
            id: 'indicator-2',
            type: 'indicator',
            subType: 'ma',
            label: 'MA',
            params: { period: 20, type: 'sma', condition: 'above', value: 100 },
          },
          {
            id: 'operator-1',
            type: 'operator',
            subType: 'and',
            label: 'AND',
            params: {},
          },
          {
            id: 'action-1',
            type: 'action',
            subType: 'buy',
            label: 'Comprar',
            params: { orderType: 'market' },
          },
        ],
        connections: [
          { source: 'trigger-1', target: 'indicator-1' },
          { source: 'trigger-1', target: 'indicator-2' },
          { source: 'indicator-1', target: 'operator-1' },
          { source: 'indicator-2', target: 'operator-1' },
          { source: 'operator-1', target: 'action-1' },
        ],
      };

      const graph = StrategyParser.buildExecutionGraph(strategy);
      expect(graph.isValid).toBe(true);
      expect(graph.executionOrder).toHaveLength(5);
      // Trigger deve ser primeiro
      expect(graph.executionOrder[0]).toBe('trigger-1');
      // Action deve ser último
      expect(graph.executionOrder[graph.executionOrder.length - 1]).toBe('action-1');
    });

    it('deve obter blocos por tipo', () => {
      const strategy: ExecutableStrategy = {
        id: 'strat-1',
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
            label: 'RSI',
            params: { period: 14, condition: 'below', value: 30 },
          },
          {
            id: 'action-1',
            type: 'action',
            subType: 'buy',
            label: 'Comprar',
            params: { orderType: 'market' },
          },
        ],
        connections: [
          { source: 'trigger-1', target: 'indicator-1' },
          { source: 'indicator-1', target: 'action-1' },
        ],
      };

      const graph = StrategyParser.buildExecutionGraph(strategy);
      const indicators = StrategyParser.getBlocksByType(graph, 'indicator');
      expect(indicators).toHaveLength(1);
      expect(indicators[0].block.subType).toBe('rsi');
    });
  });
});
