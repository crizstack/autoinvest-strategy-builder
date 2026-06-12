/**
 * Market Data Types
 * Tipos e interfaces para sistema de dados de mercado
 */

/**
 * Timeframes suportados
 */
export type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1D';

/**
 * Status de um provider
 */
export type ProviderStatus = 'healthy' | 'degraded' | 'down';

/**
 * Candle (vela OHLCV)
 */
export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeframe: Timeframe;
}

/**
 * Cotação atual
 */
export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  volume: number;
  timestamp: Date;
}

/**
 * Resultado de validação de candle
 */
export interface CandleValidation {
  isValid: boolean;
  hasGap: boolean;
  isOutlier: boolean;
  errors: string[];
}

/**
 * Status de um provider de dados
 */
export interface ProviderHealthStatus {
  provider: string;
  status: ProviderStatus;
  lastCheck: Date;
  responseTime?: number; // ms
  errorCount: number;
  lastError?: string;
}

/**
 * Resultado de sincronização
 */
export interface SyncResult {
  success: boolean;
  provider: string;
  symbol: string;
  timeframe: Timeframe;
  candlesAdded: number;
  candlesUpdated: number;
  errors: string[];
  duration: number; // ms
}

/**
 * Interface abstrata para providers de dados de mercado
 */
export interface IMarketDataProvider {
  /**
   * Nome do provider
   */
  name: string;

  /**
   * Obter cotação atual
   */
  getQuote(symbol: string): Promise<Quote | null>;

  /**
   * Obter candles históricos
   */
  getCandles(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<Candle[]>;

  /**
   * Obter candles recentes
   */
  getRecentCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number
  ): Promise<Candle[]>;

  /**
   * Verificar saúde do provider
   */
  healthCheck(): Promise<ProviderHealthStatus>;

  /**
   * Limpar cache
   */
  clearCache(symbol?: string): void;
}

/**
 * Configuração de um provider
 */
export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number; // 1 = highest
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay: number;
  };
  cache: {
    ttl: number; // ms
    maxSize: number; // bytes
  };
  timeframes: Timeframe[];
}

/**
 * Configuração do Market Data Manager
 */
export interface ManagerConfig {
  providers: ProviderConfig[];
  fallbackEnabled: boolean;
  cacheEnabled: boolean;
  validationEnabled: boolean;
  healthCheckInterval: number; // ms
}
