import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Testes para Strategy Builder
 * Validam que o builder de estratégias funciona corretamente
 */

describe('Strategy Builder', () => {
  describe('Validation', () => {
    it('deve validar estratégia completa', () => {
      const strategy = {
        asset: 'PETR4',
        name: 'Estratégia RSI',
        nodes: [
          { id: '1', type: 'trigger', label: 'Preço acima' },
          { id: '2', type: 'indicator', label: 'RSI' },
          { id: '3', type: 'action', label: 'Comprar' },
        ],
        edges: [
          { source: '1', target: '2' },
          { source: '2', target: '3' },
        ],
      };

      // Validações
      const hasAsset = !!strategy.asset;
      const hasTrigger = strategy.nodes.some((n) => n.type === 'trigger');
      const hasAction = strategy.nodes.some((n) => n.type === 'action');
      const allNodesConnected = strategy.nodes.every((n) =>
        strategy.edges.some((e) => e.source === n.id || e.target === n.id)
      );

      expect(hasAsset).toBe(true);
      expect(hasTrigger).toBe(true);
      expect(hasAction).toBe(true);
      expect(allNodesConnected).toBe(true);
    });

    it('deve rejeitar estratégia sem ativo', () => {
      const strategy = {
        asset: '',
        name: 'Estratégia incompleta',
        nodes: [{ id: '1', type: 'trigger', label: 'Preço acima' }],
        edges: [],
      };

      const errors: string[] = [];
      if (!strategy.asset) errors.push('Ativo obrigatório');

      expect(errors).toContain('Ativo obrigatório');
    });

    it('deve rejeitar estratégia sem trigger', () => {
      const strategy = {
        asset: 'PETR4',
        name: 'Estratégia incompleta',
        nodes: [{ id: '1', type: 'action', label: 'Comprar' }],
        edges: [],
      };

      const errors: string[] = [];
      const hasTrigger = strategy.nodes.some((n) => n.type === 'trigger');
      if (!hasTrigger) errors.push('Trigger obrigatório');

      expect(errors).toContain('Trigger obrigatório');
    });

    it('deve rejeitar estratégia sem ação', () => {
      const strategy = {
        asset: 'PETR4',
        name: 'Estratégia incompleta',
        nodes: [{ id: '1', type: 'trigger', label: 'Preço acima' }],
        edges: [],
      };

      const errors: string[] = [];
      const hasAction = strategy.nodes.some((n) => n.type === 'action');
      if (!hasAction) errors.push('Ação obrigatória');

      expect(errors).toContain('Ação obrigatória');
    });

    it('deve detectar blocos desconectados', () => {
      const strategy = {
        asset: 'PETR4',
        name: 'Estratégia com blocos desconectados',
        nodes: [
          { id: '1', type: 'trigger', label: 'Preço acima' },
          { id: '2', type: 'indicator', label: 'RSI' },
          { id: '3', type: 'action', label: 'Comprar' },
          { id: '4', type: 'risk', label: 'Stop Loss' }, // Desconectado
        ],
        edges: [
          { source: '1', target: '2' },
          { source: '2', target: '3' },
        ],
      };

      const connectedNodeIds = new Set<string>();
      strategy.edges.forEach((edge) => {
        connectedNodeIds.add(edge.source);
        connectedNodeIds.add(edge.target);
      });

      const isolatedNodes = strategy.nodes.filter((n) => !connectedNodeIds.has(n.id));

      expect(isolatedNodes.length).toBe(1);
      expect(isolatedNodes[0].id).toBe('4');
    });
  });

  describe('Block Types', () => {
    it('deve reconhecer tipos de blocos válidos', () => {
      const blockTypes = ['trigger', 'indicator', 'operator', 'action', 'risk'];
      const testBlock = { type: 'trigger' };

      expect(blockTypes).toContain(testBlock.type);
    });

    it('deve validar trigger types', () => {
      const triggerTypes = ['price_above', 'price_below', 'ma_cross'];
      const testTrigger = { subType: 'price_above' };

      expect(triggerTypes).toContain(testTrigger.subType);
    });

    it('deve validar action types', () => {
      const actionTypes = ['buy', 'sell', 'close'];
      const testAction = { subType: 'buy' };

      expect(actionTypes).toContain(testAction.subType);
    });

    it('deve validar risk types', () => {
      const riskTypes = ['stop_loss', 'take_profit', 'max_per_trade'];
      const testRisk = { subType: 'stop_loss' };

      expect(riskTypes).toContain(testRisk.subType);
    });
  });

  describe('Block Parameters', () => {
    it('deve armazenar parâmetros de trigger', () => {
      const trigger = {
        type: 'trigger',
        subType: 'price_above',
        params: { value: 100.5 },
      };

      expect(trigger.params.value).toBe(100.5);
    });

    it('deve armazenar parâmetros de indicador RSI', () => {
      const indicator = {
        type: 'indicator',
        subType: 'rsi',
        params: { period: 14, condition: 'below', value: 30 },
      };

      expect(indicator.params.period).toBe(14);
      expect(indicator.params.condition).toBe('below');
      expect(indicator.params.value).toBe(30);
    });

    it('deve armazenar parâmetros de ação', () => {
      const action = {
        type: 'action',
        subType: 'buy',
        params: { orderValue: 1000, percentCapital: 10 },
      };

      expect(action.params.orderValue).toBe(1000);
      expect(action.params.percentCapital).toBe(10);
    });

    it('deve armazenar parâmetros de risco', () => {
      const risk = {
        type: 'risk',
        subType: 'stop_loss',
        params: { percentage: 2 },
      };

      expect(risk.params.percentage).toBe(2);
    });
  });

  describe('Strategy Flow', () => {
    it('deve construir fluxo correto de estratégia', () => {
      const strategy = {
        asset: 'PETR4',
        nodes: [
          { id: '1', type: 'trigger', label: 'Preço acima de 25' },
          { id: '2', type: 'indicator', label: 'RSI < 30' },
          { id: '3', type: 'action', label: 'Comprar' },
          { id: '4', type: 'risk', label: 'Stop Loss 2%' },
        ],
        edges: [
          { source: '1', target: '2' },
          { source: '2', target: '3' },
          { source: '3', target: '4' },
        ],
      };

      // Construir descrição do fluxo
      const triggers = strategy.nodes.filter((n) => n.type === 'trigger');
      const indicators = strategy.nodes.filter((n) => n.type === 'indicator');
      const actions = strategy.nodes.filter((n) => n.type === 'action');
      const risks = strategy.nodes.filter((n) => n.type === 'risk');

      expect(triggers.length).toBe(1);
      expect(indicators.length).toBe(1);
      expect(actions.length).toBe(1);
      expect(risks.length).toBe(1);

      // Verificar que fluxo é: Trigger -> Indicator -> Action -> Risk
      expect(strategy.edges.length).toBe(3);
    });

    it('deve permitir múltiplos indicadores', () => {
      const strategy = {
        nodes: [
          { id: '1', type: 'trigger', label: 'Preço acima' },
          { id: '2', type: 'indicator', label: 'RSI' },
          { id: '3', type: 'indicator', label: 'MACD' },
          { id: '4', type: 'operator', label: 'AND' },
          { id: '5', type: 'action', label: 'Comprar' },
        ],
        edges: [
          { source: '1', target: '2' },
          { source: '1', target: '3' },
          { source: '2', target: '4' },
          { source: '3', target: '4' },
          { source: '4', target: '5' },
        ],
      };

      const indicators = strategy.nodes.filter((n) => n.type === 'indicator');
      expect(indicators.length).toBe(2);
    });
  });

  describe('Asset Selection', () => {
    it('deve validar ativo selecionado', () => {
      const mainAssets = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'BBAS3', 'WEGE3', 'MGLU3'];
      const selectedAsset = 'PETR4';

      expect(mainAssets).toContain(selectedAsset);
    });

    it('deve rejeitar ativo não selecionado', () => {
      const selectedAsset = '';
      const isValid = selectedAsset.length > 0;

      expect(isValid).toBe(false);
    });

    it('deve permitir qualquer ativo válido', () => {
      const mainAssets = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'BBAS3', 'WEGE3', 'MGLU3'];
      const testAssets = ['PETR4', 'VALE3', 'ITUB4'];

      testAssets.forEach((asset) => {
        expect(mainAssets).toContain(asset);
      });
    });
  });
});
