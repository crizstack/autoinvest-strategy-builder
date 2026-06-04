import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { Loader, TrendingUp } from 'lucide-react';

interface BalancePoint {
  date: string;
  balance: number;
}

export default function BalanceChart() {
  const [data, setData] = useState<BalancePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar portfolio com refetch automático
  const { data: portfolio, isLoading: portfolioLoading } = trpc.portfolio.getPortfolio.useQuery(undefined, {
    refetchInterval: 30000,
  });

  // Buscar trades fechados com refetch automático
  const { data: trades, isLoading: tradesLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 1000 },
    { refetchInterval: 30000 }
  );

  useEffect(() => {
    if (portfolio && trades !== undefined) {
      const initialBalance = Number(portfolio.initialBalance) || 0;

      if (initialBalance === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Ordenar trades por data
      const sortedTrades = [...(trades || [])].sort(
        (a, b) => new Date(a.exitTime || 0).getTime() - new Date(b.exitTime || 0).getTime()
      );

      // Calcular saldo em cada ponto
      let runningBalance = initialBalance;
      const points: BalancePoint[] = [];

      // Adicionar ponto inicial
      if (sortedTrades.length > 0) {
        points.push({
          date: new Date(sortedTrades[0].exitTime || Date.now()).toLocaleDateString('pt-BR'),
          balance: initialBalance,
        });
      }

      // Adicionar pontos para cada trade
      for (const trade of sortedTrades) {
        if (trade.profitLoss !== undefined && trade.profitLoss !== null && trade.exitTime) {
          runningBalance += Number(trade.profitLoss);
          points.push({
            date: new Date(trade.exitTime).toLocaleDateString('pt-BR'),
            balance: Math.round(runningBalance),
          });
        }
      }

      // Se há dados, mostrar últimos 30 pontos
      if (points.length > 0) {
        setData(points.slice(-30));
      } else {
        setData([]);
      }

      setLoading(false);
    }
  }, [portfolio, trades]);

  if (portfolioLoading || tradesLoading) {
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
          <h3 className="text-lg font-semibold text-white">Evolução do Saldo</h3>
          <p className="text-sm text-slate-400 mt-1">Últimos 30 dias</p>
        </div>
        <div className="flex flex-col items-center justify-center h-80 text-center">
          <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
          <p className="text-slate-500 text-sm mt-1">Execute trades para ver o gráfico de evolução</p>
        </div>
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
