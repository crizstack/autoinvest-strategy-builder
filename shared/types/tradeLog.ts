/**
 * Tipos para logs detalhados de operações
 * Fornece explicações claras sobre cada trade
 */

export type IndicatorType =
  | 'RSI'
  | 'MACD'
  | 'Bollinger Bands'
  | 'Moving Average'
  | 'Stochastic'
  | 'ADX'
  | 'CCI'
  | 'ATR'
  | 'Volume'
  | 'Price Action'
  | 'Support/Resistance'
  | 'Fibonacci'
  | 'Multiple';

export type TradeSignal = 'BUY' | 'SELL' | 'CLOSE';

export type TradeReason = 'entry' | 'exit' | 'stop_loss' | 'take_profit' | 'manual';

export interface IndicatorSignal {
  name: IndicatorType;
  value: number;
  threshold?: number;
  condition: string; // Ex: "RSI < 30", "MACD > Signal Line"
  strength: 'weak' | 'medium' | 'strong'; // Força do sinal
}

export interface TradeContext {
  price: number;
  volume: number;
  bid: number;
  ask: number;
  spread: number;
  volatility: number;
  trend: 'uptrend' | 'downtrend' | 'sideways';
  marketCondition: 'trending' | 'ranging' | 'volatile';
}

export interface TradeExplanation {
  // Entrada
  entryReason: string; // Ex: "Compra executada porque RSI caiu abaixo de 30"
  entryIndicators: IndicatorSignal[]; // Indicadores que acionaram a entrada
  entryConfidence: number; // 0-100, força da entrada

  // Saída
  exitReason: string; // Ex: "Venda executada porque MACD cruzou abaixo da linha de sinal"
  exitIndicators: IndicatorSignal[]; // Indicadores que acionaram a saída
  exitType: 'profit_target' | 'stop_loss' | 'signal' | 'manual' | 'timeout';

  // Contexto
  marketContext: string; // Ex: "Mercado em uptrend, alta volatilidade"
  riskReward: number; // Razão risco/recompensa
  notes: string; // Notas adicionais
}

export interface TradeLog {
  id: string;
  strategyId: string;
  symbol: string;

  // Operação
  signal: TradeSignal;
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  result: number; // Lucro/Perda em R$
  resultPercent: number; // Lucro/Perda em %

  // Tempo
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // Duração em minutos

  // Explicações
  explanation: TradeExplanation;

  // Metadados
  status: 'open' | 'closed' | 'cancelled';
  tags: string[]; // Ex: ["high-volatility", "morning-trade"]
  confidence: number; // 0-100
}

export interface TradeLogFilter {
  strategyId?: string;
  symbol?: string;
  indicator?: IndicatorType;
  dateFrom?: Date;
  dateTo?: Date;
  minResult?: number;
  maxResult?: number;
  status?: 'open' | 'closed';
  tags?: string[];
}

export interface TradeLogStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: TradeLog;
  worstTrade: TradeLog;
  indicatorStats: {
    indicator: IndicatorType;
    totalSignals: number;
    winRate: number;
    avgResult: number;
  }[];
}
