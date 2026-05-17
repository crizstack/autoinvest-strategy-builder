export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  winRate: number;
  blocks: any[];
  connections: any[];
  icon: string;
  tags: string[];
}

export const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'rsi-oversold',
    name: 'RSI Oversold',
    description: 'Compra quando RSI está abaixo de 30 (sobrevenda). Simples e eficaz para iniciantes.',
    difficulty: 'beginner',
    winRate: 62,
    icon: '📊',
    tags: ['RSI', 'Oversold', 'Momentum'],
    blocks: [
      {
        id: 'block-1',
        type: 'trigger',
        label: 'INÍCIO',
        data: {},
        position: { x: 50, y: 50 },
      },
      {
        id: 'block-2',
        type: 'indicator',
        label: 'RSI',
        data: {
          period: 14,
          condition: '<',
          value: 30,
        },
        position: { x: 250, y: 50 },
      },
      {
        id: 'block-3',
        type: 'action',
        label: 'COMPRAR',
        data: {
          type: 'buy',
          quantity: 1,
        },
        position: { x: 450, y: 50 },
      },
      {
        id: 'block-4',
        type: 'risk',
        label: 'Stop Loss',
        data: {
          type: 'stop_loss',
          percent: 2,
        },
        position: { x: 450, y: 150 },
      },
    ],
    connections: [
      { source: 'block-1', target: 'block-2' },
      { source: 'block-2', target: 'block-3' },
      { source: 'block-3', target: 'block-4' },
    ],
  },
  {
    id: 'moving-average-cross',
    name: 'Cruzamento de Médias',
    description: 'Estratégia clássica: compra quando MA rápida cruza acima da MA lenta.',
    difficulty: 'intermediate',
    winRate: 58,
    icon: '📈',
    tags: ['Moving Average', 'Crossover', 'Trend'],
    blocks: [
      {
        id: 'block-1',
        type: 'trigger',
        label: 'INÍCIO',
        data: {},
        position: { x: 50, y: 50 },
      },
      {
        id: 'block-2',
        type: 'indicator',
        label: 'MA Rápida',
        data: {
          type: 'moving_average',
          period: 9,
        },
        position: { x: 250, y: 50 },
      },
      {
        id: 'block-3',
        type: 'indicator',
        label: 'MA Lenta',
        data: {
          type: 'moving_average',
          period: 21,
        },
        position: { x: 250, y: 150 },
      },
      {
        id: 'block-4',
        type: 'condition',
        label: 'Cruzamento',
        data: {
          condition: 'ma_fast_above_ma_slow',
        },
        position: { x: 450, y: 100 },
      },
      {
        id: 'block-5',
        type: 'action',
        label: 'COMPRAR',
        data: {
          type: 'buy',
          quantity: 1,
        },
        position: { x: 650, y: 100 },
      },
    ],
    connections: [
      { source: 'block-1', target: 'block-2' },
      { source: 'block-1', target: 'block-3' },
      { source: 'block-2', target: 'block-4' },
      { source: 'block-3', target: 'block-4' },
      { source: 'block-4', target: 'block-5' },
    ],
  },
  {
    id: 'trend-following',
    name: 'Tendência',
    description: 'Segue a tendência usando preço acima de MA200. Ideal para trades de longo prazo.',
    difficulty: 'intermediate',
    winRate: 65,
    icon: '🎯',
    tags: ['Trend', 'Long Term', 'Moving Average'],
    blocks: [
      {
        id: 'block-1',
        type: 'trigger',
        label: 'INÍCIO',
        data: {},
        position: { x: 50, y: 50 },
      },
      {
        id: 'block-2',
        type: 'indicator',
        label: 'MA 200',
        data: {
          type: 'moving_average',
          period: 200,
        },
        position: { x: 250, y: 50 },
      },
      {
        id: 'block-3',
        type: 'condition',
        label: 'Preço > MA',
        data: {
          condition: 'price_above_ma',
          value: 200,
        },
        position: { x: 450, y: 50 },
      },
      {
        id: 'block-4',
        type: 'action',
        label: 'COMPRAR',
        data: {
          type: 'buy',
          quantity: 1,
        },
        position: { x: 650, y: 50 },
      },
      {
        id: 'block-5',
        type: 'risk',
        label: 'Take Profit',
        data: {
          type: 'take_profit',
          percent: 5,
        },
        position: { x: 650, y: 150 },
      },
    ],
    connections: [
      { source: 'block-1', target: 'block-2' },
      { source: 'block-2', target: 'block-3' },
      { source: 'block-3', target: 'block-4' },
      { source: 'block-4', target: 'block-5' },
    ],
  },
  {
    id: 'scalping-basic',
    name: 'Scalping Básico',
    description: 'Múltiplas operações rápidas com pequenos ganhos. Requer atenção constante.',
    difficulty: 'advanced',
    winRate: 72,
    icon: '⚡',
    tags: ['Scalping', 'High Frequency', 'Short Term'],
    blocks: [
      {
        id: 'block-1',
        type: 'trigger',
        label: 'INÍCIO',
        data: {},
        position: { x: 50, y: 50 },
      },
      {
        id: 'block-2',
        type: 'indicator',
        label: 'RSI 5min',
        data: {
          period: 5,
          condition: '<',
          value: 20,
        },
        position: { x: 250, y: 50 },
      },
      {
        id: 'block-3',
        type: 'action',
        label: 'COMPRAR',
        data: {
          type: 'buy',
          quantity: 2,
        },
        position: { x: 450, y: 50 },
      },
      {
        id: 'block-4',
        type: 'risk',
        label: 'Take Profit',
        data: {
          type: 'take_profit',
          percent: 0.5,
        },
        position: { x: 650, y: 50 },
      },
      {
        id: 'block-5',
        type: 'risk',
        label: 'Stop Loss',
        data: {
          type: 'stop_loss',
          percent: 0.3,
        },
        position: { x: 650, y: 120 },
      },
    ],
    connections: [
      { source: 'block-1', target: 'block-2' },
      { source: 'block-2', target: 'block-3' },
      { source: 'block-3', target: 'block-4' },
      { source: 'block-3', target: 'block-5' },
    ],
  },
];

export function getTemplateById(id: string): StrategyTemplate | undefined {
  return strategyTemplates.find((t) => t.id === id);
}

export function getAllTemplates(): StrategyTemplate[] {
  return strategyTemplates;
}
