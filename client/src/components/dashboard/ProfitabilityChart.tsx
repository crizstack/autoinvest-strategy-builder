import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader, BarChart3 } from 'lucide-react';

interface ProfitabilityData {
  week: string;
  profit: number;
  loss: number;
}

export default function ProfitabilityChart() {
  const [data, setData] = useState<ProfitabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar trades fechados com refetch automático
  const { data: trades, isLoading: tradesLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 1000 },
    { refetchInterval: 30000 }
  );

  useEffect(() => {
    if (trades !== undefined) {
      // Agrupar por semana
      const weeklyData: { [key: string]: { profit: number; loss: number; date: Date } } = {};

      for (const trade of trades) {
        if (!trade.closedAt) continue;

        const date = new Date(trade.closedAt);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString('pt-BR');

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { profit: 0, loss: 0, date: weekStart };
        }

        if (trade.pnl) {
          const pnlValue = Number(trade.pnl);
          if (pnlValue > 0) {
            weeklyData[weekKey].profit += pnlValue;
          } else {
            weeklyData[weekKey].loss += pnlValue;
          }
        }
      }

      // Converter para array e ordenar por data
      const result = Object.entries(weeklyData)
        .map(([week, data]) => ({
          week,
          profit: Math.round(data.profit),
          loss: Math.round(data.loss),
          date: data.date,
        }))
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(-12) // Últimas 12 semanas
        .map(({ week, profit, loss }) => ({
          week,
          profit,
          loss,
        }));

      setData(result);
      setLoading(false);
    }
  }, [trades]);

  if (tradesLoading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2 flex items-center justify-center h-80">
        <Loader className="w-6 h-6 text-green-400 animate-spin" />
      </Card>
    );
  }

  if (!loading && data.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Ganhos vs Perdas</h3>
          <p className="text-sm text-slate-400 mt-1">Performance semanal</p>
        </div>
        <div className="flex flex-col items-center justify-center h-80 text-center">
          <BarChart3 className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
          <p className="text-slate-500 text-sm mt-1">Execute trades para ver o gráfico de performance</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Ganhos vs Perdas</h3>
        <p className="text-sm text-slate-400 mt-1">Performance semanal</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <Legend wrapperStyle={{ color: '#94a3b8' }} />
          <Bar dataKey="profit" fill="#10b981" name="Ganhos" />
          <Bar dataKey="loss" fill="#ef4444" name="Perdas" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
