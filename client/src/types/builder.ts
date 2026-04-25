export type BlockType = 'trigger' | 'indicator' | 'operator' | 'action' | 'risk';

export type TriggerType = 'price_above' | 'price_below' | 'ma_cross';
export type IndicatorType = 'rsi' | 'ma' | 'macd' | 'volume';
export type OperatorType = 'and' | 'or';
export type ActionType = 'buy' | 'sell' | 'close';
export type RiskType = 'stop_loss' | 'take_profit' | 'max_per_trade';

export interface BlockConfig {
  id: string;
  type: BlockType;
  subType: TriggerType | IndicatorType | OperatorType | ActionType | RiskType;
  label: string;
  params: Record<string, any>;
  position?: { x: number; y: number };
}

export interface StrategyBlock {
  id: string;
  type: BlockType;
  subType: string;
  label: string;
  params: Record<string, any>;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  description: string;
  blocks: StrategyBlock[];
  connections: Array<{ source: string; target: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export const BLOCK_TEMPLATES = {
  trigger: [
    { id: 'price_above', label: 'Preço acima de X', icon: '📈' },
    { id: 'price_below', label: 'Preço abaixo de X', icon: '📉' },
    { id: 'ma_cross', label: 'Cruzamento de média', icon: '🔀' },
  ],
  indicator: [
    { id: 'rsi', label: 'RSI', icon: '📊' },
    { id: 'ma', label: 'Média Móvel', icon: '📈' },
    { id: 'macd', label: 'MACD', icon: '📉' },
    { id: 'volume', label: 'Volume', icon: '📦' },
  ],
  operator: [
    { id: 'and', label: 'E (AND)', icon: '∧' },
    { id: 'or', label: 'OU (OR)', icon: '∨' },
  ],
  action: [
    { id: 'buy', label: 'Comprar', icon: '🟢' },
    { id: 'sell', label: 'Vender', icon: '🔴' },
    { id: 'close', label: 'Fechar Posição', icon: '⏹️' },
  ],
  risk: [
    { id: 'stop_loss', label: 'Stop Loss', icon: '🛑' },
    { id: 'take_profit', label: 'Take Profit', icon: '💰' },
    { id: 'max_per_trade', label: 'Máximo por Operação', icon: '⚖️' },
  ],
};

export const BLOCK_COLORS = {
  trigger: '#3b82f6',
  indicator: '#8b5cf6',
  operator: '#ec4899',
  action: '#10b981',
  risk: '#f59e0b',
};

export const BLOCK_DESCRIPTIONS = {
  price_above: 'Trigger quando preço sobe acima de um valor',
  price_below: 'Trigger quando preço cai abaixo de um valor',
  ma_cross: 'Trigger quando duas médias se cruzam',
  rsi: 'Indicador RSI para momentum',
  ma: 'Média Móvel Simples ou Exponencial',
  macd: 'Indicador MACD para tendência',
  volume: 'Análise de volume de negociação',
  and: 'Todas as condições devem ser verdadeiras',
  or: 'Pelo menos uma condição deve ser verdadeira',
  buy: 'Executar compra',
  sell: 'Executar venda',
  close: 'Fechar posição aberta',
  stop_loss: 'Limitar perda máxima',
  take_profit: 'Fixar lucro mínimo',
  max_per_trade: 'Limitar valor máximo por operação',
};
