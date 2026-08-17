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
          <p className="text-[#B8C2B8]">Análise detalhada da estratégia "Cruzamento de Médias"</p>
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
        <Card className="p-6 bg-gradient-to-br from-[#38A636]/10 to-[#76E821]/5 border-[#4CB22F]/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#76E821] text-sm font-semibold">Lucro Total</p>
            <TrendingUp className="w-5 h-5 text-[#76E821]" />
          </div>
          <p className="text-3xl font-bold text-white">R$ 3.800</p>
          <p className="text-[#76E821] text-sm mt-2">+38% do capital inicial</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#235317]/10 to-[#76E821]/5 border-[#4CB22F]/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#76E821] text-sm font-semibold">Sharpe Ratio</p>
            <Zap className="w-5 h-5 text-[#76E821]" />
          </div>
          <p className="text-3xl font-bold text-white">1.85</p>
          <p className="text-[#76E821] text-sm mt-2">Retorno ajustado ao risco</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-[#38A636]/10 to-[#38A636]/5 border-[#4CB22F]/30">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#76E821] text-sm font-semibold">Profit Factor</p>
            <Target className="w-5 h-5 text-[#76E821]" />
          </div>
          <p className="text-3xl font-bold text-white">2.10</p>
          <p className="text-[#76E821] text-sm mt-2">Lucro / Perda</p>
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
        <TabsList className="grid w-full grid-cols-5 bg-[#0B110B]/50 border border-[#235317]/30">
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
            <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas de Risco</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Drawdown Máximo</span>
                  <span className="text-white font-semibold">2.5%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Maior Perda</span>
                  <span className="text-red-400 font-semibold">-R$ 160</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Perdas Consecutivas</span>
                  <span className="text-white font-semibold">1</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Volatilidade</span>
                  <span className="text-white font-semibold">1.2%</span>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
              <h3 className="text-lg font-semibold text-white mb-4">Métricas de Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Total de Trades</span>
                  <span className="text-white font-semibold">5</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Ganhos Consecutivos</span>
                  <span className="text-[#76E821] font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Ganho Médio</span>
                  <span className="text-[#76E821] font-semibold">+R$ 950</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#050805] rounded-lg">
                  <span className="text-[#B8C2B8]">Perda Média</span>
                  <span className="text-red-400 font-semibold">-R$ 160</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Trades Table */}
          <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
            <h3 className="text-lg font-semibold text-white mb-4">Operações Executadas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#235317]/30">
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">#</th>
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">Data</th>
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">Tipo</th>
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">Qtd</th>
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">Preço</th>
                    <th className="text-left py-3 px-4 text-[#B8C2B8]">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRADES.map((trade, idx) => (
                    <tr
                      key={trade.id}
                      className="border-b border-[#235317]/25 hover:bg-[#141C14]/30 cursor-pointer"
                      onClick={() => setSelectedTrade(trade)}
                    >
                      <td className="py-3 px-4 text-white">#{idx + 1}</td>
                      <td className="py-3 px-4 text-white">{trade.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.type === 'BUY'
                              ? 'bg-[#38A636]/20 text-[#76E821]'
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
                          trade.result > 0 ? 'text-[#76E821]' : 'text-red-400'
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
        <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30 border-l-4 border-l-[#4CB22F]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Detalhes da Operação</h3>
            <button
              onClick={() => setSelectedTrade(null)}
              className="text-[#B8C2B8] hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-[#B8C2B8] text-sm">Data</p>
              <p className="text-white font-semibold">{selectedTrade.date}</p>
            </div>
            <div>
              <p className="text-[#B8C2B8] text-sm">Tipo</p>
              <p
                className={`font-semibold ${
                  selectedTrade.type === 'BUY' ? 'text-[#76E821]' : 'text-red-400'
                }`}
              >
                {selectedTrade.type}
              </p>
            </div>
            <div>
              <p className="text-[#B8C2B8] text-sm">Preço</p>
              <p className="text-white font-semibold">R$ {selectedTrade.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[#B8C2B8] text-sm">Resultado</p>
              <p
                className={`font-semibold ${
                  selectedTrade.result > 0 ? 'text-[#76E821]' : 'text-red-400'
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
