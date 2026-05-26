import { getDb } from '../server/db';
import { assets, assetPrices } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

const BRAPI_BASE_URL = 'https://brapi.dev/api/quote';
const MAIN_ASSETS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'JBSS3', 'MGLU3', 'RENT3', 'ASAI3'];

async function main() {
  console.log('🚀 Iniciando sincronização...');
  
  const db = await getDb();
  if (!db) {
    console.error('❌ Banco não disponível');
    process.exit(1);
  }

  let totalPrices = 0;

  for (const symbol of MAIN_ASSETS) {
    try {
      console.log(`📥 ${symbol}...`);
      
      // Buscar cotação
      const response = await fetch(`${BRAPI_BASE_URL}/${symbol}`);
      const data = await response.json();
      
      if (!data.results?.[0]) {
        console.log(`   ⚠️ Sem dados`);
        continue;
      }

      const quote = data.results[0];

      // Criar/atualizar asset
      const [existing] = await db.select().from(assets).where(eq(assets.symbol, symbol)).limit(1);
      
      let assetId: number;
      if (existing) {
        assetId = existing.id;
      } else {
        const result = await db.insert(assets).values({
          symbol,
          name: quote.longName || symbol,
          sector: undefined,
          lastUpdated: new Date(),
        });
        assetId = Number(result.insertId);
      }

      // Inserir preço atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [existingPrice] = await db.select().from(assetPrices).where(eq(assetPrices.assetId, assetId)).limit(1);
      
      if (!existingPrice) {
        await db.insert(assetPrices).values({
          assetId,
          time: today,
          open: quote.regularMarketPrice,
          high: quote.regularMarketDayHigh,
          low: quote.regularMarketDayLow,
          close: quote.regularMarketPrice,
          volume: quote.regularMarketVolume,
        });
        totalPrices++;
      }

      console.log(`   ✅ OK`);
    } catch (error) {
      console.error(`   ❌ ${error.message}`);
    }
  }

  console.log(`\n✅ Concluído! ${totalPrices} preços inseridos`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
