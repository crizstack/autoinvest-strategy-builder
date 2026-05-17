import { drizzle } from 'drizzle-orm/mysql2';
import { assets } from './drizzle/schema.js';

const db = drizzle(process.env.DATABASE_URL);

const seedAssets = [
  { symbol: 'PETR4', name: 'Petrobras', sector: 'Energia' },
  { symbol: 'VALE3', name: 'Vale', sector: 'Mineração' },
  { symbol: 'ITUB4', name: 'Itaú', sector: 'Financeiro' },
  { symbol: 'BBDC4', name: 'Bradesco', sector: 'Financeiro' },
  { symbol: 'WEGE3', name: 'WEG', sector: 'Industrial' },
  { symbol: 'MGLU3', name: 'Magazine Luiza', sector: 'Varejo' },
  { symbol: 'ABEV3', name: 'Ambev', sector: 'Bebidas' },
  { symbol: 'B3SA3', name: 'B3', sector: 'Financeiro' },
];

async function seed() {
  try {
    console.log('Seeding assets...');
    
    for (const asset of seedAssets) {
      await db.insert(assets).values(asset).onDuplicateKeyUpdate({
        set: { name: asset.name, sector: asset.sector },
      });
    }
    
    console.log('✅ Assets seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
