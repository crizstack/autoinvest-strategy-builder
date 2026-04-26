export interface Asset {
  code: string;
  name: string;
  sector: string;
  currentPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
}

export interface PriceHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Mock data de ativos B3
export const mockAssets: Asset[] = [
  {
    code: 'PETR4',
    name: 'Petrobras',
    sector: 'Energia',
    currentPrice: 28.45,
    previousClose: 27.89,
    dayHigh: 29.15,
    dayLow: 27.65,
    volume: 45230000,
    marketCap: 450000000000,
  },
  {
    code: 'VALE3',
    name: 'Vale',
    sector: 'Mineração',
    currentPrice: 67.82,
    previousClose: 66.45,
    dayHigh: 68.90,
    dayLow: 66.20,
    volume: 28900000,
    marketCap: 350000000000,
  },
  {
    code: 'ITUB4',
    name: 'Itaú Unibanco',
    sector: 'Financeiro',
    currentPrice: 32.15,
    previousClose: 31.98,
    dayHigh: 32.45,
    dayLow: 31.80,
    volume: 52100000,
    marketCap: 320000000000,
  },
  {
    code: 'BBDC4',
    name: 'Banco Bradesco',
    sector: 'Financeiro',
    currentPrice: 28.92,
    previousClose: 28.65,
    dayHigh: 29.20,
    dayLow: 28.45,
    volume: 38500000,
    marketCap: 280000000000,
  },
  {
    code: 'ABEV3',
    name: 'Ambev',
    sector: 'Bebidas',
    currentPrice: 15.34,
    previousClose: 15.12,
    dayHigh: 15.60,
    dayLow: 15.05,
    volume: 65200000,
    marketCap: 180000000000,
  },
  {
    code: 'BBAS3',
    name: 'Banco do Brasil',
    sector: 'Financeiro',
    currentPrice: 32.78,
    previousClose: 32.45,
    dayHigh: 33.10,
    dayLow: 32.20,
    volume: 42300000,
    marketCap: 200000000000,
  },
  {
    code: 'WEGE3',
    name: 'WEG',
    sector: 'Indústria',
    currentPrice: 42.56,
    previousClose: 41.89,
    dayHigh: 43.20,
    dayLow: 41.65,
    volume: 18900000,
    marketCap: 150000000000,
  },
  {
    code: 'MGLU3',
    name: 'Magazine Luiza',
    sector: 'Varejo',
    currentPrice: 8.45,
    previousClose: 8.12,
    dayHigh: 8.65,
    dayLow: 8.05,
    volume: 95600000,
    marketCap: 45000000000,
  },
];

// Gerar dados históricos realistas
export const generatePriceHistory = (basePrice: number, days: number): PriceHistory[] => {
  const history: PriceHistory[] = [];
  let currentPrice = basePrice;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Simular movimento de preço realista
    const dailyChange = (Math.random() - 0.5) * 0.04; // ±2%
    const open = currentPrice;
    const close = open * (1 + dailyChange);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 50000000 + 10000000);

    history.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return history;
};

// Dados históricos pré-gerados para cada ativo (últimos 252 dias = 1 ano de trading)
export const mockPriceHistory: Record<string, PriceHistory[]> = {
  PETR4: generatePriceHistory(28.45, 252),
  VALE3: generatePriceHistory(67.82, 252),
  ITUB4: generatePriceHistory(32.15, 252),
  BBDC4: generatePriceHistory(28.92, 252),
  ABEV3: generatePriceHistory(15.34, 252),
  BBAS3: generatePriceHistory(32.78, 252),
  WEGE3: generatePriceHistory(42.56, 252),
  MGLU3: generatePriceHistory(8.45, 252),
};

// Calcular variação percentual
export const calculateVariation = (asset: Asset): number => {
  return ((asset.currentPrice - asset.previousClose) / asset.previousClose) * 100;
};

// Formatar moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatar número com separador de milhares
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('pt-BR').format(value);
};
