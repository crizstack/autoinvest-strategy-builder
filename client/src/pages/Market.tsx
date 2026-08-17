import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Search, TrendingUp, TrendingDown, Eye, RefreshCw } from 'lucide-react';
import { useMultipleQuotes } from '@/hooks/useMarketData';
import { Skeleton } from '@/components/ui/skeleton';

const MAIN_ASSETS = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'BBAS3', 'WEGE3', 'MGLU3'];

export default function Market() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'variation' | 'volume'>('code');
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);

  const { quotes, loading, error, refresh, isRefreshing } = useMultipleQuotes([...MAIN_ASSETS, ...customSymbols]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const filteredAssets = useMemo(() => {
    let filtered = quotes.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'variation') {
      filtered.sort((a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent);
    } else if (sortBy === 'volume') {
      filtered.sort((a, b) => b.regularMarketVolume - a.regularMarketVolume);
    } else {
      filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
    }

    return filtered;
  }, [searchTerm, sortBy, quotes]);

  const topMovers = useMemo(() => {
    const sorted = [...quotes].sort(
      (a, b) => b.regularMarketChangePercent - a.regularMarketChangePercent
    );
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, [quotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Mercado</h1>
          <p className="text-[#B8C2B8]">Acompanhe os principais ativos da B3 em tempo real</p>
        </div>
        <Button
          onClick={refresh}
          disabled={isRefreshing}
          className="bg-[#38A636] hover:bg-[#4CB22F] flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {!loading && quotes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#4CB22F]" />
              Maiores Altas
            </h3>
            <div className="space-y-3">
              {topMovers.gainers.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                  className="w-full flex items-center justify-between p-3 bg-[#050805]/50 hover:bg-[#141C14]/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.symbol}</p>
                    <p className="text-sm text-[#B8C2B8]">{formatCurrency(asset.regularMarketPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#76E821] font-semibold">+{asset.regularMarketChangePercent.toFixed(2)}%</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Maiores Quedas
            </h3>
            <div className="space-y-3">
              {topMovers.losers.map((asset) => (
                <button
                  key={asset.symbol}
                  onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                  className="w-full flex items-center justify-between p-3 bg-[#050805]/50 hover:bg-[#141C14]/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.symbol}</p>
                    <p className="text-sm text-[#B8C2B8]">{formatCurrency(asset.regularMarketPrice)}</p>
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

      <Card className="p-6 bg-[#0B110B]/50 border-[#235317]/30">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-[#B8C2B8]" />
            <Input
              type="text"
              placeholder="Buscar ativo (ex: PETR4, Vale)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#050805] border-[#235317]/30 text-white"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-[#050805] border border-[#235317]/30 text-white rounded-lg"
          >
            <option value="code">Ordenar por: Código</option>
            <option value="variation">Ordenar por: Variação</option>
            <option value="volume">Ordenar por: Volume</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#235317]/30">
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Código</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Nome</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Preço</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Variação</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Máxima</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Mínima</th>
                <th className="text-left py-3 px-4 text-[#B8C2B8] font-medium">Volume</th>
                <th className="text-center py-3 px-4 text-[#B8C2B8] font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#235317]/30">
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-24 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-12 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-16 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4">
                      <Skeleton className="h-4 w-20 bg-[#141C14]" />
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Skeleton className="h-8 w-8 bg-[#141C14] mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => {
                  const isPositive = asset.regularMarketChangePercent >= 0;
                  return (
                    <tr
                      key={asset.symbol}
                      className="border-b border-[#235317]/30 hover:bg-[#141C14]/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-semibold">{asset.symbol}</td>
                      <td className="py-3 px-4 text-[#B8C2B8]">{asset.name}</td>
                      <td className="py-3 px-4 text-white">{formatCurrency(asset.regularMarketPrice)}</td>
                      <td className={`py-3 px-4 font-semibold ${isPositive ? 'text-[#76E821]' : 'text-red-400'}`}>
                        {isPositive ? '+' : ''}{asset.regularMarketChangePercent.toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-[#B8C2B8]">{formatCurrency(asset.regularMarketDayHigh)}</td>
                      <td className="py-3 px-4 text-[#B8C2B8]">{formatCurrency(asset.regularMarketDayLow)}</td>
                      <td className="py-3 px-4 text-[#B8C2B8]">{formatNumber(asset.regularMarketVolume)}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setLocation(`/mercado/${asset.symbol}`)}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-[#38A636]/20 hover:bg-[#38A636]/30 text-[#76E821] rounded transition-colors"
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
                  <td colSpan={8} className="py-8 text-center text-[#B8C2B8]">
                    Nenhum ativo encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && quotes.length > 0 && (
          <p className="text-xs text-[#6B756B] mt-4">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
