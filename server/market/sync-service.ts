/**
 * Sync Service
 * Sincroniza dados da BRAPI com o banco de dados
 * Popula tabelas assets e assetPrices
 */

import { getDb } from '../db';
import { assets, assetPrices } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  fetchQuote,
  fetchHistoricalCandles,
  brapiQuoteToAsset,
  candleToAssetPrice,
  clearSymbolCache,
} from './brapi-service';

interface SyncResult {
  success: boolean;
  assetsCreated: number;
  assetsUpdated: number;
  pricesInserted: number;
  errors: string[];
}

/**
 * Lista de ativos principais B3 para sincronizar
 */
const MAIN_ASSETS = [
  'PETR4', // Petrobras
  'VALE3', // Vale
  'ITUB4', // Itaú
  'BBDC4', // Bradesco
  'ABEV3', // Ambev
  'WEGE3', // WEG
  'JBSS3', // JBS
  'MGLU3', // Magazine Luiza
  'RENT3', // Localiza
  'ASAI3', // Assaí
];

/**
 * Sincronizar um ativo
 */
export async function syncAsset(symbol: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    assetsCreated: 0,
    assetsUpdated: 0,
    pricesInserted: 0,
    errors: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      result.errors.push('Banco de dados não disponível');
      return result;
    }

    // 1. Buscar cotação atual
    const quote = await fetchQuote(symbol);
    if (!quote) {
      result.errors.push(`Não foi possível buscar cotação de ${symbol}`);
      return result;
    }

    // 2. Criar ou atualizar asset
    const existingAsset = await db.query.assets.findFirst({
      where: eq(assets.symbol, symbol),
    });

    let assetId: number;

    if (existingAsset) {
      // Atualizar
      await db
        .update(assets)
        .set({
          name: quote.longName || quote.symbol,
          lastUpdated: new Date(),
        })
        .where(eq(assets.symbol, symbol));

      assetId = existingAsset.id;
      result.assetsUpdated++;
    } else {
      // Criar
      const inserted = await db.insert(assets).values({
        symbol: quote.symbol,
        name: quote.longName || quote.symbol,
        sector: undefined,
        lastUpdated: new Date(),
      });

      assetId = Number(inserted.insertId);
      result.assetsCreated++;
    }

    // 3. Buscar histórico de candles
    const candles = await fetchHistoricalCandles(symbol, '1y');

    if (candles.length === 0) {
      result.errors.push(`Nenhum candle histórico para ${symbol}`);
      return result;
    }

    // 4. Limpar preços antigos
    await db.delete(assetPrices).where(eq(assetPrices.assetId, assetId));

    // 5. Inserir novos preços
    const priceValues = candles.map((candle) => candleToAssetPrice(assetId, candle));

    if (priceValues.length > 0) {
      await db.insert(assetPrices).values(priceValues);
      result.pricesInserted = priceValues.length;
    }

    result.success = true;
    clearSymbolCache(symbol);

    console.log(`✅ Sincronizado ${symbol}: ${result.pricesInserted} preços`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    console.error(`❌ Erro ao sincronizar ${symbol}:`, error);
  }

  return result;
}

/**
 * Sincronizar múltiplos ativos
 */
export async function syncMultipleAssets(symbols: string[]): Promise<SyncResult> {
  const aggregated: SyncResult = {
    success: true,
    assetsCreated: 0,
    assetsUpdated: 0,
    pricesInserted: 0,
    errors: [],
  };

  for (const symbol of symbols) {
    const result = await syncAsset(symbol);

    aggregated.assetsCreated += result.assetsCreated;
    aggregated.assetsUpdated += result.assetsUpdated;
    aggregated.pricesInserted += result.pricesInserted;
    aggregated.errors.push(...result.errors);

    if (!result.success) {
      aggregated.success = false;
    }

    // Delay entre requisições para evitar rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return aggregated;
}

/**
 * Sincronizar ativos principais
 */
export async function syncMainAssets(): Promise<SyncResult> {
  console.log(`🔄 Iniciando sincronização de ${MAIN_ASSETS.length} ativos...`);
  const result = await syncMultipleAssets(MAIN_ASSETS);

  console.log(`✅ Sincronização completa:`);
  console.log(`   - Assets criados: ${result.assetsCreated}`);
  console.log(`   - Assets atualizados: ${result.assetsUpdated}`);
  console.log(`   - Preços inseridos: ${result.pricesInserted}`);

  if (result.errors.length > 0) {
    console.log(`⚠️  Erros: ${result.errors.join(', ')}`);
  }

  return result;
}

/**
 * Atualizar preços recentes de um ativo
 */
export async function updateRecentPrices(symbol: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    assetsCreated: 0,
    assetsUpdated: 0,
    pricesInserted: 0,
    errors: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      result.errors.push('Banco de dados não disponível');
      return result;
    }

    // Buscar asset
    const asset = await db.query.assets.findFirst({
      where: eq(assets.symbol, symbol),
    });

    if (!asset) {
      result.errors.push(`Asset ${symbol} não encontrado. Execute syncAsset primeiro.`);
      return result;
    }

    // Buscar candles recentes
    const candles = await fetchHistoricalCandles(symbol, '1mo');

    if (candles.length === 0) {
      result.errors.push(`Nenhum candle recente para ${symbol}`);
      return result;
    }

    // Limpar preços do último mês
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    await db
      .delete(assetPrices)
      .where(
        (col) =>
          col.assetId === asset.id &&
          col.time >= oneMonthAgo
      );

    // Inserir novos preços
    const priceValues = candles.map((candle) => candleToAssetPrice(asset.id, candle));

    if (priceValues.length > 0) {
      await db.insert(assetPrices).values(priceValues);
      result.pricesInserted = priceValues.length;
    }

    result.success = true;
    clearSymbolCache(symbol);

    console.log(`✅ Atualizado ${symbol}: ${result.pricesInserted} preços recentes`);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    console.error(`❌ Erro ao atualizar ${symbol}:`, error);
  }

  return result;
}

/**
 * Obter lista de ativos sincronizados
 */
export async function getSyncedAssets(): Promise<
  Array<{
    id: number;
    symbol: string;
    name: string;
    lastUpdated: Date | null;
    priceCount: number;
  }>
> {
  try {
    const db = await getDb();
    if (!db) return [];

    const result = await db.query.assets.findMany();

    return result.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      lastUpdated: asset.lastUpdated,
      priceCount: 0, // Será preenchido com query separada se necessário
    }));
  } catch (error) {
    console.error('Erro ao obter assets sincronizados:', error);
    return [];
  }
}
