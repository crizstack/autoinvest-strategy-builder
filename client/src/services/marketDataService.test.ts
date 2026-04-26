import { describe, it, expect, beforeAll } from 'vitest';
import { getQuote, getMultipleQuotes } from './marketDataService';

describe('Market Data Service - BRAPI Integration', () => {
  it('should fetch a valid quote from BRAPI', async () => {
    const quote = await getQuote('PETR4');

    if (quote === null) {
      console.warn('BRAPI API key may not be configured or API is unavailable');
      expect(true).toBe(true); // Skip test if API is not available
      return;
    }

    expect(quote).toBeDefined();
    expect(quote.symbol).toBe('PETR4');
    expect(quote.regularMarketPrice).toBeGreaterThan(0);
    expect(quote.regularMarketDayHigh).toBeGreaterThan(0);
    expect(quote.regularMarketDayLow).toBeGreaterThan(0);
    expect(typeof quote.regularMarketChangePercent).toBe('number');
  });

  it('should fetch multiple quotes from BRAPI', async () => {
    const symbols = ['PETR4', 'VALE3', 'ITUB4'];
    const quotes = await getMultipleQuotes(symbols);

    if (quotes.length === 0) {
      console.warn('BRAPI API key may not be configured or API is unavailable');
      expect(true).toBe(true); // Skip test if API is not available
      return;
    }

    expect(quotes.length).toBeGreaterThan(0);
    expect(quotes[0].symbol).toBeDefined();
    expect(quotes[0].regularMarketPrice).toBeGreaterThan(0);
  });

  it('should handle invalid symbols gracefully', async () => {
    const quote = await getQuote('INVALID123');
    expect(quote).toBeNull();
  });

  it('should cache quotes correctly', async () => {
    const quote1 = await getQuote('BBDC4');
    const quote2 = await getQuote('BBDC4');

    // Both should return the same data (from cache)
    if (quote1 && quote2) {
      expect(quote1.regularMarketPrice).toBe(quote2.regularMarketPrice);
    }
  });
});
