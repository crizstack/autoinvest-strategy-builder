/**
 * Tipos para o Assistente IA
 */

export type PageContext = 
  | 'dashboard'
  | 'builder'
  | 'market'
  | 'backtest'
  | 'trades'
  | 'billing'
  | 'strategies'
  | 'settings'
  | 'unknown';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface Suggestion {
  id: string;
  text: string;
  icon?: string;
  category?: 'platform' | 'finance' | 'builder' | 'strategy';
}

export interface AIContextData {
  page: PageContext;
  userRole?: 'admin' | 'user';
  currentPlan?: 'free' | 'pro' | 'premium';
  strategyName?: string;
  selectedAsset?: string;
  builderState?: {
    nodeCount: number;
    edgeCount: number;
    hasAsset: boolean;
    hasTrigger: boolean;
    hasAction: boolean;
  };
}

export interface AIResponse {
  message: string;
  suggestions?: Suggestion[];
  metadata?: {
    category?: string;
    confidence?: number;
  };
}

export const FINANCIAL_TERMS = {
  rsi: {
    name: 'RSI (Relative Strength Index)',
    description: 'Indicador de momentum que mede a magnitude de mudanças de preço',
    range: '0-100',
    interpretation: 'Acima de 70: sobrecomprado | Abaixo de 30: sobrevendido',
  },
  macd: {
    name: 'MACD (Moving Average Convergence Divergence)',
    description: 'Indicador de tendência que mostra a relação entre duas médias móveis',
    signals: 'Cruzamento de linhas indica mudança de tendência',
  },
  ma: {
    name: 'Média Móvel (MA)',
    description: 'Suaviza dados de preço para identificar tendências',
    types: 'SMA (simples) ou EMA (exponencial)',
  },
  stoploss: {
    name: 'Stop Loss',
    description: 'Ordem que fecha posição automaticamente ao atingir prejuízo máximo',
    purpose: 'Proteger contra perdas grandes',
  },
  takeprofit: {
    name: 'Take Profit',
    description: 'Ordem que fecha posição automaticamente ao atingir lucro desejado',
    purpose: 'Garantir ganhos',
  },
  candlestick: {
    name: 'Candlestick',
    description: 'Gráfico que mostra abertura, fechamento, máxima e mínima de um período',
    components: 'Corpo (abertura-fechamento) e pavios (máxima-mínima)',
  },
  riskmanagement: {
    name: 'Gestão de Risco',
    description: 'Práticas para limitar perdas e proteger capital',
    principles: 'Diversificação, stop loss, posição sizing, limite de risco',
  },
};

export const PLATFORM_HELP = {
  builder: {
    title: 'Como usar o Strategy Builder',
    steps: [
      '1. Selecione um ativo (PETR4, VALE3, etc)',
      '2. Arraste um Trigger para iniciar',
      '3. Adicione Indicadores para refinar',
      '4. Termine com uma Ação (Compra/Venda)',
      '5. Adicione Proteções (Stop Loss, Take Profit)',
      '6. Valide e salve sua estratégia',
    ],
  },
  backtest: {
    title: 'Como funciona o Backtest',
    description: 'Testa sua estratégia com dados históricos',
    metrics: 'Lucro/Prejuízo, Taxa de Acerto, Drawdown, Sharpe Ratio',
  },
  papertrading: {
    title: 'Como funciona o Paper Trading',
    description: 'Simula operações em tempo real sem usar dinheiro real',
    benefits: 'Teste estratégias, aprenda, ganhe experiência',
  },
  market: {
    title: 'Módulo de Mercado',
    features: 'Veja preços em tempo real, gráficos, indicadores, top gainers/losers',
  },
};

export const STRATEGY_SUGGESTIONS = [
  {
    name: 'Estratégia RSI',
    description: 'Compra quando RSI < 30 (sobrevendido), vende quando RSI > 70',
    blocks: ['Trigger: Preço acima', 'Indicador: RSI', 'Ação: Comprar', 'Proteção: Stop Loss'],
    riskLevel: 'Moderado',
  },
  {
    name: 'Cruzamento de Médias',
    description: 'Compra quando MA rápida cruza acima da MA lenta',
    blocks: ['Trigger: MA Cross', 'Indicador: Média Móvel', 'Ação: Comprar'],
    riskLevel: 'Moderado',
  },
  {
    name: 'Estratégia Conservadora',
    description: 'Operações com stop loss apertado e take profit pequeno',
    blocks: ['Trigger: Preço', 'Indicador: RSI', 'Ação: Comprar', 'Stop Loss: 1%', 'Take Profit: 2%'],
    riskLevel: 'Baixo',
  },
  {
    name: 'Estratégia Agressiva',
    description: 'Operações com maior potencial de lucro e risco',
    blocks: ['Trigger: MACD', 'Indicador: Volume', 'Ação: Comprar', 'Stop Loss: 5%', 'Take Profit: 10%'],
    riskLevel: 'Alto',
  },
];
