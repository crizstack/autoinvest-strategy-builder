import { describe, it, expect } from 'vitest';
import { GraphValidator } from './graph-validator';
import type { ExecutableStrategy } from '../../shared/strategy-types';

describe('GraphValidator', () => {
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

  describe('detectCycles', () => {
    it('should detect simple cycle', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'indicator', subType: 'rsi', label: 'B', params: {} },
        { id: 'c', type: 'action', subType: 'buy', label: 'C', params: {} },
      ];
      const connections = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
        { source: 'c', target: 'a' }, // Ciclo!
      ];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.cycles.length).toBeGreaterThan(0);
      expect(result.isValid).toBe(false);
    });

    it('should not detect cycles in valid DAG', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'indicator', subType: 'rsi', label: 'B', params: {} },
        { id: 'c', type: 'action', subType: 'buy', label: 'C', params: {} },
      ];
      const connections = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.cycles.length).toBe(0);
    });
  });

  describe('validateConnectionTypes', () => {
    it('should reject action → trigger', () => {
      const blocks = [
        { id: 'a', type: 'action', subType: 'buy', label: 'A', params: {} },
        { id: 'b', type: 'trigger', subType: 'price_above', label: 'B', params: {} },
      ];
      const connections = [{ source: 'a', target: 'b' }];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.some((e) => e.includes('Conexão inválida'))).toBe(true);
      expect(result.isValid).toBe(false);
    });

    it('should allow trigger → indicator → action', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'indicator', subType: 'rsi', label: 'B', params: {} },
        { id: 'c', type: 'action', subType: 'buy', label: 'C', params: {} },
      ];
      const connections = [
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' },
      ];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.filter((e) => e.includes('Conexão inválida')).length).toBe(0);
    });

    it('should allow action → risk', () => {
      const blocks = [
        { id: 'a', type: 'action', subType: 'buy', label: 'A', params: {} },
        { id: 'b', type: 'risk', subType: 'stop_loss', label: 'B', params: {} },
      ];
      const connections = [{ source: 'a', target: 'b' }];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.filter((e) => e.includes('Conexão inválida')).length).toBe(0);
    });
  });

  describe('validateConnections', () => {
    it('should reject connection to non-existent block', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
      ];
      const connections = [{ source: 'a', target: 'non-existent' }];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.some((e) => e.includes('bloco inexistente'))).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });

  describe('findOrphanedNodes', () => {
    it('should detect orphaned nodes', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'indicator', subType: 'rsi', label: 'B', params: {} },
        { id: 'c', type: 'action', subType: 'buy', label: 'C', params: {} },
      ];
      const connections = [{ source: 'a', target: 'b' }]; // c é órfão

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.orphanedNodes).toContain('c');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateFlowStructure', () => {
    it('should require at least one trigger', () => {
      const blocks = [
        { id: 'a', type: 'indicator', subType: 'rsi', label: 'A', params: {} },
        { id: 'b', type: 'action', subType: 'buy', label: 'B', params: {} },
      ];
      const connections = [{ source: 'a', target: 'b' }];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.some((e) => e.includes('Trigger'))).toBe(true);
      expect(result.isValid).toBe(false);
    });

    it('should require at least one action', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'indicator', subType: 'rsi', label: 'B', params: {} },
      ];
      const connections = [{ source: 'a', target: 'b' }];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.some((e) => e.includes('Ação'))).toBe(true);
      expect(result.isValid).toBe(false);
    });

    it('should require path from trigger to action', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'action', subType: 'buy', label: 'B', params: {} },
      ];
      const connections = []; // Sem conexão!

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.errors.some((e) => e.includes('caminho'))).toBe(true);
      expect(result.isValid).toBe(false);
    });
  });

  describe('findDisconnectedComponents', () => {
    it('should detect multiple disconnected components', () => {
      const blocks = [
        { id: 'a', type: 'trigger', subType: 'price_above', label: 'A', params: {} },
        { id: 'b', type: 'action', subType: 'buy', label: 'B', params: {} },
        { id: 'c', type: 'trigger', subType: 'price_below', label: 'C', params: {} },
        { id: 'd', type: 'action', subType: 'sell', label: 'D', params: {} },
      ];
      const connections = [
        { source: 'a', target: 'b' },
        { source: 'c', target: 'd' },
      ];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.disconnectedComponents.length).toBe(2);
      expect(result.warnings.some((w) => w.includes('desconectado'))).toBe(true);
    });
  });

  describe('valid strategy', () => {
    it('should validate correct strategy', () => {
      const blocks = [
        { id: 'trigger-1', type: 'trigger', subType: 'price_above', label: 'Price > 100', params: { value: 100 } },
        { id: 'indicator-1', type: 'indicator', subType: 'rsi', label: 'RSI < 30', params: { period: 14, condition: 'below', value: 30 } },
        { id: 'action-1', type: 'action', subType: 'buy', label: 'Buy', params: { orderType: 'market' } },
        { id: 'risk-1', type: 'risk', subType: 'stop_loss', label: 'Stop Loss 2%', params: { percentage: 2 } },
      ];
      const connections = [
        { source: 'trigger-1', target: 'indicator-1' },
        { source: 'indicator-1', target: 'action-1' },
        { source: 'action-1', target: 'risk-1' },
      ];

      const strategy = createStrategy(blocks, connections);
      const result = GraphValidator.validate(strategy);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
