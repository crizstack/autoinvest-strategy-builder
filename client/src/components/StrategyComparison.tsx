import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

export interface StrategyMetrics {
  name: string;
  totalProfit: number;
  winRate: number;
  sharpeRatio: number;
  profitFactor: number;
  maxDrawdown: number;
  totalTrades: number;
}

interface StrategyComparisonProps {
  strategies: StrategyMetrics[];
}

export function StrategyComparison({ strategies }: StrategyComparisonProps) {
  if (strategies.length === 0) {
    return (
      <Card className="p-12 bg-slate-900/50 border-slate-800 text-center">
        <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-white mb-2">Nenhuma estratégia para comparar</h3>
        <p className="text-slate-400">Execute backtests de múltiplas estratégias para compará-las</p>
      </Card>
    );
  }

  const metrics = [
    { key: 'totalProfit', label: 'Lucro Total', format: (v: number) => `R$ ${v.toLocaleString('pt-BR')}` },
    { key: 'winRate', label: 'Taxa de Acerto', format: (v: number) => `${v}%` },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', format: (v: number) => v.toFixed(2) },
    { key: 'profitFactor', label: 'Profit Factor', format: (v: number) => v.toFixed(2) },
    { key: 'maxDrawdown', label: 'Drawdown Máx', format: (v: number) => `${v}%` },
    { key: 'totalTrades', label: 'Total de Trades', format: (v: number) => v.toString() },
  ];

  const getBestValue = (key: string) => {
    const values = strategies.map((s) => s[key as keyof StrategyMetrics]);
    if (key === 'maxDrawdown') {
      return Math.min(...(values as number[]));
    }
    return Math.max(...(values as number[]));
  };

  const isBest = (key: string, value: any) => {
    if (key === 'maxDrawdown') {
      return value === getBestValue(key);
    }
    return value === getBestValue(key);
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left py-3 px-4 text-slate-400">Métrica</th>
              {strategies.map((strategy) => (
                <th key={strategy.name} className="text-left py-3 px-4 text-slate-300 font-semibold">
                  {strategy.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric.key} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 px-4 text-slate-400">{metric.label}</td>
                {strategies.map((strategy) => {
                  const value = strategy[metric.key as keyof StrategyMetrics] as number;
                  const best = isBest(metric.key, value);

                  return (
                    <td
                      key={`${strategy.name}-${metric.key}`}
                      className={`py-3 px-4 font-semibold ${
                        best
                          ? 'text-green-400 bg-green-500/10'
                          : metric.key === 'totalProfit'
                            ? value > 0
                              ? 'text-green-300'
                              : 'text-red-300'
                            : 'text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {best && <Zap className="w-4 h-4" />}
                        {metric.format(value)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ranking */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Ranking Geral</h3>
        <div className="space-y-3">
          {strategies
            .map((strategy) => {
              let score = 0;
              metrics.forEach((metric) => {
                if (isBest(metric.key, strategy[metric.key as keyof StrategyMetrics])) {
                  score++;
                }
              });
              return { ...strategy, score };
            })
            .sort((a, b) => b.score - a.score)
            .map((strategy, idx) => (
              <div
                key={strategy.name}
                className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="text-white font-semibold">{strategy.name}</p>
                    <p className="text-slate-400 text-sm">{strategy.score} métricas vencedoras</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {strategy.totalProfit > 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className={strategy.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}>
                    R$ {strategy.totalProfit.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
