import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
}

export default function MarketTodayWidget() {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar trades para extrair ativos únicos
  const { data: trades, isLoading: tradesLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 1000 },
    { refetchInterval: 60000 }
  );

  useEffect(() => {
    if (trades !== undefined && trades.length > 0) {
      // Extrair ativos únicos dos trades
      const uniqueAssets = Array.from(new Set(trades.map((t) => t.asset))).slice(0, 4);

      // Simular dados de mercado para os ativos do portfolio
      // Em produção, isso viria de uma API de dados de mercado real (BRAPI, etc)
      const marketData: MarketData[] = uniqueAssets.map((asset) => ({
        symbol: asset,
        name: asset,
        price: 100 + Math.random() * 50,
        changePercent: (Math.random() - 0.5) * 10,
      }));

      setData(marketData);
      setLoading(false);
    } else if (trades !== undefined && trades.length === 0) {
      setData([]);
      setLoading(false);
    }
  }, [trades]);

  if (tradesLoading || loading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 flex items-center justify-center h-64">
        <Loader className="w-6 h-6 text-green-400 animate-spin" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Mercado Hoje</h3>
          <p className="text-sm text-slate-400 mt-1">Ativos do seu portfolio</p>
        </div>
        <div className="flex items-center justify-center h-40 text-center">
          <div>
            <p className="text-slate-400 font-medium">Nenhum ativo no portfolio</p>
            <p className="text-slate-500 text-sm mt-1">Execute trades para ver dados de mercado</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Mercado Hoje</h3>
        <p className="text-sm text-slate-400 mt-1">Ativos do seu portfolio</p>
      </div>
      <div className="space-y-3">
        {data.map((asset) => (
          <div
            key={asset.symbol}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
          >
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
              <span className="font-semibold">
                {asset.changePercent >= 0 ? '+' : ''}
                {asset.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        💡 Nota: Dados de mercado em tempo real requerem integração com API de dados (BRAPI, etc)
      </p>
    </Card>
  );
}
