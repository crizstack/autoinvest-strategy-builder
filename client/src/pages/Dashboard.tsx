import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Zap, ArrowRight, Target, Flame, Loader, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import BalanceChart from '@/components/dashboard/BalanceChart';
import ProfitabilityChart from '@/components/dashboard/ProfitabilityChart';
import PerformanceComparison from '@/components/dashboard/PerformanceComparison';
import HeatmapWidget from '@/components/dashboard/HeatmapWidget';
import TopStrategiesWidget from '@/components/dashboard/TopStrategiesWidget';
import MarketTodayWidget from '@/components/dashboard/MarketTodayWidget';
import WatchlistWidget from '@/components/dashboard/WatchlistWidget';
import OpenPositionsWidget from '@/components/dashboard/OpenPositionsWidget';
import { TradeHistoryWidget } from '@/components/dashboard/TradeHistoryWidget';
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
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    balance: 0,
    initialBalance: 0,
    totalReturn: 0,
    activeStrategies: 0,
    winRate: 0,
    totalTrades: 0,
    profitFactor: 0,
  });

  // Buscar portfolio com refetch automático a cada 30 segundos
  const { data: portfolio, isLoading: portfolioLoading, error: portfolioError } = trpc.portfolio.getPortfolio.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000,
  });

  // Buscar estatísticas de trades com refetch automático a cada 30 segundos
  const { data: tradeStats, isLoading: tradeStatsLoading, error: tradeStatsError } = trpc.paperTrading.getTradeStats.useQuery(undefined, {
    retry: 1,
    refetchInterval: 30000,
  });

  // Buscar estratégias com refetch automático a cada 60 segundos
  const { data: strategies, isLoading: strategiesLoading, error: strategiesError } = trpc.strategies.list.useQuery(undefined, {
    retry: 1,
    refetchInterval: 60000,
  });

  // Atualizar métricas quando dados chegam
  useEffect(() => {
    if (portfolio && tradeStats && strategies) {
      const activeStrategies = strategies.filter((s) => s.status === 'active').length;
      const balance = Number(portfolio.currentBalance) || 0;
      const initialBalance = Number(portfolio.initialBalance) || 0;
      const totalReturn = initialBalance > 0 ? ((balance - initialBalance) / initialBalance) * 100 : 0;

      setMetrics({
        balance,
        initialBalance,
        totalReturn,
        activeStrategies,
        winRate: tradeStats.winRate || 0,
        totalTrades: tradeStats.totalTrades || 0,
        profitFactor: tradeStats.profitFactor || 0,
      });
    }
  }, [portfolio, tradeStats, strategies]);

  const isLoading = portfolioLoading || tradeStatsLoading || strategiesLoading;
  const hasError = portfolioError || tradeStatsError || strategiesError;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Bem-vindo, {user?.name || user?.email}!
        </h1>
        <p className="text-[#B8C2B8]">
          Plano: <span className="text-[#76E821] font-semibold">{user?.planId ? 'Pro' : 'Free'}</span>
        </p>
      </div>

      {/* Error Alert */}
      {hasError && (
        <Card className="p-4 bg-red-900/20 border-red-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Erro ao carregar dados</p>
            <p className="text-red-300 text-sm">Tentando reconectar...</p>
          </div>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Saldo */}
        <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-colors relative">
          {portfolioLoading && (
            <div className="absolute inset-0 bg-[#0B110B]/50 rounded-lg flex items-center justify-center">
              <Loader className="w-5 h-5 text-[#76E821] animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#B8C2B8] text-sm font-medium">Saldo</h3>
            <div className="w-10 h-10 rounded-lg bg-[#38A636]/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#76E821]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            {portfolio?.currentBalance ? `R$ ${Number(portfolio.currentBalance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {metrics.totalReturn > 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-[#76E821]" />
                <p className="text-sm text-[#76E821]">+{metrics.totalReturn.toFixed(2)}%</p>
              </>
            ) : metrics.totalReturn < 0 ? (
              <>
                <TrendingDown className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{metrics.totalReturn.toFixed(2)}%</p>
              </>
            ) : (
              <p className="text-sm text-[#B8C2B8]">0.00%</p>
            )}
          </div>
        </Card>

        {/* Rentabilidade */}
        <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-colors relative">
          {tradeStatsLoading && (
            <div className="absolute inset-0 bg-[#0B110B]/50 rounded-lg flex items-center justify-center">
              <Loader className="w-5 h-5 text-[#76E821] animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#B8C2B8] text-sm font-medium">Rentabilidade</h3>
            <div className="w-10 h-10 rounded-lg bg-[#38A636]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#76E821]" />
            </div>
          </div>
          <p className={`text-3xl font-bold ${metrics.totalReturn > 0 ? 'text-[#76E821]' : metrics.totalReturn < 0 ? 'text-red-400' : 'text-[#B8C2B8]'}`}>
            {metrics.totalReturn !== 0 ? `${metrics.totalReturn > 0 ? '+' : ''}${metrics.totalReturn.toFixed(2)}%` : '-'}
          </p>
          <p className="text-xs text-[#6B756B] mt-3">Desde o início</p>
        </Card>

        {/* Estratégias Ativas */}
        <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-colors relative">
          {strategiesLoading && (
            <div className="absolute inset-0 bg-[#0B110B]/50 rounded-lg flex items-center justify-center">
              <Loader className="w-5 h-5 text-[#76E821] animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#B8C2B8] text-sm font-medium">Estratégias Ativas</h3>
            <div className="w-10 h-10 rounded-lg bg-[#235317]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#76E821]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{metrics.activeStrategies}</p>
          <p className="text-xs text-[#6B756B] mt-3">Em execução</p>
        </Card>

        {/* Taxa de Acerto */}
        <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 hover:border-[#235317]/45 transition-colors relative">
          {tradeStatsLoading && (
            <div className="absolute inset-0 bg-[#0B110B]/50 rounded-lg flex items-center justify-center">
              <Loader className="w-5 h-5 text-[#76E821] animate-spin" />
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#B8C2B8] text-sm font-medium">Taxa de Acerto</h3>
            <div className="w-10 h-10 rounded-lg bg-[#38A636]/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#76E821]" />
            </div>
          </div>
          <p className="text-3xl font-bold text-[#76E821]">{metrics.totalTrades > 0 ? `${metrics.winRate.toFixed(1)}%` : '-'}</p>
          <p className="text-xs text-[#6B756B] mt-3">{metrics.totalTrades} operações</p>
        </Card>
      </div>

      {/* Open Positions */}
      <OpenPositionsWidget />

      {/* Charts Grid */}
      <div className="grid md:grid-cols-4 gap-6">
        <BalanceChart />
        <ProfitabilityChart />
      </div>

      {/* Performance Comparison */}
      <div className="grid md:grid-cols-4 gap-6">
        <PerformanceComparison />
      </div>

      {/* Trade History */}
      <TradeHistoryWidget />

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
        <Card className="p-8 bg-gradient-to-br from-[#235317]/20 to-[#76E821]/5 border-[#38A636]/30 hover:border-[#38A636]/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#38A636]/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#76E821]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Criar Estratégia</h3>
              <p className="text-sm text-[#B8C2B8]">Comece com o builder visual</p>
            </div>
            <Button
              className="bg-[#38A636] hover:bg-[#4CB22F]"
              onClick={() => setLocation('/estrategias')}
            >
              Criar
            </Button>
          </div>
        </Card>

        {/* View Strategies */}
        <Card className="p-8 bg-gradient-to-br from-[#141C14]/50 to-[#141C14]/20 border-[#235317]/35 hover:border-[#235317]/45 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-[#1D2A1D]/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#B8C2B8]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Minhas Estratégias</h3>
              <p className="text-sm text-[#B8C2B8]">Gerenciar estratégias existentes</p>
            </div>
            <Button
              variant="outline"
              className="border-[#235317]/45"
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
                <p className="text-sm text-[#B8C2B8]">Desbloqueie recursos avançados</p>
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
