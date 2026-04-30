import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const MOCK_STRATEGIES = [
  { id: 1, name: 'Cruzamento de Médias', asset: 'PETR4' },
  { id: 2, name: 'RSI Extremo', asset: 'VALE3' },
  { id: 3, name: 'MACD Signal', asset: 'ITUB4' },
];

const MOCK_EQUITY_CURVE = [
  { date: '01/01', value: 10000 },
  { date: '05/01', value: 10500 },
  { date: '10/01', value: 10200 },
  { date: '15/01', value: 11200 },
  { date: '20/01', value: 10800 },
  { date: '25/01', value: 12500 },
  { date: '30/01', value: 12300 },
];

const MOCK_TRADES = [
  { id: 1, date: '2024-01-15', type: 'BUY', quantity: 100, price: 28.50, result: 850, status: 'CLOSED' },
  { id: 2, date: '2024-01-18', type: 'SELL', quantity: 100, price: 29.35, result: 850, status: 'CLOSED' },
  { id: 3, date: '2024-01-22', type: 'BUY', quantity: 150, price: 27.80, result: 1245, status: 'CLOSED' },
  { id: 4, date: '2024-01-25', type: 'SELL', quantity: 150, price: 29.10, result: 1245, status: 'CLOSED' },
  { id: 5, date: '2024-01-28', type: 'BUY', quantity: 80, price: 28.20, result: -160, status: 'CLOSED' },
];

export default function Backtest() {
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [selectedAsset, setSelectedAsset] = useState('PETR4');
  const [period, setPeriod] = useState('30');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [backTestResult, setBackTestResult] = useState<any>(null);

  const { data: strategies = [] } = trpc.strategies.list.useQuery();

  const handleRunBacktest = async () => {
    if (!selectedStrategy) {
      toast.error('Selecione uma estratégia');
      return;
    }

    setIsRunning(true);

    // Simulate backtest execution
    setTimeout(() => {
      setBackTestResult({
        totalProfit: 3180,
        totalTrades: 5,
        winRate: 80,
        drawdown: 2.5,
        sharpeRatio: 1.85,
        profitFactor: 2.1,
        maxConsecutiveWins: 3,
        maxConsecutiveLosses: 1,
      });
      setIsRunning(false);
      toast.success('Backtest executado com sucesso!');
    }, 2000);
  };

  const assets = ['PETR4', 'VALE3', 'ITUB4', 'BBAS3', 'ABEV3'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Backtesting</h1>
        <p className="text-slate-400">Teste suas estratégias com dados históricos</p>
      </div>

      {/* Configuration Panel */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h2 className="text-lg font-semibold text-white mb-6">Configurar Backtest</h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Strategy Selection */}
          <div>
            <Label className="text-slate-300 mb-2 block">Estratégia</Label>
            <select
              value={selectedStrategy || ''}
              onChange={(e) => setSelectedStrategy(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              <option value="">Selecione uma estratégia</option>
              {strategies.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Selection */}
          <div>
            <Label className="text-slate-300 mb-2 block">Ativo</Label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              {assets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          {/* Period Selection */}
          <div>
            <Label className="text-slate-300 mb-2 block">Período</Label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              <option value="7">7 dias</option>
              <option value="30">30 dias</option>
              <option value="90">90 dias</option>
              <option value="365">1 ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {period === 'custom' && (
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Data Inicial</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Data Final</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Run Button */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleRunBacktest}
            disabled={!selectedStrategy || isRunning}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Executando...' : 'Executar Backtest'}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {backTestResult && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Lucro Total</p>
                  <p className="text-2xl font-bold text-green-400">R$ {backTestResult.totalProfit.toLocaleString('pt-BR')}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Taxa de Acerto</p>
                  <p className="text-2xl font-bold text-green-400">{backTestResult.winRate}%</p>
                </div>
                <Target className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Drawdown Máx</p>
                  <p className="text-2xl font-bold text-amber-400">{backTestResult.drawdown}%</p>
                </div>
                <TrendingDown className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div>
                <p className="text-slate-400 text-sm">Total de Trades</p>
                <p className="text-2xl font-bold text-white">{backTestResult.totalTrades}</p>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div>
                <p className="text-slate-400 text-sm">Sharpe Ratio</p>
                <p className="text-2xl font-bold text-white">{backTestResult.sharpeRatio}</p>
              </div>
            </Card>

            <Card className="p-4 bg-slate-900/50 border-slate-800">
              <div>
                <p className="text-slate-400 text-sm">Profit Factor</p>
                <p className="text-2xl font-bold text-white">{backTestResult.profitFactor}</p>
              </div>
            </Card>
          </div>

          {/* Equity Curve */}
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Curva de Equity</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={MOCK_EQUITY_CURVE}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  dot={{ fill: '#3b82f6' }}
                  name="Saldo"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Trades Table */}
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Operações Simuladas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left py-3 px-4 text-slate-400">Data</th>
                    <th className="text-left py-3 px-4 text-slate-400">Tipo</th>
                    <th className="text-left py-3 px-4 text-slate-400">Qtd</th>
                    <th className="text-left py-3 px-4 text-slate-400">Preço</th>
                    <th className="text-left py-3 px-4 text-slate-400">Resultado</th>
                    <th className="text-left py-3 px-4 text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TRADES.map((trade) => (
                    <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
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
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-600/20 text-green-400">
                          {trade.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!backTestResult && (
        <Card className="p-12 bg-slate-900/50 border-slate-800 text-center">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum backtest executado</h3>
          <p className="text-slate-400">Configure os parâmetros acima e clique em "Executar Backtest"</p>
        </Card>
      )}
    </div>
  );
}
