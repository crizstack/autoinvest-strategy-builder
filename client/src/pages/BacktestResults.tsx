import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Zap, Download, Share2 } from 'lucide-react';
import { ProfessionalEquityCurve } from '@/components/ProfessionalEquityCurve';
import { StrategyComparison } from '@/components/StrategyComparison';
import { IBOVComparison } from '@/components/IBOVComparison';
import { BacktestReplay } from '@/components/BacktestReplay';

// Mock data
const MOCK_EQUITY_CURVE = [
  { date: '2024-01-01', value: 10000 },
  { date: '2024-01-05', value: 10500 },
  { date: '2024-01-10', value: 10200 },
  { date: '2024-01-15', value: 11200 },
  { date: '2024-01-20', value: 10800 },
  { date: '2024-01-25', value: 12500 },
  { date: '2024-01-30', value: 12300 },
  { date: '2024-02-05', value: 13100 },
  { date: '2024-02-10', value: 12900 },
  { date: '2024-02-15', value: 13800 },
];

const MOCK_IBOV_COMPARISON = [
  { date: '2024-01-01', strategy: 10000, ibov: 10000 },
  { date: '2024-01-05', strategy: 10500, ibov: 10200 },
  { date: '2024-01-10', strategy: 10200, ibov: 10100 },
  { date: '2024-01-15', strategy: 11200, ibov: 10800 },
  { date: '2024-01-20', strategy: 10800, ibov: 10500 },
  { date: '2024-01-25', strategy: 12500, ibov: 11200 },
  { date: '2024-01-30', strategy: 12300, ibov: 11100 },
  { date: '2024-02-05', strategy: 13100, ibov: 11800 },
  { date: '2024-02-10', strategy: 12900, ibov: 11600 },
  { date: '2024-02-15', strategy: 13800, ibov: 12200 },
];

const MOCK_TRADES = [
  { id: 1, date: '2024-01-15', type: 'BUY' as const, quantity: 100, price: 28.50, result: 850 },
  { id: 2, date: '2024-01-18', type: 'SELL' as const, quantity: 100, price: 29.35, result: 850 },
  { id: 3, date: '2024-01-22', type: 'BUY' as const, quantity: 150, price: 27.80, result: 1245 },
  { id: 4, date: '2024-01-25', type: 'SELL' as const, quantity: 150, price: 29.10, result: 1245 },
  { id: 5, date: '2024-01-28', type: 'BUY' as const, quantity: 80, price: 28.20, result: -160 },
];

const MOCK_STRATEGIES = [
  {
    name: 'Cruzamento de Médias',
    totalProfit: 3800,
    winRate: 80,
    sharpeRatio: 1.85,
    profitFactor: 2.1,
    maxDrawdown: 2.5,
    totalTrades: 5,
  },
  {
    name: 'RSI Extremo',
    totalProfit: 2500,
    winRate: 70,
    sharpeRatio: 1.45,
    profitFactor: 1.8,
    maxDrawdown: 3.2,
    totalTrades: 7,
  },
  {
    name: 'MACD Signal',
    totalProfit: 3200,
    winRate: 75,
    sharpeRatio: 1.65,
    profitFactor: 1.95,
    maxDrawdown: 2.8,
    totalTrades: 6,
  },
];

export default function BacktestResults() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [selectedTrade, setSelectedTrade] = useState<any>(null);

  const handleExportPDF = () => {
    // TODO: Implementar exportação de PDF
    console.log('Exportar PDF');
  };

  const handleShare = () => {
    // TODO: Implementar compartilhamento
    console.log('Compartilhar resultados');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Resultados do Backtest</h1>
          <p className="text-slate-400">Análise detalhada da estratégia "Cruzamento de Médias"</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-400 text-sm font-semibold">Lucro Total</p>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-bold text-white">R$ 3.800</p>
          <p className="text-green-400 text-sm mt-2">+38% do capital inicial</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-400 text-sm font-semibold">Sharpe Ratio</p>
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white">1.85</p>
          <p className="text-blue-400 text-sm mt-2">Retorno ajustado ao risco</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-400 text-sm font-semibold">Profit Factor</p>
            <Target className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-white">2.10</p>
          <p className="text-purple-400 text-sm mt-2">Lucro / Perda</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-amber-400 text-sm font-semibold">Taxa de Acerto</p>
            <TrendingUp className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">80%</p>
          <p className="text-amber-400 text-sm mt-2">4 de 5 trades vencedores</p>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 border border-slate-800">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="equity">Equity Curve</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="ibov">vs IBOV</TabsTrigger>
          <TabsTrigger value="replay">Replay</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Detailed Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas de Risco</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Drawdown Máximo</span>
                  <span className="text-white font-semibold">2.5%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Maior Perda</span>
                  <span className="text-red-400 font-semibold">-R$ 160</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Perdas Consecutivas</span>
                  <span className="text-white font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Volatilidade</span>
                  <span className="text-white font-semibold">1.2%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-slate-900/50 border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas de Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Total de Trades</span>
                  <span className="text-white font-semibold">5</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Ganhos Consecutivos</span>
                  <span className="text-green-400 font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Ganho Médio</span>
                  <span className="text-green-400 font-semibold">+R$ 950</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg">
                  <span className="text-slate-400">Perda Média</span>
                  <span className="text-red-400 font-semibold">-R$ 160</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Trades Table */}
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Operações Executadas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400">#</th>
                    <th className="text-left py-3 px-4 text-slate-400">Data</th>
                    <th className="text-left py-3 px-4 text-slate-400">Tipo</th>
                    <th className="text-left py-3 px-4 text-slate-400">Qtd</th>
                    <th className="text-left py-3 px-4 text-slate-400">Preço</th>
                    <th className="text-left py-3 px-4 text-slate-400">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRADES.map((trade, idx) => (
                    <tr
                      key={trade.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <td className="py-3 px-4 text-white">#{idx + 1}</td>
                      <td className="py-3 px-4 text-white">{trade.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'BUY'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-red-600/20 text-red-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-white">{trade.quantity}</td>
                      <td className="py-3 px-4 text-white">R$ {trade.price.toFixed(2)}</td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          trade.result > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {trade.result > 0 ? '+' : ''}R$ {trade.result.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* Equity Curve Tab */}
        <TabsContent value="equity">
          <ProfessionalEquityCurve
            data={MOCK_EQUITY_CURVE}
            initialCapital={10000}
            showDrawdown={true}
            showMonthlyReturns={true}
          />
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <StrategyComparison strategies={MOCK_STRATEGIES} />
        </TabsContent>

        {/* IBOV Comparison Tab */}
        <TabsContent value="ibov">
          <IBOVComparison
            data={MOCK_IBOV_COMPARISON}
            strategyName="Cruzamento de Médias"
            strategyReturn={38}
            ibovReturn={22}
            outperformance={16}
          />
        </TabsContent>

        {/* Replay Tab */}
        <TabsContent value="replay">
          <BacktestReplay
            trades={MOCK_TRADES}
            equityCurve={MOCK_EQUITY_CURVE}
            onTradeSelect={setSelectedTrade}
          />
        </TabsContent>
      </Tabs>

      {/* Selected Trade Details */}
      {selectedTrade && (
        <Card className="p-6 bg-slate-900/50 border-slate-800 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Detalhes da Operação</h3>
            <button
              onClick={() => setSelectedTrade(null)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Data</p>
              <p className="text-white font-semibold">{selectedTrade.date}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tipo</p>
              <p
                className={`font-semibold ${
                  selectedTrade.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {selectedTrade.type}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Preço</p>
              <p className="text-white font-semibold">R$ {selectedTrade.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Resultado</p>
              <p
                className={`font-semibold ${
                  selectedTrade.result > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {selectedTrade.result > 0 ? '+' : ''}R$ {selectedTrade.result.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
