import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader } from 'lucide-react';

interface BalancePoint {
  date: string;
  balance: number;
}

export default function BalanceChart() {
  const [data, setData] = useState<BalancePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar portfolio
  const { data: portfolio } = trpc.portfolio.getPortfolio.useQuery();

  // Buscar trades fechados
  const { data: trades } = trpc.paperTrading.getClosedTrades.useQuery({ limit: 1000 });

  useEffect(() => {
    if (portfolio && trades) {
      const initialBalance = Number(portfolio.initialBalance) || 10000;

      // Ordenar trades por data
      const sortedTrades = [...(trades || [])].sort(
        (a, b) => new Date(a.exitTime!).getTime() - new Date(b.exitTime!).getTime()
      );

      // Calcular saldo em cada ponto
      let runningBalance = initialBalance;
      const points: BalancePoint[] = [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
          balance: initialBalance,
        },
      ];

      for (const trade of sortedTrades) {
        if (trade.profitLoss && trade.exitTime) {
          runningBalance += trade.profitLoss;
          points.push({
            date: new Date(trade.exitTime).toLocaleDateString('pt-BR'),
            balance: Math.round(runningBalance),
          });
        }
      }

      // Se não há trades, preencher com dados de exemplo
      if (points.length === 1) {
        const today = new Date();
        for (let i = 7; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          points.push({
            date: date.toLocaleDateString('pt-BR'),
            balance: initialBalance,
          });
        }
      }

      setData(points.slice(-8)); // Últimos 8 pontos
      setLoading(false);
    }
  }, [portfolio, trades]);

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
        <h3 className="text-lg font-semibold text-white">Evolução do Saldo</h3>
        <p className="text-sm text-slate-400 mt-1">Últimos 30 dias</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
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
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
