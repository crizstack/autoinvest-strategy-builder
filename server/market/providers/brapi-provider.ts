/**
 * BRAPI Provider
 * Implementação de IMarketDataProvider para BRAPI
 */

import type {
  IMarketDataProvider,
  Candle,
  Quote,
  Timeframe,
  ProviderHealthStatus,
} from '../types';

const BRAPI_BASE_URL = 'https://brapi.dev/api/quote';
const RATE_LIMIT_DELAY = 100; // ms entre requisições
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const MAX_RETRIES = 3;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface BrapiQuote {
  symbol: string;
  longName: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  historicalDataPrice?: Array<{
    date: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export class BrapiProvider implements IMarketDataProvider {
  name = 'brapi';
  private cache = new Map<string, CacheEntry<any>>();
  private lastRequestTime = 0;
  private rateLimitedUntil = 0;
  private requestCount = 0;
  private errorCount = 0;
  private lastError: string | undefined;

  /**
   * Aguardar rate limit
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();

    // Se estamos em rate limit, aguardar
    if (now < this.rateLimitedUntil) {
      const delay = this.rateLimitedUntil - now;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return;
    }

    // Respeitar delay mínimo entre requisições
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * Verificar se cache é válido
   */
  private isCacheValid(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_DURATION;
  }

  /**
   * Obter do cache
   */
  private getFromCache<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      return this.cache.get(key)?.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Salvar no cache
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Fazer requisição com retry
   */
  private async fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.waitForRateLimit();
        this.requestCount++;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'AutoInvest/1.0',
          },
        });

        // Rate limit detectado
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          this.rateLimitedUntil = Date.now() + delay;
          console.warn(`[BRAPI] Rate limited. Aguardando ${delay}ms`);

          if (i < retries - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }
        }

        return response;
      } catch (error) {
        this.errorCount++;
        this.lastError = String(error);

        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Obter cotação atual
   */
  async getQuote(symbol: string): Promise<Quote | null> {
    try {
      const cacheKey = `quote_${symbol}`;
      const cached = this.getFromCache<BrapiQuote>(cacheKey);
      if (cached) {
        return this.brapiQuoteToQuote(cached);
      }

      const apiKey = process.env.VITE_BRAPI_API_KEY || '';
      const token = apiKey ? `&token=${apiKey}` : '';
      const url = `${BRAPI_BASE_URL}/${symbol}?range=1d&interval=1d${token}`;

      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        this.errorCount++;
        this.lastError = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[BRAPI] Erro ao buscar ${symbol}:`, response.statusText);
        return null;
      }

      const data = await response.json();
      const quote = data.results?.[0];

      if (!quote) {
        this.errorCount++;
        this.lastError = `Quote não encontrada para ${symbol}`;
        return null;
      }

      this.setCache(cacheKey, quote);
      return this.brapiQuoteToQuote(quote);
    } catch (error) {
      this.errorCount++;
      this.lastError = String(error);
      console.error(`[BRAPI] Erro ao buscar quote de ${symbol}:`, error);
      return null;
    }
  }

  /**
   * Obter candles históricos
   */
  async getCandles(
    symbol: string,
    timeframe: Timeframe,
    startDate: Date,
    endDate: Date
  ): Promise<Candle[]> {
    try {
      // BRAPI apenas suporta 1D
      if (timeframe !== '1D') {
        console.warn(`[BRAPI] Timeframe ${timeframe} não suportado. Usando 1D`);
      }

      const cacheKey = `candles_${symbol}_1D_${startDate.getTime()}_${endDate.getTime()}`;
      const cached = this.getFromCache<Candle[]>(cacheKey);
      if (cached) {
        return cached;
      }

      // Determinar range baseado na diferença de datas
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '1y';
      if (daysDiff <= 1) range = '1d';
      else if (daysDiff <= 5) range = '5d';
      else if (daysDiff <= 30) range = '1mo';
      else if (daysDiff <= 90) range = '3mo';
      else if (daysDiff <= 180) range = '6mo';

      const apiKey = process.env.VITE_BRAPI_API_KEY || '';
      const token = apiKey ? `&token=${apiKey}` : '';
      const url = `${BRAPI_BASE_URL}/${symbol}?range=${range}&interval=1d${token}`;

      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        this.errorCount++;
        this.lastError = `HTTP ${response.status}`;
        return [];
      }

      const data = await response.json();
      const quote = data.results?.[0];

      if (!quote?.historicalDataPrice) {
        return [];
      }

      const candles: Candle[] = quote.historicalDataPrice
        .filter((candle: any) => {
          const date = new Date(candle.date * 1000);
          return date >= startDate && date <= endDate;
        })
        .map((candle: any) => ({
          timestamp: new Date(candle.date * 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          timeframe: '1D' as Timeframe,
        }));

      this.setCache(cacheKey, candles);
      return candles;
    } catch (error) {
      this.errorCount++;
      this.lastError = String(error);
      console.error(`[BRAPI] Erro ao buscar candles de ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Obter candles recentes
   */
  async getRecentCandles(
    symbol: string,
    timeframe: Timeframe,
    limit: number
  ): Promise<Candle[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.max(limit, 365));

      const candles = await this.getCandles(symbol, timeframe, startDate, endDate);
      return candles.slice(-limit);
    } catch (error) {
      this.errorCount++;
      this.lastError = String(error);
      console.error(`[BRAPI] Erro ao buscar candles recentes de ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Verificar saúde do provider
   */
  async healthCheck(): Promise<ProviderHealthStatus> {
    try {
      const startTime = Date.now();

      // Tentar buscar uma cotação
      const quote = await this.getQuote('PETR4');

      const responseTime = Date.now() - startTime;
      const status = quote ? 'healthy' : 'degraded';

      return {
        provider: this.name,
        status,
        lastCheck: new Date(),
        responseTime,
        errorCount: this.errorCount,
        lastError: this.lastError,
      };
    } catch (error) {
      this.errorCount++;
      this.lastError = String(error);

      return {
        provider: this.name,
        status: 'down',
        lastCheck: new Date(),
        errorCount: this.errorCount,
        lastError: this.lastError,
      };
    }
  }

  /**
   * Limpar cache
   */
  clearCache(symbol?: string): void {
    if (symbol) {
      // Limpar cache de um símbolo específico
      for (const key of this.cache.keys()) {
        if (key.includes(symbol)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpar todo o cache
      this.cache.clear();
    }
  }

  /**
   * Converter BrapiQuote para Quote
   */
  private brapiQuoteToQuote(quote: BrapiQuote): Quote {
    return {
      symbol: quote.symbol,
      name: quote.longName || quote.symbol,
      price: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      high: quote.regularMarketDayHigh,
      low: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      timestamp: new Date(),
    };
  }

  /**
   * Obter estatísticas
   */
  getStats() {
    return {
      name: this.name,
      requestCount: this.requestCount,
      errorCount: this.errorCount,
      cacheSize: this.cache.size,
      lastError: this.lastError,
    };
  }
}
