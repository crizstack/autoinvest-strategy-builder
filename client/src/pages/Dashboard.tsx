import { useAuth } from '@/_core/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, BarChart3, Zap, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Dashboard() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">
          Bem-vindo, {user?.name || user?.email}!
        </h1>
        <p className="text-slate-400">
          Plano: <span className="text-blue-400 font-semibold">{user?.planId ? 'Pro' : 'Free'}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {/* Saldo Simulado */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Saldo Simulado</h3>
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">R$ 10.000,00</p>
          <p className="text-xs text-slate-500 mt-2">Capital inicial</p>
        </Card>

        {/* Rentabilidade */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Rentabilidade</h3>
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-400">+12.5%</p>
          <p className="text-xs text-slate-500 mt-2">Últimos 30 dias</p>
        </Card>

        {/* Estratégias Ativas */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Estratégias Ativas</h3>
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-slate-500 mt-2">Nenhuma em execução</p>
        </Card>

        {/* Operações */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-sm font-medium">Operações</h3>
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">0</p>
          <p className="text-xs text-slate-500 mt-2">Nenhuma operação</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Create Strategy */}
        <Card className="p-8 bg-gradient-to-br from-blue-600/20 to-blue-600/5 border-blue-600/30 hover:border-blue-600/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-600/30 flex items-center justify-center">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">Criar Estratégia</h3>
              <p className="text-sm text-slate-400">Comece com o builder visual</p>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
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

      {/* Recent Activity */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-4">Atividade Recente</h2>
        <div className="text-center py-8">
          <p className="text-slate-400">Nenhuma atividade ainda</p>
          <p className="text-sm text-slate-500 mt-2">Crie sua primeira estratégia para começar</p>
        </div>
      </Card>

      {/* Upgrade CTA */}
      {!user?.planId && (
        <div className="mt-8 p-6 rounded-lg border border-amber-600/30 bg-amber-600/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Upgrade para Pro</h3>
              <p className="text-sm text-slate-400">
                Desbloqueie estratégias ilimitadas, backtest completo e dados em tempo real
              </p>
            </div>
            <Button className="bg-amber-600 hover:bg-amber-700 flex items-center gap-2">
              Upgrade Agora
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
