/**
 * BRAPI Service
 * Integração com BRAPI para dados reais de mercado B3
 * Com cache inteligente, rate limit e fallback
 */

import type { InsertAsset, InsertAssetPrice } from '../../drizzle/schema';

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

interface HistoricalCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Cache local
const cache = new Map<string, CacheEntry<any>>();
let lastRequestTime = 0;
let rateLimitedUntil = 0;

/**
 * Aguardar rate limit
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();

  // Se estamos em rate limit, aguardar
  if (now < rateLimitedUntil) {
    const delay = rateLimitedUntil - now;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return;
  }

  // Respeitar delay mínimo entre requisições
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  lastRequestTime = Date.now();
}

/**
 * Verificar se cache é válido
 */
function isCacheValid(key: string): boolean {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Obter do cache
 */
function getFromCache<T>(key: string): T | null {
  if (isCacheValid(key)) {
    return cache.get(key)?.data as T;
  }
  cache.delete(key);
  return null;
}

/**
 * Salvar no cache
 */
function setCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Fazer requisição com retry
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      await waitForRateLimit();
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'AutoInvest/1.0',
        },
      });

      // Rate limit detectado
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
        rateLimitedUntil = Date.now() + delay;
        console.warn(`Rate limited. Aguardando ${delay}ms`);

        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }

      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  throw new Error('Max retries exceeded');
}

/**
 * Buscar cotação de um ativo
 */
export async function fetchQuote(symbol: string): Promise<BrapiQuote | null> {
  try {
    const cacheKey = `quote_${symbol}`;
    const cached = getFromCache<BrapiQuote>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.VITE_BRAPI_API_KEY || '';
    const token = apiKey ? `&token=${apiKey}` : '';
    const url = `${BRAPI_BASE_URL}/${symbol}?range=1d&interval=1d${token}`;

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.error(`Erro ao buscar ${symbol}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`Nenhum resultado para ${symbol}`);
      return null;
    }

    const quote = data.results[0];
    setCache(cacheKey, quote);
    return quote;
  } catch (error) {
    console.error(`Erro ao buscar cotação de ${symbol}:`, error);
    return null;
  }
}

/**
 * Buscar múltiplas cotações
 */
export async function fetchMultipleQuotes(symbols: string[]): Promise<BrapiQuote[]> {
  const quotes: BrapiQuote[] = [];

  for (const symbol of symbols) {
    const quote = await fetchQuote(symbol);
    if (quote) {
      quotes.push(quote);
    }
  }

  return quotes;
}

/**
 * Buscar histórico de candles
 */
export async function fetchHistoricalCandles(
  symbol: string,
  range: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' = '1y'
): Promise<HistoricalCandle[]> {
  try {
    const cacheKey = `history_${symbol}_${range}`;
    const cached = getFromCache<HistoricalCandle[]>(cacheKey);
    if (cached) return cached;

    const apiKey = process.env.VITE_BRAPI_API_KEY || '';
    const token = apiKey ? `&token=${apiKey}` : '';
    const url = `${BRAPI_BASE_URL}/${symbol}?range=${range}&interval=1d${token}`;

    const response = await fetchWithRetry(url);

    if (!response.ok) {
      console.error(`Erro ao buscar histórico de ${symbol}:`, response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.warn(`Nenhum histórico para ${symbol}`);
      return [];
    }

    const quote = data.results[0];
    const historicalDataPrice = quote.historicalDataPrice || [];

    const candles: HistoricalCandle[] = historicalDataPrice.map((price: any) => ({
      timestamp: new Date(price.date * 1000),
      open: price.open,
      high: price.high,
      low: price.low,
      close: price.close,
      volume: price.volume || 0,
    }));

    setCache(cacheKey, candles);
    return candles;
  } catch (error) {
    console.error(`Erro ao buscar histórico de ${symbol}:`, error);
    return [];
  }
}

/**
 * Limpar cache
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Limpar cache de um símbolo
 */
export function clearSymbolCache(symbol: string): void {
  cache.delete(`quote_${symbol}`);
  cache.delete(`history_${symbol}_1d`);
  cache.delete(`history_${symbol}_5d`);
  cache.delete(`history_${symbol}_1mo`);
  cache.delete(`history_${symbol}_3mo`);
  cache.delete(`history_${symbol}_6mo`);
  cache.delete(`history_${symbol}_1y`);
}

/**
 * Converter BrapiQuote para Asset
 */
export function brapiQuoteToAsset(quote: BrapiQuote): InsertAsset {
  return {
    symbol: quote.symbol,
    name: quote.longName || quote.symbol,
    sector: undefined,
    lastUpdated: new Date(),
  };
}

/**
 * Converter candle para AssetPrice
 */
export function candleToAssetPrice(assetId: number, candle: HistoricalCandle): InsertAssetPrice {
  return {
    time: candle.timestamp,
    assetId,
    open: candle.open.toString(),
    high: candle.high.toString(),
    low: candle.low.toString(),
    close: candle.close.toString(),
    volume: BigInt(Math.floor(candle.volume)),
  };
}

/**
 * Obter status da API
 */
export function getApiStatus(): {
  isRateLimited: boolean;
  rateLimitedUntil: number | null;
  cacheSize: number;
} {
  return {
    isRateLimited: Date.now() < rateLimitedUntil,
    rateLimitedUntil: rateLimitedUntil > Date.now() ? rateLimitedUntil : null,
    cacheSize: cache.size,
  };
}
