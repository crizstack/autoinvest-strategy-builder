/**
 * Candles Service
 * Busca candles do banco de dados
 * Substitui generateMockCandles com dados reais
 */

import { getDb } from '../db';
import { assets, assetPrices } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export interface HistoricalCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Buscar candles de um ativo em um período
 */
export async function getCandles(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<HistoricalCandle[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Banco de dados não disponível');
      return [];
    }

    // 1. Buscar asset
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    if (!asset) {
      console.error(`Asset ${symbol} não encontrado no banco`);
      return [];
    }

    // 2. Buscar preços no período
    const prices = await db
      .select({
        time: assetPrices.time,
        open: assetPrices.open,
        high: assetPrices.high,
        low: assetPrices.low,
        close: assetPrices.close,
        volume: assetPrices.volume,
      })
      .from(assetPrices)
      .where(
        and(
          eq(assetPrices.assetId, asset.id),
          gte(assetPrices.time, startDate),
          lte(assetPrices.time, endDate)
        )
      )
      .orderBy(assetPrices.time);

    // 3. Converter para HistoricalCandle
    const candles: HistoricalCandle[] = prices.map((price) => ({
      timestamp: price.time,
      open: Number(price.open),
      high: Number(price.high),
      low: Number(price.low),
      close: Number(price.close),
      volume: Number(price.volume),
    }));

    if (candles.length === 0) {
      console.warn(`Nenhum candle encontrado para ${symbol} entre ${startDate} e ${endDate}`);
    }

    return candles;
  } catch (error) {
    console.error(`Erro ao buscar candles de ${symbol}:`, error);
    return [];
  }
}

/**
 * Buscar último candle de um ativo
 */
export async function getLatestCandle(symbol: string): Promise<HistoricalCandle | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    // 1. Buscar asset
    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    if (!asset) {
      console.error(`Asset ${symbol} não encontrado`);
      return null;
    }

    // 2. Buscar último preço
    const prices = await db
      .select({
        time: assetPrices.time,
        open: assetPrices.open,
        high: assetPrices.high,
        low: assetPrices.low,
        close: assetPrices.close,
        volume: assetPrices.volume,
      })
      .from(assetPrices)
      .where(eq(assetPrices.assetId, asset.id))
      .orderBy(assetPrices.time)
      .limit(1);

    if (prices.length === 0) {
      console.warn(`Nenhum candle encontrado para ${symbol}`);
      return null;
    }

    const price = prices[0];
    return {
      timestamp: price.time,
      open: Number(price.open),
      high: Number(price.high),
      low: Number(price.low),
      close: Number(price.close),
      volume: Number(price.volume),
    };
  } catch (error) {
    console.error(`Erro ao buscar último candle de ${symbol}:`, error);
    return null;
  }
}

/**
 * Verificar se há dados suficientes para um ativo
 */
export async function hasEnoughData(symbol: string, minCandles: number = 30): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) return false;

    const [asset] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    if (!asset) return false;

    const prices = await db
      .select({ id: assetPrices.id })
      .from(assetPrices)
      .where(eq(assetPrices.assetId, asset.id))
      .limit(minCandles);

    return prices.length >= minCandles;
  } catch (error) {
    console.error(`Erro ao verificar dados de ${symbol}:`, error);
    return false;
  }
}

/**
 * Obter estatísticas de cobertura de dados
 */
export async function getDataCoverage(): Promise<
  Array<{
    symbol: string;
    name: string;
    candleCount: number;
    oldestDate: Date | null;
    newestDate: Date | null;
  }>
> {
  try {
    const db = await getDb();
    if (!db) return [];

    const allAssets = await db
      .select()
      .from(assets);

    const coverage = await Promise.all(
      allAssets.map(async (asset: any) => {
        const prices = await db
          .select({
            time: assetPrices.time,
          })
          .from(assetPrices)
          .where(eq(assetPrices.assetId, asset.id))
          .orderBy(assetPrices.time);

        return {
          symbol: asset.symbol,
          name: asset.name,
          candleCount: prices.length,
          oldestDate: prices.length > 0 ? prices[0].time : null,
          newestDate: prices.length > 0 ? prices[prices.length - 1].time : null,
        };
      })
    );

    return coverage;
  } catch (error) {
    console.error('Erro ao obter cobertura de dados:', error);
    return [];
  }
}
