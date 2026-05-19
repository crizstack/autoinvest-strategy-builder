import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TradeLogDetail } from '@/components/TradeLogDetail';
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
// TradeLog types
type IndicatorType = 'RSI' | 'MACD' | 'Bollinger' | 'MA' | 'Stochastic';

interface IndicatorSignal {
  name: string;
  value: number;
  threshold?: number;
  condition: string;
  strength: 'weak' | 'medium' | 'strong';
}

interface TradeExplanation {
  entryReason: string;
  entryIndicators: IndicatorSignal[];
  entryConfidence: number;
  exitReason: string;
  exitIndicators: IndicatorSignal[];
  exitType: string;
  marketContext: string;
  riskReward: number;
  notes: string;
}

interface TradeLog {
  id: string;
  strategyId: string;
  symbol: string;
  signal: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  result: number;
  resultPercent: number;
  entryTime: Date;
  exitTime?: Date;
  indicator: IndicatorType;
  explanation: TradeExplanation;
  status?: 'open' | 'closed';
  tags?: string[];
  confidence?: number;
  duration?: number;
}

// Mock data
const MOCK_TRADES: TradeLog[] = [
  {
    id: '1',
    strategyId: 'strategy-1',
    symbol: 'PETR4',
    signal: 'BUY',
    quantity: 100,
    entryPrice: 28.50,
    exitPrice: 29.35,
    result: 850,
    resultPercent: 2.98,
    entryTime: new Date('2024-01-15T10:30:00'),
    exitTime: new Date('2024-01-15T14:20:00'),
    indicator: 'RSI',
    duration: 230,
    explanation: {
      entryReason: 'Compra executada porque RSI caiu abaixo de 30, indicando sobrevenda',
      entryIndicators: [
        {
          name: 'RSI',
          value: 28,
          threshold: 30,
          condition: 'RSI < 30',
          strength: 'strong',
        },
      ],
      entryConfidence: 85,
      exitReason: 'Venda executada porque MACD cruzou acima da linha de sinal',
      exitIndicators: [
        {
          name: 'MACD',
          value: 0.15,
          condition: 'MACD > Signal',
          strength: 'medium',
        },
      ],
      exitType: 'signal',
      marketContext: 'mercado em alta, com tendência clara',
      riskReward: 2.5,
      notes: 'Operação bem executada com confirmação de múltiplos indicadores',
    },
    status: 'closed',
    tags: ['high-confidence', 'morning-trade'],
    confidence: 85,
  },
  {
    id: '2',
    strategyId: 'strategy-1',
    symbol: 'VALE3',
    signal: 'SELL',
    quantity: 150,
    indicator: 'MACD',
    entryPrice: 29.10,
    exitPrice: 28.20,
    result: 1245,
    resultPercent: 3.09,
    entryTime: new Date('2024-01-15T11:45:00'),
    exitTime: new Date('2024-01-15T15:30:00'),
    duration: 225,
    explanation: {
      entryReason: 'Venda porque Bandas de Bollinger indicaram preço em zona de resistência',
      entryIndicators: [
        {
          name: 'Bollinger Bands',
          value: 29.15,
          condition: 'Preço > Banda Superior',
          strength: 'strong',
        },
      ],
      entryConfidence: 78,
      exitReason: 'Saída por meta de lucro atingida',
      exitIndicators: [],
      exitType: 'profit_target',
      marketContext: 'mercado em consolidação, volatilidade média',
      riskReward: 2.1,
      notes: '',
    },
    status: 'closed',
    tags: ['profit-target', 'afternoon-trade'],
    confidence: 78,
  },
  {
    id: '3',
    strategyId: 'strategy-1',
    symbol: 'ITUB4',
    signal: 'BUY',
    quantity: 80,
    entryPrice: 28.20,
    result: -160,
    resultPercent: -0.71,
    entryTime: new Date('2024-01-15T13:20:00'),
    indicator: 'MA',
    status: 'closed',
    tags: ['stop-loss', 'weak-signal'],
    confidence: 42,
    explanation: {
      entryReason: 'Compra porque Moving Average de 20 cruzou acima da de 50',
      entryIndicators: [
        {
          name: 'Moving Average',
          value: 28.15,
          condition: 'MA20 > MA50',
          strength: 'weak',
        },
      ],
      entryConfidence: 42,
      exitReason: 'Stop loss acionado para proteção',
      exitIndicators: [],
      exitType: 'stop_loss',
      marketContext: 'mercado em alta volatilidade',
      riskReward: 1.2,
      notes: 'Sinal fraco que resultou em perda rápida',
    },
  },
];

export default function TradeHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState<IndicatorType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  const [filterResult, setFilterResult] = useState<'all' | 'profit' | 'loss'>('all');

  // Indicadores únicos
  const indicators = useMemo(() => {
    const set = new Set<IndicatorType>();
    MOCK_TRADES.forEach((trade) => {
      trade.explanation.entryIndicators.forEach((ind: any) => set.add(ind.name));
    });
    return Array.from(set).sort();
  }, []);

  // Filtrar trades
  const filteredTrades = useMemo(() => {
    return MOCK_TRADES.filter((trade: TradeLog) => {
      // Busca por símbolo
      if (searchTerm && !trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro por indicador
      if (selectedIndicator !== 'all') {
        const hasIndicator = trade.explanation.entryIndicators.some(
          (ind) => ind.name === selectedIndicator
        );
        if (!hasIndicator) return false;
      }

      // Filtro por status
      if (filterStatus !== 'all' && trade.status !== filterStatus) {
        return false;
      }

      // Filtro por resultado
      if (filterResult === 'profit' && trade.result <= 0) return false;
      if (filterResult === 'loss' && trade.result > 0) return false;

      return true;
    });
  }, [searchTerm, selectedIndicator, filterStatus, filterResult]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const trades = filteredTrades;
    const winning = trades.filter((t) => t.result > 0).length;
    const losing = trades.filter((t) => t.result < 0).length;
    const totalProfit = trades.reduce((sum, t) => sum + t.result, 0);
    const avgConfidence =
      trades.length > 0 ? Math.round(trades.reduce((sum, t) => sum + (t.confidence || 0), 0) / trades.length) : 0;

    return {
      total: trades.length,
      winning,
      losing,
      winRate: trades.length > 0 ? Math.round((winning / trades.length) * 100) : 0,
      totalProfit,
      avgConfidence,
    };
  }, [filteredTrades]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Histórico de Operações</h1>
        <p className="text-slate-400">Visualize detalhes completos de cada trade com explicações claras</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Total de Trades</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </Card>

        <Card className="p-4 bg-green-600/10 border-green-600/30">
          <p className="text-green-400 text-sm mb-1">Vencedores</p>
          <p className="text-2xl font-bold text-green-400">{stats.winning}</p>
        </Card>

        <Card className="p-4 bg-red-600/10 border-red-600/30">
          <p className="text-red-400 text-sm mb-1">Perdedores</p>
          <p className="text-2xl font-bold text-red-400">{stats.losing}</p>
        </Card>

        <Card className="p-4 bg-blue-600/10 border-blue-600/30">
          <p className="text-blue-400 text-sm mb-1">Taxa de Acerto</p>
          <p className="text-2xl font-bold text-blue-400">{stats.winRate}%</p>
        </Card>

        <Card className="p-4 bg-purple-600/10 border-purple-600/30">
          <p className="text-purple-400 text-sm mb-1">Lucro Total</p>
          <p className={`text-2xl font-bold ${stats.totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
            R$ {stats.totalProfit.toLocaleString('pt-BR')}
          </p>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <div className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por símbolo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Indicador */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Indicador</label>
              <select
                value={selectedIndicator}
                onChange={(e) => setSelectedIndicator(e.target.value as IndicatorType | 'all')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white"
              >
                <option value="all">Todos</option>
                {indicators.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'open' | 'closed')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white"
              >
                <option value="all">Todos</option>
                <option value="open">Abertos</option>
                <option value="closed">Fechados</option>
              </select>
            </div>

            {/* Resultado */}
            <div>
              <label className="text-xs text-slate-400 mb-2 block">Resultado</label>
              <select
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value as 'all' | 'profit' | 'loss')}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-md text-sm text-white"
              >
                <option value="all">Todos</option>
                <option value="profit">Lucro</option>
                <option value="loss">Perda</option>
              </select>
            </div>

            {/* Limpar filtros */}
            <div className="flex items-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedIndicator('all');
                  setFilterStatus('all');
                  setFilterResult('all');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Lista de Trades */}
      <div className="space-y-3">
        {filteredTrades.length === 0 ? (
          <Card className="p-8 bg-slate-900/50 border-slate-800 text-center">
            <p className="text-slate-400">Nenhum trade encontrado com os filtros selecionados</p>
          </Card>
        ) : (
          filteredTrades.map((trade) => <TradeLogDetail key={trade.id} trade={trade} />)
        )}
      </div>

      {/* Insights */}
      {filteredTrades.length > 0 && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Indicador Mais Lucrativo</p>
              <p className="text-white font-semibold">RSI (85% de acerto)</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Melhor Horário</p>
              <p className="text-white font-semibold">10:00 - 12:00 (3 trades, 100% acerto)</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Ativo Mais Lucrativo</p>
              <p className="text-white font-semibold">VALE3 (R$ 1.245 de lucro)</p>
            </div>
            <div className="p-4 bg-slate-950 rounded-lg">
              <p className="text-slate-400 text-sm mb-2">Confiança Média</p>
              <p className="text-white font-semibold">{stats.avgConfidence}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
