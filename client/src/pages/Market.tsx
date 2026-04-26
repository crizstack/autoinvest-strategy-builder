import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Search, TrendingUp, TrendingDown, Eye, RefreshCw } from 'lucide-react';
import { useMultipleQuotes } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';

// Lista de ativos B3 principais
const MAIN_ASSETS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'BBAS3', 'WEGE3', 'MGLU3'];

export default function Market() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'variation' | 'volume'>('code');
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);

  const { quotes, loading, error, refresh } = useMultipleQuotes([...MAIN_ASSETS, ...customSymbols]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Filtrar e ordenar ativos
  const filteredAssets = useMemo(() => {
    let filtered = quotes.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    if (sortBy === 'variation') {
      filtered.sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
    } else if (sortBy === 'volume') {
      filtered.sort((a, b) => b.regularMarketVolume - a.regularMarketVolume);
    } else {
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return filtered;
  }, [searchTerm, sortBy, quotes]);

  // Calcular top gainers e losers
  const topMovers = useMemo(() => {
    const sorted = [...quotes].sort(
      (a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent
    );
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, [quotes]);

  // Adicionar ativo customizado
  const handleAddAsset = (symbol: string) => {
    const upperSymbol = symbol.toUpperCase();
    if (!customSymbols.includes(upperSymbol) && !MAIN_ASSETS.includes(upperSymbol)) {
      setCustomSymbols([...customSymbols, upperSymbol]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mercado</h1>
          <p className="text-slate-400">Acompanhe os principais ativos da B3 em tempo real</p>
        </div>
        <Button
          onClick={refresh}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Top Movers */}
      {!loading && quotes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Maiores Altas */}
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Maiores Altas
            </h3>
            <div className="space-y-3">
              {topMovers.gainers.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.symbol}</p>
                    <p className="text-sm text-slate-400">{formatCurrency(asset.regularMarketPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">+{asset.regularMarketChangePercent.toFixed(2)}%</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Maiores Quedas */}
          <Card className="p-6 bg-slate-900/50 border-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Maiores Quedas
            </h3>
            <div className="space-y-3">
              {topMovers.losers.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.symbol}</p>
                    <p className="text-sm text-slate-400">{formatCurrency(asset.regularMarketPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-semibold">{asset.regularMarketChangePercent.toFixed(2)}%</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Busca e Filtros */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar ativo (ex: PETR4, Vale)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-950 border-slate-800 text-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-950 border border-slate-800 text-white rounded-lg"
          >
            <option value="code">Ordenar por: Código</option>
            <option value="variation">Ordenar por: Variação</option>
            <option value="volume">Ordenar por: Volume</option>
          </select>
        </div>

        {/* Tabela de Ativos */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Código</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Nome</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Preço</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Variação</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Máxima</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Mínima</th>
                <th className="text-left py-3 px-4 text-slate-400 font-medium">Volume</th>
                <th className="text-center py-3 px-4 text-slate-400 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                // Skeleton loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20 bg-slate-800" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-8 w-8 bg-slate-800 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => {
                  const isPositive = asset.regularMarketChangePercent >= 0;

                  return (
                    <tr
                      key={asset.symbol}
                      className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-semibold">{asset.symbol}</td>
                      <td className="py-3 px-4 text-slate-300">{asset.name}</td>
                      <td className="py-3 px-4 text-white">{formatCurrency(asset.regularMarketPrice)}</td>
                      <td className={`py-3 px-4 font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{asset.regularMarketChangePercent.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-slate-300">{formatCurrency(asset.regularMarketDayHigh)}</td>
                      <td className="py-3 px-4 text-slate-300">{formatCurrency(asset.regularMarketDayLow)}</td>
                      <td className="py-3 px-4 text-slate-300">{formatNumber(asset.regularMarketVolume)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Nenhum ativo encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Timestamp da última atualização */}
        {!loading && quotes.length > 0 && (
          <p className="text-xs text-slate-500 mt-4">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
