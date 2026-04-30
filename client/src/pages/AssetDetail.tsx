import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { useQuote, useHistory } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';

export default function AssetDetail() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<'1d' | '5d' | '1mo' | '6mo' | '1y'>('1mo');

  // Extrair código do ativo da URL
  const assetCode = window.location.pathname.split('/').pop()?.toUpperCase() || '';
  const { quote, loading: quoteLoading, error: quoteError, refresh: refreshQuote, isRefreshing: quoteRefreshing } = useQuote(assetCode);
  const { history, loading: historyLoading, error: historyError, refresh: refreshHistory, isRefreshing: historyRefreshing } = useHistory(assetCode, period);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (!quote && !quoteLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-slate-400 mb-4">Ativo não encontrado</p>
        <Button onClick={() => setLocation('/mercado')} className="bg-green-600 hover:bg-green-700">
          Voltar para Mercado
        </Button>
      </div>
    );
  }

  const isPositive = (quote?.regularMarketChangePercent || 0) >= 0;
  const priceData = history?.prices || [];

  // Calcular estatísticas
  const stats = useMemo(() => {
    if (priceData.length === 0) return null;

    const closes = priceData.map((d) => d.close);
    const highest = Math.max(...closes);
    const lowest = Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;

    return { highest, lowest, avgPrice };
  }, [priceData]);

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
          {quoteLoading ? (
            <>
              <Skeleton className="h-8 w-32 bg-slate-800 mb-2" />
              <Skeleton className="h-4 w-24 bg-slate-800" />
            </>
          ) : quote ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{quote.symbol}</h1>
                {quote.sector && (
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full">
                    {quote.sector}
                  </span>
                )}
              </div>
              <p className="text-slate-400">{quote.name}</p>
            </>
          ) : null}
        </div>
        <Button
          onClick={() => {
            refreshQuote();
            refreshHistory();
          }}
          disabled={quoteRefreshing || historyRefreshing}
          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${quoteRefreshing || historyRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Erros */}
      {quoteError && (
        <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400">
          {quoteError}
        </div>
      )}

      {/* Preço e Variação */}
      {quoteLoading ? (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <Skeleton className="h-12 w-32 bg-slate-800 mb-4" />
          <Skeleton className="h-8 w-24 bg-slate-800" />
        </Card>
      ) : quote ? (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-2">Preço Atual</p>
              <p className="text-4xl font-bold text-white">{formatCurrency(quote.regularMarketPrice)}</p>
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
                {isPositive ? '+' : ''}{quote.regularMarketChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Dados Adicionais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Fechamento Anterior</p>
              <p className="text-white font-semibold">{formatCurrency(quote.regularMarketPreviousClose)}</p>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Máxima do Dia</p>
              <p className="text-white font-semibold">{formatCurrency(quote.regularMarketDayHigh)}</p>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Mínima do Dia</p>
              <p className="text-white font-semibold">{formatCurrency(quote.regularMarketDayLow)}</p>
            </div>
            <div className="p-3 bg-slate-950/50 rounded-lg">
              <p className="text-slate-400 text-sm mb-1">Volume</p>
              <p className="text-white font-semibold">{formatNumber(quote.regularMarketVolume)}</p>
            </div>
          </div>

          {/* Botão Criar Estratégia */}
          <Button
            onClick={() => setLocation(`/estrategias/builder?asset=${quote.symbol}`)}
            className="mt-6 bg-green-600 hover:bg-green-700 w-full flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Criar Estratégia com {quote.symbol}
          </Button>
        </Card>
      ) : null}

      {/* Gráfico */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Gráfico de Preço</h2>
          <div className="flex gap-2">
            {(['1d', '5d', '1mo', '6mo', '1y'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {historyLoading ? (
          <Skeleton className="h-96 w-full bg-slate-800" />
        ) : historyError ? (
          <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400">
            {historyError}
          </div>
        ) : priceData.length > 0 ? (
          <>
            {/* Gráfico de Linha */}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={priceData}>
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
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum dado disponível para este período</p>
          </div>
        )}
      </Card>

      {/* Volume */}
      {priceData.length > 0 && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h2 className="text-xl font-semibold text-white mb-6">Volume de Negociação</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceData}>
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
      )}
    </div>
  );
}
