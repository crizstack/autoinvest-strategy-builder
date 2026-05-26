#!/usr/bin/env node

/**
 * Script de Sincronização BRAPI
 * Popula o banco com dados reais de mercado
 * 
 * Uso: node scripts/sync-brapi.mjs
 */

import { getDb } from '../server/db.ts';
import { assets, assetPrices } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const BRAPI_BASE_URL = 'https://brapi.dev/api/quote';
const RATE_LIMIT_DELAY = 100;
const MAX_RETRIES = 3;

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

let lastRequestTime = 0;

async function waitForRateLimit() {
  const timeSinceLastRequest = Date.now() - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();
}

async function fetchWithRetry(url, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      await waitForRateLimit();
      const response = await fetch(url);
      if (response.status === 429) {
        // Rate limited
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

async function fetchQuote(symbol) {
  try {
    const data = await fetchWithRetry(`${BRAPI_BASE_URL}/${symbol}`);
    if (data.results && data.results.length > 0) {
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`   ❌ Erro ao buscar ${symbol}:`, error.message);
    return null;
  }
}

async function fetchHistoricalCandles(symbol, range = '1y') {
  try {
    const data = await fetchWithRetry(`${BRAPI_BASE_URL}/${symbol}?range=${range}`);
    if (data.results && data.results.length > 0 && data.results[0].historicalDataPrice) {
      return data.results[0].historicalDataPrice;
    }
    return [];
  } catch (error) {
    console.error(`   ❌ Erro ao buscar histórico de ${symbol}:`, error.message);
    return [];
  }
}

async function syncAsset(symbol) {
  console.log(`   📥 Sincronizando ${symbol}...`);

  try {
    const db = await getDb();
    if (!db) {
      console.error(`   ❌ Banco de dados não disponível`);
      return { success: false, errors: ['DB unavailable'] };
    }

    // 1. Buscar cotação atual
    const quote = await fetchQuote(symbol);
    if (!quote) {
      return { success: false, errors: [`Não foi possível buscar cotação de ${symbol}`] };
    }

    // 2. Criar ou atualizar asset
    const [existingAsset] = await db
      .select()
      .from(assets)
      .where(eq(assets.symbol, symbol))
      .limit(1);

    let assetId;

    if (existingAsset) {
      await db
        .update(assets)
        .set({
          name: quote.longName || quote.symbol,
          lastUpdated: new Date(),
        })
        .where(eq(assets.symbol, symbol));

      assetId = existingAsset.id;
    } else {
      const inserted = await db.insert(assets).values({
        symbol: quote.symbol,
        name: quote.longName || quote.symbol,
        sector: undefined,
        lastUpdated: new Date(),
      });

      assetId = Number(inserted.insertId);
    }

    // 3. Buscar histórico de candles
    const candles = await fetchHistoricalCandles(symbol);
    let pricesInserted = 0;

    if (candles && candles.length > 0) {
      // Verificar quais preços já existem
      const existingPrices = await db
        .select()
        .from(assetPrices)
        .where(eq(assetPrices.assetId, assetId));

      const existingDates = new Set(existingPrices.map((p) => p.date.getTime()));

      // Inserir novos preços
      const newPrices = candles
        .filter((candle) => !existingDates.has(new Date(candle.date * 1000).getTime()))
        .map((candle) => ({
          assetId,
          date: new Date(candle.date * 1000),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        }));

      if (newPrices.length > 0) {
        await db.insert(assetPrices).values(newPrices);
        pricesInserted = newPrices.length;
      }
    }

    console.log(`      ✅ ${symbol}: ${pricesInserted} preços inseridos`);
    return { success: true, pricesInserted };
  } catch (error) {
    console.error(`   ❌ Erro ao sincronizar ${symbol}:`, error.message);
    return { success: false, errors: [error.message] };
  }
}

async function main() {
  console.log('🚀 Iniciando sincronização de dados BRAPI...\n');

  try {
    let totalAssetsCreated = 0;
    let totalPricesInserted = 0;
    const errors = [];

    // Sincronizar cada ativo
    for (const symbol of MAIN_ASSETS) {
      const result = await syncAsset(symbol);
      if (result.success) {
        totalPricesInserted += result.pricesInserted || 0;
      } else {
        errors.push(...(result.errors || []));
      }
    }

    console.log('\n✅ Sincronização concluída!');
    console.log(`   - Preços inseridos: ${totalPricesInserted}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Erros durante sincronização:');
      errors.forEach((error) => console.log(`   - ${error}`));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
