import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader } from 'lucide-react';

interface HeatmapData {
  day: string;
  performance: number;
  dayIndex: number;
}

const getHeatmapColor = (value: number): string => {
  if (value > 5) return 'bg-green-600';
  if (value > 0) return 'bg-green-500/50';
  if (value > -5) return 'bg-red-500/50';
  return 'bg-red-600';
};

export default function HeatmapWidget() {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar trades fechados com refetch automático
  const { data: trades, isLoading: tradesLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 1000 },
    { refetchInterval: 60000 }
  );

  useEffect(() => {
    if (trades !== undefined) {
      // Agrupar performance por dia da semana
      const dayPerformance: { [key: number]: number[] } = {
        0: [], // Domingo
        1: [], // Segunda
        2: [], // Terça
        3: [], // Quarta
        4: [], // Quinta
        5: [], // Sexta
        6: [], // Sábado
      };

      for (const trade of trades) {
        if (!trade.closedAt || !trade.pnl) continue;

        const date = new Date(trade.closedAt);
        const dayOfWeek = date.getDay();
        dayPerformance[dayOfWeek].push(Number(trade.pnl));
      }

      // Calcular performance média por dia
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
      const heatmapData: HeatmapData[] = days.map((day, index) => {
        const dayTrades = dayPerformance[index];
        const avgPerformance = dayTrades.length > 0 ? dayTrades.reduce((a, b) => a + b, 0) / dayTrades.length : 0;

        return {
          day,
          performance: avgPerformance,
          dayIndex: index,
        };
      });

      setData(heatmapData);
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

  if (data.every((d) => d.performance === 0)) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Heatmap Semanal</h3>
          <p className="text-sm text-slate-400 mt-1">Performance diária (R$)</p>
        </div>
        <div className="flex items-center justify-center h-40 text-center">
          <div>
            <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
            <p className="text-slate-500 text-sm mt-1">Execute trades para ver o heatmap</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Heatmap Semanal</h3>
        <p className="text-sm text-slate-400 mt-1">Performance média por dia (R$)</p>
      </div>
      <div className="flex gap-3 items-end justify-between">
        {data.map((item) => (
          <div key={item.dayIndex} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-20 rounded-lg ${getHeatmapColor(item.performance)} transition-all hover:scale-105 cursor-pointer`}
              title={`${item.day}: R$ ${item.performance.toFixed(2)}`}
            />
            <span className="text-xs text-slate-400">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-slate-400">Ganho forte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600" />
          <span className="text-slate-400">Perda forte</span>
        </div>
      </div>
    </Card>
  );
}
