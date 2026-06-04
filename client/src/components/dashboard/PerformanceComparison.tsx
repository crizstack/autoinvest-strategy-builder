import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { format, subDays, startOfDay } from 'date-fns';
import { Loader, TrendingUp } from 'lucide-react';

interface PerformanceData {
  date: string;
  user: number;
}

export default function PerformanceComparison() {
  const [data, setData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Buscar histórico de trades fechados
  const { data: closedTrades, isLoading: tradesLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 1000 },
    { refetchInterval: 60000 } // Atualizar a cada minuto
  );

  // Buscar portfolio inicial
  const { data: portfolio, isLoading: portfolioLoading } = trpc.portfolio.getPortfolio.useQuery(undefined, {
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (closedTrades && portfolio && !tradesLoading && !portfolioLoading) {
      // Calcular rentabilidade por dia
      const initialBalance = Number(portfolio.initialBalance) || 0;
      
      if (initialBalance === 0) {
        setData([]);
        setIsLoading(false);
        return;
      }

      const today = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => startOfDay(subDays(today, 29 - i)));

      const performanceByDay: Record<string, number> = {};

      // Inicializar com 0%
      last30Days.forEach((day) => {
        const dateKey = format(day, 'MMM dd');
        performanceByDay[dateKey] = 0;
      });

      // Calcular rentabilidade do usuário por dia
      let cumulativePnL = 0;
      closedTrades?.forEach((trade) => {
        if (trade.closedAt) {
          const tradeDate = format(new Date(trade.closedAt), 'MMM dd');
          if (performanceByDay.hasOwnProperty(tradeDate)) {
            cumulativePnL += Number(trade.pnl) || 0;
            const returnPercent = (cumulativePnL / initialBalance) * 100;
            performanceByDay[tradeDate] = returnPercent;
          }
        }
      });

      // Converter para array
      const chartData = last30Days.map((day) => ({
        date: format(day, 'MMM dd'),
        user: performanceByDay[format(day, 'MMM dd')],
      }));

      setData(chartData);
      setIsLoading(false);
    }
  }, [closedTrades, portfolio, tradesLoading, portfolioLoading]);

  if (tradesLoading || portfolioLoading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2 flex items-center justify-center h-80">
        <Loader className="w-6 h-6 text-green-400 animate-spin" />
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Sua Performance</h3>
          <p className="text-sm text-slate-400 mt-1">Rentabilidade acumulada (%)</p>
        </div>
        <div className="flex flex-col items-center justify-center h-80 text-center">
          <TrendingUp className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">Nenhum dado disponível</p>
          <p className="text-slate-500 text-sm mt-1">Execute trades para ver sua performance</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Sua Performance</h3>
        <p className="text-sm text-slate-400 mt-1">Rentabilidade acumulada (%) - Últimos 30 dias</p>
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
            formatter={(value) => `${(value as number).toFixed(2)}%`}
          />
          <Legend wrapperStyle={{ color: '#94a3b8' }} />
          <Line
            type="monotone"
            dataKey="user"
            stroke="#10b981"
            strokeWidth={2}
            name="Sua Carteira"
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
        <p className="text-xs text-slate-400">
          💡 <strong>Comparação com Benchmark:</strong> Para comparar com Ibovespa ou outros benchmarks, integre dados reais da BRAPI ou outra API de dados de mercado.
        </p>
      </div>
    </Card>
  );
}
