#!/usr/bin/env node

/**
 * Script de Sincronização BRAPI
 * Popula o banco com dados reais de mercado
 * 
 * Uso: node scripts/sync-brapi.mjs
 */

import { syncMainAssets, getSyncedAssets, getDataCoverage } from '../server/market/sync-service.mjs';

async function main() {
  console.log('🚀 Iniciando sincronização de dados BRAPI...\n');

  try {
    // 1. Sincronizar ativos principais
    console.log('📥 Sincronizando ativos principais...');
    const syncResult = await syncMainAssets();

    if (!syncResult.success) {
      console.error('❌ Erro durante sincronização:', syncResult.errors);
      process.exit(1);
    }

    // 2. Listar ativos sincronizados
    console.log('\n📊 Ativos sincronizados:');
    const assets = await getSyncedAssets();
    console.log(`   Total: ${assets.length} ativos`);

    // 3. Obter cobertura de dados
    console.log('\n📈 Cobertura de dados:');
    const coverage = await getDataCoverage();

    for (const item of coverage) {
      const oldest = item.oldestDate ? new Date(item.oldestDate).toLocaleDateString('pt-BR') : 'N/A';
      const newest = item.newestDate ? new Date(item.newestDate).toLocaleDateString('pt-BR') : 'N/A';
      console.log(`   ${item.symbol}: ${item.candleCount} candles (${oldest} a ${newest})`);
    }

    console.log('\n✅ Sincronização concluída com sucesso!');
    console.log(`   - Assets criados: ${syncResult.assetsCreated}`);
    console.log(`   - Assets atualizados: ${syncResult.assetsUpdated}`);
    console.log(`   - Preços inseridos: ${syncResult.pricesInserted}`);

    if (syncResult.errors.length > 0) {
      console.log('\n⚠️  Erros durante sincronização:');
      syncResult.errors.forEach((error) => console.log(`   - ${error}`));
    }
  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

main();
