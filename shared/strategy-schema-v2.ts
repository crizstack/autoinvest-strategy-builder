/**
 * Strategy Schema v2.0
 * Modelo JSON padronizado e executável para estratégias
 * Garante tipagem rigorosa, validação de conexões e reutilização
 */

// ============ TIPOS BASE ============

export type BlockType = 'trigger' | 'indicator' | 'operator' | 'action' | 'risk';
export type TriggerType = 'price_above' | 'price_below' | 'ma_cross';
export type IndicatorType = 'rsi' | 'ma' | 'macd' | 'volume';
export type OperatorType = 'and' | 'or';
export type ActionType = 'buy' | 'sell' | 'close';
export type RiskType = 'stop_loss' | 'take_profit' | 'max_per_trade';

// ============ PARÂMETROS TIPADOS POR BLOCO ============

export interface TriggerBlockParams {
  type: TriggerType;
  price_above?: { value: number };
  price_below?: { value: number };
  ma_cross?: { fastPeriod: number; slowPeriod: number; direction: 'up' | 'down' };
}

export interface IndicatorBlockParams {
  type: IndicatorType;
  rsi?: { period: number; condition: 'above' | 'below'; value: number };
  ma?: { period: number; type: 'sma' | 'ema'; condition: 'above' | 'below'; value: number };
  macd?: { fastPeriod: number; slowPeriod: number; signalPeriod: number; condition: 'above_signal' | 'below_signal' };
  volume?: { condition: 'above' | 'below'; value: number; period: number };
}

export interface OperatorBlockParams {
  type: OperatorType;
  // AND/OR não têm parâmetros adicionais
}

export interface ActionBlockParams {
  type: ActionType;
  buy?: { orderType: 'market' | 'limit'; quantity?: number; percentCapital?: number; limitPrice?: number };
  sell?: { orderType: 'market' | 'limit'; quantity?: number; percentCapital?: number; limitPrice?: number };
  close?: { orderType: 'market' | 'limit'; limitPrice?: number };
}

export interface RiskBlockParams {
  type: RiskType;
  stop_loss?: { percentage: number; fixedValue?: number };
  take_profit?: { percentage: number; fixedValue?: number };
  max_per_trade?: { percentage: number; fixedValue?: number };
}

// ============ BLOCOS TIPADOS ============

export interface TriggerBlock {
  id: string; // Único: `trigger-${timestamp}-${random}`
  type: 'trigger';
  label: string;
  params: TriggerBlockParams;
  position?: { x: number; y: number };
}

export interface IndicatorBlock {
  id: string; // Único: `indicator-${timestamp}-${random}`
  type: 'indicator';
  label: string;
  params: IndicatorBlockParams;
  position?: { x: number; y: number };
}

export interface OperatorBlock {
  id: string; // Único: `operator-${timestamp}-${random}`
  type: 'operator';
  label: string;
  params: OperatorBlockParams;
  position?: { x: number; y: number };
}

export interface ActionBlock {
  id: string; // Único: `action-${timestamp}-${random}`
  type: 'action';
  label: string;
  params: ActionBlockParams;
  position?: { x: number; y: number };
}

export interface RiskBlock {
  id: string; // Único: `risk-${timestamp}-${random}`
  type: 'risk';
  label: string;
  params: RiskBlockParams;
  position?: { x: number; y: number };
}

export type StrategyBlockV2 = TriggerBlock | IndicatorBlock | OperatorBlock | ActionBlock | RiskBlock;

// ============ CONEXÕES TIPADAS ============

export interface StrategyConnection {
  id: string; // Único: `conn-${timestamp}-${random}`
  source: string; // ID do bloco de origem
  target: string; // ID do bloco de destino
  // Validação em tempo de execução garante transições válidas:
  // trigger -> indicator | operator | action
  // indicator -> operator | action
  // operator -> operator | action
  // action -> risk
  // risk -> (nenhum)
}

// ============ ESTRATÉGIA COMPLETA V2.0 ============

export interface ExecutableStrategyV2 {
  // Metadados
  id: string; // Único no banco
  name: string;
  description?: string;
  asset: string; // Ex: PETR4
  userId: number;
  status: 'draft' | 'active' | 'paused' | 'archived';

  // Estrutura
  blocks: StrategyBlockV2[];
  connections: StrategyConnection[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  version: number; // Incrementa a cada atualização

  // Metadados de execução
  metadata?: {
    backtestCount?: number;
    lastBacktestAt?: Date;
    lastBacktestResult?: {
      totalReturn: number;
      winRate: number;
      sharpeRatio: number;
    };
    paperTradingActive?: boolean;
    paperTradingStartedAt?: Date;
  };
}

// ============ VALIDAÇÃO ============

export interface StrategyValidationError {
  code: string;
  message: string;
  blockId?: string;
  connectionId?: string;
  severity: 'error' | 'warning';
}

export interface StrategyValidationResult {
  isValid: boolean;
  errors: StrategyValidationError[];
  warnings: StrategyValidationError[];
  blocksCount: number;
  connectionsCount: number;
  executionOrder?: string[]; // IDs em ordem topológica
}

// ============ REGRAS DE VALIDAÇÃO ============

/**
 * Transições válidas de blocos
 * Define quais tipos de blocos podem conectar a quais
 */
export const VALID_TRANSITIONS: Record<BlockType, BlockType[]> = {
  trigger: ['indicator', 'operator', 'action'],
  indicator: ['operator', 'action'],
  operator: ['operator', 'action'],
  action: ['risk'],
  risk: [],
};

/**
 * Requisitos estruturais de estratégia válida
 */
export const STRATEGY_REQUIREMENTS = {
  minTriggers: 1, // Pelo menos 1 trigger
  minActions: 1, // Pelo menos 1 action
  maxDepth: 50, // Profundidade máxima do grafo
  maxBlocks: 100, // Máximo de blocos
  maxConnections: 200, // Máximo de conexões
};

// ============ CONVERSÃO DE TIPOS ============

/**
 * Converte StrategyBlock (v1) para StrategyBlockV2 (v2)
 * Usado para migração de dados existentes
 */
export function migrateBlockToV2(block: any): StrategyBlockV2 {
  const baseBlock = {
    id: block.id,
    label: block.label,
    position: block.position,
  };

  switch (block.type) {
    case 'trigger':
      return {
        ...baseBlock,
        type: 'trigger',
        params: {
          type: block.subType || 'price_above',
          [block.subType]: block.params,
        },
      } as TriggerBlock;

    case 'indicator':
      return {
        ...baseBlock,
        type: 'indicator',
        params: {
          type: block.subType || 'rsi',
          [block.subType]: block.params,
        },
      } as IndicatorBlock;

    case 'operator':
      return {
        ...baseBlock,
        type: 'operator',
        params: {
          type: block.subType || 'and',
        },
      } as OperatorBlock;

    case 'action':
      return {
        ...baseBlock,
        type: 'action',
        params: {
          type: block.subType || 'buy',
          [block.subType]: block.params,
        },
      } as ActionBlock;

    case 'risk':
      return {
        ...baseBlock,
        type: 'risk',
        params: {
          type: block.subType || 'stop_loss',
          [block.subType]: block.params,
        },
      } as RiskBlock;

    default:
      throw new Error(`Tipo de bloco desconhecido: ${block.type}`);
  }
}

/**
 * Converte ExecutableStrategyV2 para formato de persistência
 */
export function strategyToJSON(strategy: ExecutableStrategyV2): string {
  return JSON.stringify({
    id: strategy.id,
    name: strategy.name,
    description: strategy.description,
    asset: strategy.asset,
    userId: strategy.userId,
    status: strategy.status,
    blocks: strategy.blocks,
    connections: strategy.connections,
    createdAt: strategy.createdAt.toISOString(),
    updatedAt: strategy.updatedAt.toISOString(),
    version: strategy.version,
    metadata: strategy.metadata,
  });
}

/**
 * Converte JSON para ExecutableStrategyV2
 */
export function jsonToStrategy(json: string): ExecutableStrategyV2 {
  const data = JSON.parse(json);
  return {
    ...data,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
  };
}
