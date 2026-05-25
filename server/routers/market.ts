import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import { syncAsset, syncMainAssets, getSyncedAssets, updateRecentPrices } from '../market/sync-service';
import { getCandles, getLatestCandle, getDataCoverage, hasEnoughData } from '../market/candles-service';
import { fetchQuote, getApiStatus } from '../market/brapi-service';

export const marketRouter = router({
  /**
   * Sincronizar um ativo específico
   */
  syncAsset: protectedProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .mutation(async ({ input }) => {
      const result = await syncAsset(input.symbol);
      return result;
    }),

  /**
   * Sincronizar ativos principais
   */
  syncMainAssets: protectedProcedure.mutation(async () => {
    const result = await syncMainAssets();
    return result;
  }),

  /**
   * Atualizar preços recentes de um ativo
   */
  updateRecentPrices: protectedProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .mutation(async ({ input }) => {
      const result = await updateRecentPrices(input.symbol);
      return result;
    }),

  /**
   * Obter ativos sincronizados
   */
  getSyncedAssets: publicProcedure.query(async () => {
    const assets = await getSyncedAssets();
    return assets;
  }),

  /**
   * Obter candles de um ativo
   */
  getCandles: publicProcedure
    .input(
      z.object({
        symbol: z.string().min(1).max(10),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .query(async ({ input }) => {
      const candles = await getCandles(input.symbol, input.startDate, input.endDate);
      return candles;
    }),

  /**
   * Obter último candle de um ativo
   */
  getLatestCandle: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input }) => {
      const candle = await getLatestCandle(input.symbol);
      return candle;
    }),

  /**
   * Verificar se há dados suficientes
   */
  hasEnoughData: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10), minCandles: z.number().default(30) }))
    .query(async ({ input }) => {
      const hasData = await hasEnoughData(input.symbol, input.minCandles);
      return { symbol: input.symbol, hasData, minCandles: input.minCandles };
    }),

  /**
   * Obter cobertura de dados
   */
  getDataCoverage: publicProcedure.query(async () => {
    const coverage = await getDataCoverage();
    return coverage;
  }),

  /**
   * Obter cotação atual de um ativo
   */
  getQuote: publicProcedure
    .input(z.object({ symbol: z.string().min(1).max(10) }))
    .query(async ({ input }) => {
      const quote = await fetchQuote(input.symbol);
      return quote;
    }),

  /**
   * Obter status da API BRAPI
   */
  getApiStatus: publicProcedure.query(() => {
    const status = getApiStatus();
    return status;
  }),
});
