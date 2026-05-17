import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  return: number;
  trades: number;
  winRate: number;
}

const topStrategies: Strategy[] = [
  { id: '1', name: 'RSI Oversold', return: 28.5, trades: 12, winRate: 75 },
  { id: '2', name: 'MA Crossover', return: 18.3, trades: 8, winRate: 62 },
  { id: '3', name: 'Bollinger Bands', return: 12.1, trades: 5, winRate: 60 },
];

export default function TopStrategiesWidget() {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Top Estratégias</h3>
        <p className="text-sm text-slate-400 mt-1">Melhor performance</p>
      </div>
      <div className="space-y-4">
        {topStrategies.map((strategy) => (
          <div key={strategy.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-white font-medium">{strategy.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{strategy.trades} operações</p>
              </div>
              <div className="flex items-center gap-1 text-green-400">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{strategy.return}%</span>
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
