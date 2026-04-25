import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';

const MOCK_TRADES = [
  {
    id: 1,
    date: '2024-01-28 14:30',
    strategy: 'Cruzamento de Médias',
    asset: 'PETR4',
    type: 'BUY',
    quantity: 100,
    price: 28.50,
    total: 2850,
    result: 850,
    resultPercent: 2.98,
    status: 'CLOSED',
  },
  {
    id: 2,
    date: '2024-01-27 10:15',
    strategy: 'RSI Extremo',
    asset: 'VALE3',
    type: 'SELL',
    quantity: 50,
    price: 62.30,
    total: 3115,
    result: 620,
    resultPercent: 1.99,
    status: 'CLOSED',
  },
  {
    id: 3,
    date: '2024-01-26 16:45',
    strategy: 'MACD Signal',
    asset: 'ITUB4',
    type: 'BUY',
    quantity: 200,
    price: 11.80,
    total: 2360,
    result: -472,
    resultPercent: -2.0,
    status: 'CLOSED',
  },
  {
    id: 4,
    date: '2024-01-25 09:20',
    strategy: 'Cruzamento de Médias',
    asset: 'BBAS3',
    type: 'SELL',
    quantity: 150,
    price: 32.10,
    total: 4815,
    result: 963,
    resultPercent: 2.0,
    status: 'CLOSED',
  },
  {
    id: 5,
    date: '2024-01-24 13:50',
    strategy: 'RSI Extremo',
    asset: 'ABEV3',
    type: 'BUY',
    quantity: 300,
    price: 13.45,
    total: 4035,
    result: 1210,
    resultPercent: 3.0,
    status: 'CLOSED',
  },
];

export default function Trades() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsset, setFilterAsset] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTrades = MOCK_TRADES.filter((trade) => {
    const matchesSearch =
      trade.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.asset.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAsset = filterAsset === 'all' || trade.asset === filterAsset;
    const matchesStrategy = filterStrategy === 'all' || trade.strategy === filterStrategy;
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;

    return matchesSearch && matchesAsset && matchesStrategy && matchesStatus;
  });

  const assets = Array.from(new Set(MOCK_TRADES.map((t) => t.asset)));
  const strategies = Array.from(new Set(MOCK_TRADES.map((t) => t.strategy)));

  const totalResult = filteredTrades.reduce((sum, t) => sum + t.result, 0);
  const winCount = filteredTrades.filter((t) => t.result > 0).length;
  const winRate = filteredTrades.length > 0 ? ((winCount / filteredTrades.length) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Operações</h1>
        <p className="text-slate-400">Histórico de todas as operações simuladas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Total de Operações</p>
          <p className="text-2xl font-bold text-white">{filteredTrades.length}</p>
        </Card>

        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Resultado Total</p>
          <p className={`text-2xl font-bold ${totalResult > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalResult > 0 ? '+' : ''}R$ {totalResult.toLocaleString('pt-BR')}
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-white">{winRate}%</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label className="text-slate-300 mb-2 block">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                type="text"
                placeholder="Data, estratégia ou ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-950 border-slate-800 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Ativo</Label>
            <select
              value={filterAsset}
              onChange={(e) => setFilterAsset(e.target.value)}
              className="px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              <option value="all">Todos</option>
              {assets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Estratégia</Label>
            <select
              value={filterStrategy}
              onChange={(e) => setFilterStrategy(e.target.value)}
              className="px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              <option value="all">Todas</option>
              {strategies.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {strategy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-slate-300 mb-2 block">Status</Label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
            >
              <option value="all">Todos</option>
              <option value="OPEN">Aberto</option>
              <option value="CLOSED">Fechado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Trades Table */}
      {filteredTrades.length === 0 ? (
        <Card className="p-12 bg-slate-900/50 border-slate-800 text-center">
          <p className="text-slate-400">Nenhuma operação encontrada com os filtros aplicados</p>
        </Card>
      ) : (
        <Card className="p-6 bg-slate-900/50 border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Data</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Estratégia</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Ativo</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Tipo</th>
                  <th className="text-right py-4 px-4 text-slate-400 font-medium">Qtd</th>
                  <th className="text-right py-4 px-4 text-slate-400 font-medium">Preço</th>
                  <th className="text-right py-4 px-4 text-slate-400 font-medium">Total</th>
                  <th className="text-right py-4 px-4 text-slate-400 font-medium">Resultado</th>
                  <th className="text-left py-4 px-4 text-slate-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr key={trade.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-4 text-white">{trade.date}</td>
                    <td className="py-4 px-4 text-white">{trade.strategy}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-medium">
                        {trade.asset}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        {trade.type === 'BUY' ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-400" />
                        )}
                        <span
                          className={`font-medium ${
                            trade.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {trade.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right text-white">{trade.quantity}</td>
                    <td className="py-4 px-4 text-right text-white">R$ {trade.price.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right text-white">R$ {trade.total.toLocaleString('pt-BR')}</td>
                    <td className="py-4 px-4 text-right">
                      <div className={`font-semibold ${trade.result > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.result > 0 ? '+' : ''}R$ {trade.result.toLocaleString('pt-BR')}
                        <div className="text-xs opacity-75">
                          {trade.resultPercent > 0 ? '+' : ''}
                          {trade.resultPercent.toFixed(2)}%
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded bg-blue-600/20 text-blue-400 text-xs font-medium">
                        {trade.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
