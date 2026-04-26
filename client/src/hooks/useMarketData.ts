import { useState, useEffect, useCallback } from 'react';
import { getQuote, getMultipleQuotes, getHistory, clearSymbolCache } from '@/services/marketDataService';

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

/**
 * Hook para buscar cotação de um ativo com auto-update
 */
export const useQuote = (symbol: string, autoRefreshInterval = 15000) => {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQuote(symbol);
      if (data) {
        setQuote(data);
      } else {
        setError('Dados temporariamente indisponíveis');
      }
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote();

    // Auto-refresh
    const interval = setInterval(fetchQuote, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchQuote, autoRefreshInterval]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchQuote();
  }, [symbol, fetchQuote]);

  return { quote, loading, error, refresh };
};

/**
 * Hook para buscar múltiplas cotações
 */
export const useMultipleQuotes = (symbols: string[], autoRefreshInterval = 15000) => {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMultipleQuotes(symbols);
      setQuotes(data);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (symbols.length === 0) {
      setQuotes([]);
      return;
    }

    fetchQuotes();

    // Auto-refresh
    const interval = setInterval(fetchQuotes, autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchQuotes, symbols, autoRefreshInterval]);

  const refresh = useCallback(() => {
    symbols.forEach((symbol) => clearSymbolCache(symbol));
    fetchQuotes();
  }, [symbols, fetchQuotes]);

  return { quotes, loading, error, refresh };
};

/**
 * Hook para buscar histórico de preços
 */
export const useHistory = (symbol: string, range: '1d' | '5d' | '1mo' | '6mo' | '1y' = '1mo') => {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHistory(symbol, range);
      if (data) {
        setHistory(data);
      } else {
        setError('Dados temporariamente indisponíveis');
      }
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchHistory();
  }, [symbol, fetchHistory]);

  return { history, loading, error, refresh };
};
