/**
 * Input Normalizer
 * Converte entrada do Builder (React Flow format) para ExecutableStrategyV2
 * Normaliza parâmetros e gera IDs únicos
 */

import type { ExecutableStrategyV2, StrategyBlockV2, StrategyConnection } from '../../shared/strategy-schema-v2';
import { migrateBlockToV2 } from '../../shared/strategy-schema-v2';

export interface BuilderInput {
  name: string;
  description?: string;
  asset: string;
  nodes: Array<{
    id: string;
    data: {
      type: string;
      subType: string;
      label: string;
      params?: Record<string, any>;
    };
    position?: { x: number; y: number };
  }>;
  edges: Array<{
    source: string;
    target: string;
  }>;
}

export class InputNormalizer {
  /**
   * Normaliza entrada do Builder para ExecutableStrategyV2
   */
  static normalizeBuilderInput(input: BuilderInput, userId: number): ExecutableStrategyV2 {
    const now = new Date();
    const strategyId = `strategy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Normalizar blocos
    const blocks = this.normalizeBlocks(input.nodes);

    // Normalizar conexões
    const connections = this.normalizeConnections(input.edges);

    // Criar estratégia v2.0
    const strategy: ExecutableStrategyV2 = {
      id: strategyId,
      name: input.name,
      description: input.description,
      asset: input.asset.toUpperCase(),
      userId,
      status: 'draft',
      blocks,
      connections,
      createdAt: now,
      updatedAt: now,
      version: 1,
      metadata: {
        backtestCount: 0,
      },
    };

    return strategy;
  }

  /**
   * Normaliza blocos do Builder
   */
  private static normalizeBlocks(nodes: BuilderInput['nodes']): StrategyBlockV2[] {
    return nodes.map((node) => {
      const blockType = node.data.type;
      const subType = node.data.subType;
      const label = node.data.label || `${blockType} - ${subType}`;
      const params = node.data.params || {};

      // Gerar ID único se necessário
      const id = this.normalizeBlockId(node.id, blockType);

      // Normalizar parâmetros por tipo
      const normalizedParams = this.normalizeParams(blockType, subType, params);

      return {
        id,
        type: blockType as any,
        label,
        params: normalizedParams,
        position: node.position,
      } as StrategyBlockV2;
    });
  }

  /**
   * Normaliza ID de bloco
   * Se não segue padrão, gera novo ID único
   */
  private static normalizeBlockId(nodeId: string, blockType: string): string {
    // Se já segue padrão, retorna
    if (nodeId.startsWith(`${blockType}-`) && nodeId.includes('-')) {
      return nodeId;
    }

    // Gera novo ID único
    return `${blockType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Normaliza parâmetros por tipo de bloco
   */
  private static normalizeParams(blockType: string, subType: string, params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = {
      type: subType,
    };

    switch (blockType) {
      case 'trigger':
        normalized[subType] = this.normalizeTriggerParams(subType, params);
        break;

      case 'indicator':
        normalized[subType] = this.normalizeIndicatorParams(subType, params);
        break;

      case 'operator':
        // Operadores não têm parâmetros adicionais
        break;

      case 'action':
        normalized[subType] = this.normalizeActionParams(subType, params);
        break;

      case 'risk':
        normalized[subType] = this.normalizeRiskParams(subType, params);
        break;
    }

    return normalized;
  }

  private static normalizeTriggerParams(subType: string, params: Record<string, any>): Record<string, any> {
    switch (subType) {
      case 'price_above':
      case 'price_below':
        return {
          value: Number(params.value || 0),
        };

      case 'ma_cross':
        return {
          fastPeriod: Number(params.fastPeriod || 9),
          slowPeriod: Number(params.slowPeriod || 21),
          direction: params.direction || 'up',
        };

      default:
        return params;
    }
  }

  private static normalizeIndicatorParams(subType: string, params: Record<string, any>): Record<string, any> {
    switch (subType) {
      case 'rsi':
        return {
          period: Number(params.period || 14),
          condition: params.condition || 'below',
          value: Number(params.value || 30),
        };

      case 'ma':
        return {
          period: Number(params.period || 20),
          type: params.type || 'sma',
          condition: params.condition || 'above',
          value: Number(params.value || 0),
        };

      case 'macd':
        return {
          fastPeriod: Number(params.fastPeriod || 12),
          slowPeriod: Number(params.slowPeriod || 26),
          signalPeriod: Number(params.signalPeriod || 9),
          condition: params.condition || 'above_signal',
        };

      case 'volume':
        return {
          condition: params.condition || 'above',
          value: Number(params.value || 0),
          period: Number(params.period || 20),
        };

      default:
        return params;
    }
  }

  private static normalizeActionParams(subType: string, params: Record<string, any>): Record<string, any> {
    const baseParams = {
      orderType: params.orderType || 'market',
    };

    switch (subType) {
      case 'buy':
      case 'sell':
        return {
          ...baseParams,
          quantity: params.quantity ? Number(params.quantity) : undefined,
          percentCapital: params.percentCapital ? Number(params.percentCapital) : undefined,
          limitPrice: params.limitPrice ? Number(params.limitPrice) : undefined,
        };

      case 'close':
        return {
          ...baseParams,
          limitPrice: params.limitPrice ? Number(params.limitPrice) : undefined,
        };

      default:
        return params;
    }
  }

  private static normalizeRiskParams(subType: string, params: Record<string, any>): Record<string, any> {
    switch (subType) {
      case 'stop_loss':
      case 'take_profit':
      case 'max_per_trade':
        return {
          percentage: Number(params.percentage || 2),
          fixedValue: params.fixedValue ? Number(params.fixedValue) : undefined,
        };

      default:
        return params;
    }
  }

  /**
   * Normaliza conexões
   */
  private static normalizeConnections(edges: BuilderInput['edges']): StrategyConnection[] {
    return edges.map((edge) => ({
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: edge.source,
      target: edge.target,
    }));
  }

  /**
   * Converte entrada legada (v1) para v2.0
   */
  static migrateFromV1(strategy: any, userId: number): ExecutableStrategyV2 {
    const now = new Date();

    // Se já tem blocks/connections no formato v1, migrar
    const blocks = (strategy.blocks || []).map((block: any) => migrateBlockToV2(block));
    const connections = (strategy.connections || []).map((conn: any) => ({
      id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: conn.source,
      target: conn.target,
    }));

    return {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      asset: strategy.asset.toUpperCase(),
      userId,
      status: strategy.status || 'draft',
      blocks,
      connections,
      createdAt: new Date(strategy.createdAt),
      updatedAt: now,
      version: 2,
      metadata: strategy.metadata,
    };
  }
}
