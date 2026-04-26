import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { mockAssets, mockPriceHistory, calculateVariation, formatCurrency, formatNumber } from '@/data/mockMarketData';

export default function AssetDetail() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1M');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Extrair código do ativo da URL
  const assetCode = window.location.pathname.split('/').pop()?.toUpperCase() || '';
  const asset = mockAssets.find((a) => a.code === assetCode);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-slate-400 mb-4">Ativo não encontrado</p>
        <Button onClick={() => setLocation('/mercado')} className="bg-blue-600 hover:bg-blue-700">
          Voltar para Mercado
        </Button>
      </div>
    );
  }

  const variation = calculateVariation(asset);
  const isPositive = variation >= 0;
  const priceHistory = mockPriceHistory[asset.code] || [];

  // Filtrar dados por período
  const filteredData = useMemo(() => {
    const daysMap = { '1D': 1, '5D': 5, '1M': 30, '6M': 180, '1Y': 252 };
    const days = daysMap[period];
    return priceHistory.slice(-days);
  }, [period, priceHistory]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;

    const closes = filteredData.map((d) => d.close);
    const highest = Math.max(...closes);
    const lowest = Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;

    return { highest, lowest, avgPrice };
  }, [filteredData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setLocation('/mercado')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-white">{asset.code}</h1>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full">
              {asset.sector}
            </span>
          </div>
          <p className="text-slate-400">{asset.name}</p>
        </div>
      </div>

      {/* Preço e Variação */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-slate-400 text-sm mb-2">Preço Atual</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(asset.currentPrice)}</p>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isPositive ? 'bg-green-600/20' : 'bg-red-600/20'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
              {isPositive ? '+' : ''}{variation.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Dados Adicionais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-950/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">Abertura</p>
            <p className="text-white font-semibold">{formatCurrency(asset.currentPrice * 0.98)}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">Máxima</p>
            <p className="text-white font-semibold">{formatCurrency(asset.dayHigh)}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">Mínima</p>
            <p className="text-white font-semibold">{formatCurrency(asset.dayLow)}</p>
          </div>
          <div className="p-3 bg-slate-950/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">Volume</p>
            <p className="text-white font-semibold">{formatNumber(asset.volume)}</p>
          </div>
        </div>

        {/* Botão Criar Estratégia */}
        <Button
          onClick={() => setLocation(`/estrategias/builder?asset=${asset.code}`)}
          className="mt-6 bg-blue-600 hover:bg-blue-700 w-full flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Criar Estratégia com {asset.code}
        </Button>
      </Card>

      {/* Gráfico */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Gráfico de Preço</h2>
          <div className="flex gap-2">
            {(['1D', '5D', '1M', '6M', '1Y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Gráfico de Linha */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value: any) => formatCurrency(value)}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Estatísticas do Período */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Máxima do Período</p>
              <p className="text-white font-semibold">{formatCurrency(stats.highest)}</p>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Mínima do Período</p>
              <p className="text-white font-semibold">{formatCurrency(stats.lowest)}</p>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Preço Médio</p>
              <p className="text-white font-semibold">{formatCurrency(stats.avgPrice)}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Volume */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h2 className="text-xl font-semibold text-white mb-6">Volume de Negociação</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={filteredData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value: any) => formatNumber(value)}
            />
            <Bar dataKey="volume" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
