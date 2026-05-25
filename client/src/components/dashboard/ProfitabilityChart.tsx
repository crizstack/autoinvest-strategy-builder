import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader } from 'lucide-react';

interface ProfitabilityData {
  week: string;
  profit: number;
  loss: number;
}

export default function ProfitabilityChart() {
  const [data, setData] = useState<ProfitabilityData[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar trades fechados
  const { data: trades } = trpc.paperTrading.getClosedTrades.useQuery({ limit: 1000 });

  useEffect(() => {
    if (trades) {
      // Agrupar por semana
      const weeklyData: { [key: string]: { profit: number; loss: number } } = {};

      for (const trade of trades) {
        if (!trade.exitTime) continue;

        const date = new Date(trade.exitTime);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toLocaleDateString('pt-BR');

        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = { profit: 0, loss: 0 };
        }

        if (trade.profitLoss) {
          if (trade.profitLoss > 0) {
            weeklyData[weekKey].profit += trade.profitLoss;
          } else {
            weeklyData[weekKey].loss += trade.profitLoss;
          }
        }
      }

      // Converter para array
      const result = Object.entries(weeklyData)
        .map(([week, data], index) => ({
          week: `Sem ${index + 1}`,
          profit: Math.round(data.profit),
          loss: Math.round(data.loss),
        }))
        .slice(-4); // Últimas 4 semanas

      // Se não há dados, preencher com zeros
      if (result.length === 0) {
        result.push(
          { week: 'Sem 1', profit: 0, loss: 0 },
          { week: 'Sem 2', profit: 0, loss: 0 },
          { week: 'Sem 3', profit: 0, loss: 0 },
          { week: 'Sem 4', profit: 0, loss: 0 }
        );
      }

      setData(result);
      setLoading(false);
    }
  }, [trades]);

  if (loading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2 flex items-center justify-center">
        <Loader className="w-6 h-6 text-green-400 animate-spin" />
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
