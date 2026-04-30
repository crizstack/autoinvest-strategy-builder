/**
 * Market Data Service
 * Integração com BRAPI para dados reais de mercado B3
 * Com cache local para otimizar performance
 */

const BRAPI_BASE_URL = 'https://brapi.dev/api/quote';
const CACHE_DURATION = 15 * 1000; // 15 segundos

// Obter API key da variável de ambiente
const BRAPI_API_KEY = import.meta.env.VITE_BRAPI_API_KEY || '';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface QuoteResponse {
  symbol: string;
  name: string;
  regularMarketPrice: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
  regularMarketPreviousClose: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  marketCap?: number;
  sector?: string;
  longName?: string;
}

interface HistoryResponse {
  symbol: string;
  prices: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

// Cache local
const cache = new Map<string, CacheEntry<any>>();

// Função auxiliar para verificar se cache está válido
const isCacheValid = (key: string): boolean => {
  const entry = cache.get(key);
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
};

// Função auxiliar para buscar do cache
const getFromCache = <T>(key: string): T | null => {
  if (isCacheValid(key)) {
    return cache.get(key)?.data as T;
  }
  cache.delete(key);
  return null;
};

// Função auxiliar para salvar no cache
const setCache = <T>(key: string, data: T): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

/**
 * Buscar cotação de um único ativo
 */
export const getQuote = async (symbol: string): Promise<QuoteResponse | null> => {
  try {
    const cacheKey = `quote_${symbol}`;
    const cached = getFromCache<QuoteResponse>(cacheKey);
    if (cached) return cached;

    // Usar API key da variável de ambiente se disponível
    const token = BRAPI_API_KEY ? `&token=${BRAPI_API_KEY}` : '';
    const response = await fetch(
      `${BRAPI_BASE_URL}/${symbol}?range=1d&interval=1d${token}`
    );

    if (!response.ok) {
      console.error(`Erro ao buscar cotação de ${symbol}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    // BRAPI retorna array de resultados
    if (!data.results || data.results.length === 0) {
      console.error(`Nenhum resultado para ${symbol}`);
      return null;
    }

    const quote = data.results[0];
    const formatted: QuoteResponse = {
      symbol: quote.symbol,
      name: quote.longName || quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketDayHigh: quote.regularMarketDayHigh,
      regularMarketDayLow: quote.regularMarketDayLow,
      regularMarketVolume: quote.regularMarketVolume || 0,
      regularMarketPreviousClose: quote.regularMarketPreviousClose,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      marketCap: quote.marketCap,
      sector: quote.sector,
      longName: quote.longName,
    };

    setCache(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    return null;
  }
};

/**
 * Buscar cotações de múltiplos ativos
 */
export const getMultipleQuotes = async (symbols: string[]): Promise<QuoteResponse[]> => {
  try {
    const quotes = await Promise.all(symbols.map((symbol) => getQuote(symbol)));
    return quotes.filter((q) => q !== null) as QuoteResponse[];
  } catch (error) {
    console.error('Erro ao buscar múltiplas cotações:', error);
    return [];
  }
};

/**
 * Buscar histórico de preços
 */
export const getHistory = async (
  symbol: string,
  range: '1d' | '5d' | '1mo' | '6mo' | '1y' = '1mo'
): Promise<HistoryResponse | null> => {
  try {
    const cacheKey = `history_${symbol}_${range}`;
    const cached = getFromCache<HistoryResponse>(cacheKey);
    if (cached) return cached;

    // Usar API key da variável de ambiente se disponível
    const token = BRAPI_API_KEY ? `&token=${BRAPI_API_KEY}` : '';
    const response = await fetch(
      `${BRAPI_BASE_URL}/${symbol}?range=${range}&interval=1d${token}`
    );

    if (!response.ok) {
      console.error(`Erro ao buscar histórico de ${symbol}:`, response.statusText);
      return null;
    }

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      console.error(`Nenhum resultado para ${symbol}`);
      return null;
    }

    const quote = data.results[0];
    const historicalDataPrice = quote.historicalDataPrice || [];

    const history: HistoryResponse = {
      symbol: quote.symbol,
      prices: historicalDataPrice.map((price: any) => ({
        date: new Date(price.date * 1000).toISOString().split('T')[0],
        open: price.open,
        high: price.high,
        low: price.low,
        close: price.close,
        volume: price.volume || 0,
      })),
    };

    setCache(cacheKey, history);
    return history;
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return null;
  }
};

/**
 * Limpar cache
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Limpar cache de um símbolo específico
 */
export const clearSymbolCache = (symbol: string): void => {
  cache.delete(`quote_${symbol}`);
  cache.delete(`history_${symbol}_1d`);
  cache.delete(`history_${symbol}_5d`);
  cache.delete(`history_${symbol}_1mo`);
  cache.delete(`history_${symbol}_6mo`);
  cache.delete(`history_${symbol}_1y`);
};
