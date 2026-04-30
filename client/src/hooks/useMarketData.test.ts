import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useQuote, useMultipleQuotes, useHistory } from './useMarketData';
import * as marketDataService from '@/services/marketDataService';

// Mock do serviço de dados de mercado
vi.mock('@/services/marketDataService', () => ({
  getQuote: vi.fn(),
  getMultipleQuotes: vi.fn(),
  getHistory: vi.fn(),
  clearSymbolCache: vi.fn(),
  clearCache: vi.fn(),
}));

describe('useMarketData hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useQuote', () => {
    it('deve buscar cotação de um ativo', async () => {
      const mockQuote = {
        symbol: 'PETR4',
        name: 'Petrobras',
        regularMarketPrice: 25.50,
        regularMarketDayHigh: 26.00,
        regularMarketDayLow: 25.00,
        regularMarketVolume: 1000000,
        regularMarketPreviousClose: 25.00,
        regularMarketChange: 0.50,
        regularMarketChangePercent: 2.0,
      };

      vi.mocked(marketDataService.getQuote).mockResolvedValueOnce(mockQuote);

      const { result } = renderHook(() => useQuote('PETR4'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quote).toEqual(mockQuote);
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com erro ao buscar cotação', async () => {
      vi.mocked(marketDataService.getQuote).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useQuote('INVALID'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quote).toBeNull();
      expect(result.current.error).toBe('Dados temporariamente indisponíveis');
    });

    it('deve permitir refresh manual', async () => {
      const mockQuote = {
        symbol: 'VALE3',
        name: 'Vale',
        regularMarketPrice: 50.00,
        regularMarketDayHigh: 51.00,
        regularMarketDayLow: 49.00,
        regularMarketVolume: 2000000,
        regularMarketPreviousClose: 49.50,
        regularMarketChange: 0.50,
        regularMarketChangePercent: 1.0,
      };

      vi.mocked(marketDataService.getQuote).mockResolvedValue(mockQuote);

      const { result } = renderHook(() => useQuote('VALE3'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.refresh();

      expect(result.current.isRefreshing).toBe(true);
      expect(marketDataService.clearSymbolCache).toHaveBeenCalledWith('VALE3');
    });
  });

  describe('useMultipleQuotes', () => {
    it('deve buscar múltiplas cotações', async () => {
      const mockQuotes = [
        {
          symbol: 'PETR4',
          name: 'Petrobras',
          regularMarketPrice: 25.50,
          regularMarketDayHigh: 26.00,
          regularMarketDayLow: 25.00,
          regularMarketVolume: 1000000,
          regularMarketPreviousClose: 25.00,
          regularMarketChange: 0.50,
          regularMarketChangePercent: 2.0,
        },
        {
          symbol: 'VALE3',
          name: 'Vale',
          regularMarketPrice: 50.00,
          regularMarketDayHigh: 51.00,
          regularMarketDayLow: 49.00,
          regularMarketVolume: 2000000,
          regularMarketPreviousClose: 49.50,
          regularMarketChange: 0.50,
          regularMarketChangePercent: 1.0,
        },
      ];

      vi.mocked(marketDataService.getMultipleQuotes).mockResolvedValueOnce(mockQuotes);

      const { result } = renderHook(() => useMultipleQuotes(['PETR4', 'VALE3']));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quotes).toEqual(mockQuotes);
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com lista vazia de símbolos', async () => {
      const { result } = renderHook(() => useMultipleQuotes([]));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.quotes).toEqual([]);
    });

    it('deve evitar loops infinitos com useMemo', async () => {
      const mockQuotes = [
        {
          symbol: 'PETR4',
          name: 'Petrobras',
          regularMarketPrice: 25.50,
          regularMarketDayHigh: 26.00,
          regularMarketDayLow: 25.00,
          regularMarketVolume: 1000000,
          regularMarketPreviousClose: 25.00,
          regularMarketChange: 0.50,
          regularMarketChangePercent: 2.0,
        },
      ];

      vi.mocked(marketDataService.getMultipleQuotes).mockResolvedValue(mockQuotes);

      const symbols = ['PETR4'];
      const { result, rerender } = renderHook(
        ({ syms }) => useMultipleQuotes(syms),
        { initialProps: { syms: symbols } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const callCountBefore = vi.mocked(marketDataService.getMultipleQuotes).mock.calls.length;

      // Re-render com os mesmos símbolos
      rerender({ syms: symbols });

      // Não deve fazer nova chamada se os símbolos são os mesmos
      await waitFor(() => {
        const callCountAfter = vi.mocked(marketDataService.getMultipleQuotes).mock.calls.length;
        expect(callCountAfter).toBe(callCountBefore);
      });
    });
  });

  describe('useHistory', () => {
    it('deve buscar histórico de preços', async () => {
      const mockHistory = {
        symbol: 'PETR4',
        prices: [
          {
            date: '2026-04-28',
            open: 25.00,
            high: 26.00,
            low: 24.50,
            close: 25.50,
            volume: 1000000,
          },
          {
            date: '2026-04-29',
            open: 25.50,
            high: 26.50,
            low: 25.00,
            close: 26.00,
            volume: 1200000,
          },
        ],
      };

      vi.mocked(marketDataService.getHistory).mockResolvedValueOnce(mockHistory);

      const { result } = renderHook(() => useHistory('PETR4', '1mo'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toEqual(mockHistory);
      expect(result.current.error).toBeNull();
    });

    it('deve lidar com erro ao buscar histórico', async () => {
      vi.mocked(marketDataService.getHistory).mockResolvedValueOnce(null);

      const { result } = renderHook(() => useHistory('INVALID', '1mo'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.history).toBeNull();
      expect(result.current.error).toBe('Dados temporariamente indisponíveis');
    });
  });
});
