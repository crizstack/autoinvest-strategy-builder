import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

const marketData: MarketData[] = [
  { symbol: 'PETR4', name: 'Petrobras', price: 28.45, change: 0.85, changePercent: 3.08 },
  { symbol: 'VALE3', name: 'Vale', price: 56.20, change: -1.20, changePercent: -2.09 },
  { symbol: 'ITUB4', name: 'Itaú', price: 27.80, change: 0.45, changePercent: 1.64 },
  { symbol: 'BBDC4', name: 'Bradesco', price: 29.15, change: -0.35, changePercent: -1.19 },
];

export default function MarketTodayWidget() {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Mercado Hoje</h3>
        <p className="text-sm text-slate-400 mt-1">Principais ativos B3</p>
      </div>
      <div className="space-y-3">
        {marketData.map((asset) => (
          <div key={asset.symbol} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{asset.symbol}</span>
                <span className="text-xs text-slate-400">{asset.name}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">R$ {asset.price.toFixed(2)}</p>
            </div>
            <div className={`flex items-center gap-1 ${asset.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {asset.changePercent >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-semibold">{asset.changePercent >= 0 ? '+' : ''}{asset.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
