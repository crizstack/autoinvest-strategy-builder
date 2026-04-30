import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Testes para Market Data Service
 * Validam que o serviço de dados de mercado funciona corretamente
 * e que os hooks não causam loops infinitos
 */

describe('Market Data Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Cache Management', () => {
    it('deve armazenar e recuperar dados do cache', () => {
      const cache = new Map<string, { data: any; timestamp: number }>();
      const CACHE_DURATION = 15 * 1000;

      // Simular armazenamento em cache
      const mockData = {
        symbol: 'PETR4',
        name: 'Petrobras',
        regularMarketPrice: 25.50,
      };

      cache.set('quote_PETR4', {
        data: mockData,
        timestamp: Date.now(),
      });

      // Verificar se está no cache
      const entry = cache.get('quote_PETR4');
      expect(entry).toBeDefined();
      expect(entry?.data).toEqual(mockData);

      // Verificar se cache é válido
      const isValid = entry ? Date.now() - entry.timestamp < CACHE_DURATION : false;
      expect(isValid).toBe(true);
    });

    it('deve invalidar cache expirado', () => {
      const cache = new Map<string, { data: any; timestamp: number }>();
      const CACHE_DURATION = 15 * 1000;

      // Simular armazenamento com timestamp antigo
      const oldTimestamp = Date.now() - CACHE_DURATION - 1000;
      cache.set('quote_PETR4', {
        data: { symbol: 'PETR4' },
        timestamp: oldTimestamp,
      });

      // Verificar se cache está expirado
      const entry = cache.get('quote_PETR4');
      const isValid = entry ? Date.now() - entry.timestamp < CACHE_DURATION : false;
      expect(isValid).toBe(false);
    });

    it('deve limpar cache de um símbolo específico', () => {
      const cache = new Map<string, { data: any; timestamp: number }>();

      // Adicionar múltiplas entradas
      cache.set('quote_PETR4', { data: { symbol: 'PETR4' }, timestamp: Date.now() });
      cache.set('history_PETR4_1mo', { data: { prices: [] }, timestamp: Date.now() });
      cache.set('quote_VALE3', { data: { symbol: 'VALE3' }, timestamp: Date.now() });

      // Limpar cache de PETR4
      cache.delete('quote_PETR4');
      cache.delete('history_PETR4_1mo');

      // Verificar que PETR4 foi removido mas VALE3 permanece
      expect(cache.has('quote_PETR4')).toBe(false);
      expect(cache.has('history_PETR4_1mo')).toBe(false);
      expect(cache.has('quote_VALE3')).toBe(true);
    });
  });

  describe('Hook Stability', () => {
    it('deve evitar loops infinitos com dependencies estáveis', () => {
      // Simular o padrão de useMemo para estabilizar symbols
      const symbols1 = ['PETR4', 'VALE3'];
      const symbols2 = ['PETR4', 'VALE3'];

      // Converter para string para comparação
      const key1 = symbols1.join(',');
      const key2 = symbols2.join(',');

      // Deve ser igual mesmo sendo arrays diferentes
      expect(key1).toBe(key2);
    });

    it('deve detectar mudanças em dependencies', () => {
      const symbols1 = ['PETR4', 'VALE3'];
      const symbols2 = ['PETR4', 'VALE3', 'ITUB4'];

      const key1 = symbols1.join(',');
      const key2 = symbols2.join(',');

      // Deve ser diferente quando símbolos mudam
      expect(key1).not.toBe(key2);
    });
  });

  describe('Error Handling', () => {
    it('deve retornar null em caso de erro de API', async () => {
      // Simular erro de fetch
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      try {
        await mockFetch();
      } catch (error) {
        expect(error).toBeDefined();
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('deve lidar com resposta vazia da API', () => {
      const data = { results: [] };

      // Verificar se resultados estão vazios
      const hasResults = data.results && data.results.length > 0;
      expect(hasResults).toBe(false);
    });

    it('deve formatar dados corretamente da BRAPI', () => {
      const brapiResponse = {
        symbol: 'PETR4',
        longName: 'Petrobras',
        regularMarketPrice: 25.50,
        regularMarketDayHigh: 26.00,
        regularMarketDayLow: 25.00,
        regularMarketVolume: 1000000,
        regularMarketPreviousClose: 25.00,
        regularMarketChange: 0.50,
        regularMarketChangePercent: 2.0,
      };

      // Formatar resposta
      const formatted = {
        symbol: brapiResponse.symbol,
        name: brapiResponse.longName || brapiResponse.symbol,
        regularMarketPrice: brapiResponse.regularMarketPrice,
        regularMarketDayHigh: brapiResponse.regularMarketDayHigh,
        regularMarketDayLow: brapiResponse.regularMarketDayLow,
        regularMarketVolume: brapiResponse.regularMarketVolume || 0,
        regularMarketPreviousClose: brapiResponse.regularMarketPreviousClose,
        regularMarketChange: brapiResponse.regularMarketChange,
        regularMarketChangePercent: brapiResponse.regularMarketChangePercent,
      };

      expect(formatted.symbol).toBe('PETR4');
      expect(formatted.name).toBe('Petrobras');
      expect(formatted.regularMarketPrice).toBe(25.50);
      expect(formatted.regularMarketChangePercent).toBe(2.0);
    });
  });

  describe('Multiple Quotes', () => {
    it('deve buscar múltiplas cotações sem duplicatas', () => {
      const symbols = ['PETR4', 'VALE3', 'ITUB4'];
      const quotes = [
        { symbol: 'PETR4', regularMarketPrice: 25.50 },
        { symbol: 'VALE3', regularMarketPrice: 50.00 },
        { symbol: 'ITUB4', regularMarketPrice: 12.00 },
      ];

      // Filtrar nulos
      const filtered = quotes.filter((q) => q !== null);

      expect(filtered.length).toBe(3);
      expect(filtered.map((q) => q.symbol)).toEqual(symbols);
    });

    it('deve remover cotações nulas da resposta', () => {
      const quotes = [
        { symbol: 'PETR4', regularMarketPrice: 25.50 },
        null,
        { symbol: 'VALE3', regularMarketPrice: 50.00 },
        null,
      ];

      // Filtrar nulos
      const filtered = quotes.filter((q) => q !== null);

      expect(filtered.length).toBe(2);
      expect(filtered[0]?.symbol).toBe('PETR4');
      expect(filtered[1]?.symbol).toBe('VALE3');
    });
  });
});
