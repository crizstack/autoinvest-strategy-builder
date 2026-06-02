import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { format, subDays, startOfDay } from 'date-fns';

interface PerformanceData {
  date: string;
  user: number;
  market: number;
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
      const initialBalance = Number(portfolio.initialBalance || 10000);
      const today = new Date();
      const last30Days = Array.from({ length: 30 }, (_, i) => startOfDay(subDays(today, 29 - i)));

      const performanceByDay: Record<string, { user: number; market: number }> = {};

      // Inicializar com 0%
      last30Days.forEach((day) => {
        const dateKey = format(day, 'MMM dd');
        performanceByDay[dateKey] = { user: 0, market: 0 };
      });

      // Calcular rentabilidade do usuário por dia
      let cumulativePnL = 0;
      closedTrades?.forEach((trade) => {
        if (trade.closedAt) {
          const tradeDate = format(new Date(trade.closedAt), 'MMM dd');
          if (performanceByDay[tradeDate]) {
            cumulativePnL += trade.pnl || 0;
            const returnPercent = (cumulativePnL / initialBalance) * 100;
            performanceByDay[tradeDate].user = returnPercent;
          }
        }
      });

      // Simular rentabilidade do mercado (Ibovespa) - crescimento mais lento
      let marketCumulativeReturn = 0;
      last30Days.forEach((day, index) => {
        const dateKey = format(day, 'MMM dd');
        // Simular crescimento de 0.5% ao dia em média
        marketCumulativeReturn += 0.5 + (Math.random() - 0.5) * 0.3;
        if (performanceByDay[dateKey]) {
          performanceByDay[dateKey].market = marketCumulativeReturn;
        }
      });

      // Converter para array
      const chartData = last30Days.map((day) => ({
        date: format(day, 'MMM dd'),
        ...performanceByDay[format(day, 'MMM dd')],
      }));

      setData(chartData);
      setIsLoading(false);
    }
  }, [closedTrades, portfolio, tradesLoading, portfolioLoading]);

  if (isLoading || tradesLoading || portfolioLoading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Você vs Mercado</h3>
          <p className="text-sm text-slate-400 mt-1">Rentabilidade comparativa (%)</p>
        </div>
        <div className="flex justify-center items-center h-80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white">Você vs Mercado</h3>
          <p className="text-sm text-slate-400 mt-1">Rentabilidade comparativa (%)</p>
        </div>
        <div className="flex justify-center items-center h-80">
          <p className="text-sm text-muted-foreground">Nenhum dado disponível ainda</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Você vs Mercado</h3>
        <p className="text-sm text-slate-400 mt-1">Rentabilidade comparativa (%) - Últimos 30 dias</p>
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
            stroke="#3b82f6"
            strokeWidth={2}
            name="Sua Carteira"
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="market"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Ibovespa"
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
