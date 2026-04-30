import { useState, useEffect, useCallback, useMemo } from 'react';
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
  }, [symbol, fetchQuote]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchQuote(true);
  }, [symbol, fetchQuote]);

  return { quote, loading, error, refresh, isRefreshing };
};

/**
 * Hook para buscar múltiplas cotações
 * IMPORTANTE: Estabilizar symbols com useMemo para evitar re-renders infinitos
 */
export const useMultipleQuotes = (symbols: string[], autoRefreshInterval = 15000) => {
  const [quotes, setQuotes] = useState<QuoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Estabilizar symbols com useMemo para evitar re-renders infinitos
  const stableSymbols = useMemo(() => symbols, [symbols.join(',')]);

  const fetchQuotes = useCallback(async (isManualRefresh = false) => {
    try {
      if (!isManualRefresh) setLoading(true);
      if (isManualRefresh) setIsRefreshing(true);
      setError(null);
      const data = await getMultipleQuotes(stableSymbols);
      setQuotes(data);
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      if (!isManualRefresh) setLoading(false);
      if (isManualRefresh) setIsRefreshing(false);
    }
  }, [stableSymbols]);

  useEffect(() => {
    if (stableSymbols.length === 0) {
      setQuotes([]);
      return;
    }

    fetchQuotes(false);
  }, [stableSymbols, fetchQuotes]);

  const refresh = useCallback(() => {
    stableSymbols.forEach((symbol) => clearSymbolCache(symbol));
    fetchQuotes(true);
  }, [stableSymbols, fetchQuotes]);

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
  }, [symbol, range, fetchHistory]);

  const refresh = useCallback(() => {
    clearSymbolCache(symbol);
    fetchHistory(true);
  }, [symbol, fetchHistory]);

  return { history, loading, error, refresh, isRefreshing };
};
