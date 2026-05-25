import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Zap, ArrowRight, Target, Flame, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import BalanceChart from '@/components/dashboard/BalanceChart';
import ProfitabilityChart from '@/components/dashboard/ProfitabilityChart';
import PerformanceComparison from '@/components/dashboard/PerformanceComparison';
import HeatmapWidget from '@/components/dashboard/HeatmapWidget';
import TopStrategiesWidget from '@/components/dashboard/TopStrategiesWidget';
import MarketTodayWidget from '@/components/dashboard/MarketTodayWidget';
import WatchlistWidget from '@/components/dashboard/WatchlistWidget';
import { trpc } from '@/lib/trpc';

interface DashboardMetrics {
  balance: number;
  initialBalance: number;
  totalReturn: number;
  activeStrategies: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
}

export default function Dashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar portfolio
  const { data: portfolio } = trpc.portfolio.getPortfolio.useQuery();

  // Buscar estatísticas de trades
  const { data: tradeStats } = trpc.paperTrading.getTradeStats.useQuery();

  // Buscar estratégias
  const { data: strategies } = trpc.strategies.list.useQuery();

  // Calcular métricas quando dados chegam
  useEffect(() => {
    if (portfolio && tradeStats && strategies) {
      const activeStrategies = strategies.filter((s) => s.status === 'active').length;
      const balance = Number(portfolio.currentBalance) || 10000;
      const initialBalance = Number(portfolio.initialBalance) || 10000;
      const totalReturn = ((balance - initialBalance) / initialBalance) * 100;

      setMetrics({
        balance,
        initialBalance,
        totalReturn,
        activeStrategies,
        winRate: tradeStats.winRate || 0,
        totalTrades: tradeStats.totalTrades || 0,
        profitFactor: tradeStats.profitFactor || 0,
      });
      setLoading(false);
    }
  }, [portfolio, tradeStats, strategies]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 text-green-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <Card className="p-6 bg-red-900/20 border-red-800">
          <p className="text-red-400">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Bem-vindo, {user?.name || user?.email}!
        </h1>
        <p className="text-slate-400">
          Plano: <span className="text-green-400 font-semibold">{user?.planId ? 'Pro' : 'Free'}</span>
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Saldo */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Saldo</h3>
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {(metrics?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {(metrics?.totalReturn || 0) > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-400" />
                <p className="text-sm text-green-400">+{metrics?.totalReturn.toFixed(2)}%</p>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{metrics?.totalReturn.toFixed(2)}%</p>
              </>
            )}
          </div>
        </Card>

        {/* Rentabilidade */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Rentabilidade</h3>
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${(metrics?.totalReturn || 0) > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {(metrics?.totalReturn || 0) > 0 ? '+' : ''}{metrics?.totalReturn.toFixed(2)}%
          </p>
          <p className="text-xs text-slate-500 mt-3">Desde o início</p>
        </Card>

        {/* Estratégias Ativas */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Estratégias Ativas</h3>
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{metrics?.activeStrategies || 0}</p>
          <p className="text-xs text-slate-500 mt-3">Em execução</p>
        </Card>

        {/* Taxa de Acerto */}
        <Card className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Taxa de Acerto</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-blue-400">{metrics?.winRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-500 mt-3">{metrics?.totalTrades} operações</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <BalanceChart />
        <ProfitabilityChart />
      </div>

      {/* Performance Comparison */}
      <div className="grid md:grid-cols-4 gap-6">
        <PerformanceComparison />
      </div>

      {/* Widgets Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <HeatmapWidget />
        <TopStrategiesWidget />
        <MarketTodayWidget />
        <WatchlistWidget />
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Strategy */}
        <Card className="p-8 bg-gradient-to-br from-green-600/20 to-green-600/5 border-green-600/30 hover:border-green-600/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-600/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Criar Estratégia</h3>
              <p className="text-sm text-slate-400">Comece com o builder visual</p>
            </div>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setLocation('/estrategias')}
            >
              Criar
            </Button>
          </div>
        </Card>

        {/* View Strategies */}
        <Card className="p-8 bg-gradient-to-br from-slate-800/50 to-slate-800/20 border-slate-700/50 hover:border-slate-700 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-slate-700/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-slate-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Minhas Estratégias</h3>
              <p className="text-sm text-slate-400">Gerenciar estratégias existentes</p>
            </div>
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setLocation('/estrategias')}
            >
              Ver
            </Button>
          </div>
        </Card>
      </div>

      {/* Upgrade CTA */}
      {!user?.planId && (
        <Card className="p-6 bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-600/30 flex items-center justify-center">
                <Flame className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Upgrade para Pro</h3>
                <p className="text-sm text-slate-400">Desbloqueie recursos avançados</p>
              </div>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700">
              Upgrade
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
