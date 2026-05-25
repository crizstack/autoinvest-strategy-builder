/**
 * Tipos para estratégia executável
 * Define a estrutura completa de uma estratégia pronta para execução
 */

// ============ TIPOS BASE ============

export type BlockType = 'trigger' | 'indicator' | 'operator' | 'action' | 'risk';
export type TriggerType = 'price_above' | 'price_below' | 'ma_cross';
export type IndicatorType = 'rsi' | 'ma' | 'macd' | 'volume';
export type OperatorType = 'and' | 'or';
export type ActionType = 'buy' | 'sell' | 'close';
export type RiskType = 'stop_loss' | 'take_profit' | 'max_per_trade';

// ============ PARÂMETROS DE BLOCOS ============

export interface TriggerParams {
  price_above: { value: number; timeframe?: string };
  price_below: { value: number; timeframe?: string };
  ma_cross: { fastPeriod: number; slowPeriod: number; direction: 'up' | 'down' };
}

export interface IndicatorParams {
  rsi: { period: number; condition: 'above' | 'below'; value: number };
  ma: { period: number; type: 'sma' | 'ema'; condition: 'above' | 'below'; value: number };
  macd: { fastPeriod: number; slowPeriod: number; signalPeriod: number; condition: 'above_signal' | 'below_signal' };
  volume: { condition: 'above' | 'below'; value: number; period: number };
}

export interface ActionParams {
  buy: { orderType: 'market' | 'limit'; quantity?: number; percentCapital?: number; limitPrice?: number };
  sell: { orderType: 'market' | 'limit'; quantity?: number; percentCapital?: number; limitPrice?: number };
  close: { orderType: 'market' | 'limit'; limitPrice?: number };
}

export interface RiskParams {
  stop_loss: { percentage: number; fixedValue?: number };
  take_profit: { percentage: number; fixedValue?: number };
  max_per_trade: { percentage: number; fixedValue?: number };
}

export interface OperatorParams {
  and: Record<string, never>;
  or: Record<string, never>;
}

// ============ BLOCOS ============

export interface StrategyBlock {
  id: string; // Único: ${type}-${timestamp}-${random}
  type: BlockType;
  subType: TriggerType | IndicatorType | OperatorType | ActionType | RiskType;
  label: string;
  params: Record<string, any>;
  position?: { x: number; y: number };
}

export interface StrategyConnection {
  source: string; // ID do bloco de origem
  target: string; // ID do bloco de destino
}

// ============ ESTRATÉGIA COMPLETA ============

export interface ExecutableStrategy {
  id: string;
  name: string;
  description?: string;
  asset: string; // Ex: PETR4
  blocks: StrategyBlock[];
  connections: StrategyConnection[];
  createdAt: Date;
  updatedAt: Date;
  userId: number;
  status: 'draft' | 'active' | 'paused' | 'archived';
}

// ============ GRAFO DE EXECUÇÃO ============

export interface ExecutionNode {
  blockId: string;
  block: StrategyBlock;
  dependencies: string[]; // IDs dos blocos que devem executar antes
  dependents: string[]; // IDs dos blocos que dependem deste
  order: number; // Ordem de execução topológica
}

export interface ExecutionGraph {
  nodes: Map<string, ExecutionNode>;
  executionOrder: string[]; // Ordem topológica dos blocos
  isValid: boolean;
  errors: string[];
}

// ============ RESULTADO DE EXECUÇÃO ============

export interface BlockExecutionResult {
  blockId: string;
  blockType: BlockType;
  success: boolean;
  value?: any; // Resultado do cálculo/avaliação
  error?: string;
  timestamp: Date;
  logs: string[];
}

export interface StrategyExecutionResult {
  strategyId: string;
  asset: string;
  timestamp: Date;
  blockResults: BlockExecutionResult[];
  signal?: 'buy' | 'sell' | 'close' | 'none';
  signalStrength?: number; // 0-100
  riskLevels?: {
    stopLoss?: number;
    takeProfit?: number;
    maxPerTrade?: number;
  };
  errors: string[];
  executionTime: number; // ms
}

// ============ VALIDAÇÃO ============

export interface ValidationError {
  blockId?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface StrategyValidation {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============ HISTÓRICO DE EXECUÇÃO ============

export interface ExecutionLog {
  id: string;
  strategyId: string;
  userId: number;
  executedAt: Date;
  result: StrategyExecutionResult;
  tradeGenerated?: {
    id: string;
    type: 'buy' | 'sell' | 'close';
    quantity: number;
    price: number;
  };
}
