import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface Strategy {
  id: number;
  name: string;
  return: number;
  trades: number;
  winRate: number;
}

export default function TopStrategiesWidget() {
  const [topStrategies, setTopStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar estratégias
  const { data: strategies } = trpc.strategies.list.useQuery();

  // Buscar trades
  const { data: trades } = trpc.paperTrading.getClosedTrades.useQuery({ limit: 1000 });

  useEffect(() => {
    if (strategies && trades) {
      // Agrupar trades por estratégia
      const strategyStats: { [key: number]: { profit: number; trades: number; wins: number } } = {};

      for (const trade of trades) {
        if (!strategyStats[trade.strategyId]) {
          strategyStats[trade.strategyId] = { profit: 0, trades: 0, wins: 0 };
        }

        strategyStats[trade.strategyId].trades += 1;
        if (trade.profitLoss && trade.profitLoss > 0) {
          strategyStats[trade.strategyId].wins += 1;
        }
        if (trade.profitLoss) {
          strategyStats[trade.strategyId].profit += trade.profitLoss;
        }
      }

      // Mapear estratégias com stats
      const result = strategies
        .map((strategy) => {
          const stats = strategyStats[strategy.id];
          if (!stats || stats.trades === 0) {
            return {
              id: strategy.id,
              name: strategy.name,
              return: 0,
              trades: 0,
              winRate: 0,
            };
          }

          const initialBalance = 10000;
          const returnPercent = (stats.profit / initialBalance) * 100;
          const winRate = (stats.wins / stats.trades) * 100;

          return {
            id: strategy.id,
            name: strategy.name,
            return: Math.round(returnPercent * 10) / 10,
            trades: stats.trades,
            winRate: Math.round(winRate),
          };
        })
        .sort((a, b) => b.return - a.return)
        .slice(0, 3); // Top 3

      setTopStrategies(result);
      setLoading(false);
    }
  }, [strategies, trades]);

  if (loading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 flex items-center justify-center">
        <Loader className="w-6 h-6 text-green-400 animate-spin" />
      </Card>
    );
  }

  if (topStrategies.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Top Estratégias</h3>
          <p className="text-sm text-slate-400 mt-1">Melhor performance</p>
        </div>
        <p className="text-slate-400 text-center py-8">Nenhuma estratégia com trades ainda</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Top Estratégias</h3>
        <p className="text-sm text-slate-400 mt-1">Melhor performance</p>
      </div>
      <div className="space-y-4">
        {topStrategies.map((strategy) => (
          <div
            key={strategy.id}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">{strategy.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{strategy.trades} operações</p>
              </div>
              <div className={`flex items-center gap-1 ${strategy.return > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {strategy.return > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">{strategy.return > 0 ? '+' : ''}{strategy.return}%</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Taxa de acerto</span>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 rounded-full bg-slate-700">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${strategy.winRate}%` }}
                  />
                </div>
                <span className="text-slate-300 font-medium">{strategy.winRate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
