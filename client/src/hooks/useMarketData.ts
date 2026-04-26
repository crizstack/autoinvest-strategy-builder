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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuote = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      if (isManualRefresh) setIsRefreshing(true);
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
      if (!isManualRefresh) setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote(false);

    // Auto-refresh
    const interval = setInterval(() => fetchQuote(false), autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchQuote, autoRefreshInterval]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchQuote(true);
  }, [symbol, fetchQuote]);

  return { quote, loading, error, refresh, isRefreshing };
};

/**
 * Hook para buscar múltiplas cotações
 */
export const useMultipleQuotes = (symbols: string[], autoRefreshInterval = 15000) => {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchQuotes = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      if (isManualRefresh) setIsRefreshing(true);
      setError(null);
      const data = await getMultipleQuotes(symbols);
      setQuotes(data);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      if (!isManualRefresh) setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [symbols]);

  useEffect(() => {
    if (symbols.length === 0) {
      setQuotes([]);
      return;
    }

    fetchQuotes(false);

    // Auto-refresh
    const interval = setInterval(() => fetchQuotes(false), autoRefreshInterval);
    return () => clearInterval(interval);
  }, [fetchQuotes, symbols, autoRefreshInterval]);

  const refresh = useCallback(() => {
    symbols.forEach((symbol) => clearSymbolCache(symbol));
    fetchQuotes(true);
  }, [symbols, fetchQuotes]);

  return { quotes, loading, error, refresh, isRefreshing };
};

/**
 * Hook para buscar histórico de preços
 */
export const useHistory = (symbol: string, range: '1d' | '5d' | '1mo' | '6mo' | '1y' = '1mo') => {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHistory = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      if (isManualRefresh) setIsRefreshing(true);
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
      if (!isManualRefresh) setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [symbol, range]);

  useEffect(() => {
    fetchHistory(false);
  }, [fetchHistory]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchHistory(true);
  }, [symbol, fetchHistory]);

  return { history, loading, error, refresh, isRefreshing };
};
