import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Search, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { mockAssets, calculateVariation, formatCurrency, formatNumber } from '@/data/mockMarketData';

export default function Market() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'variation' | 'volume'>('code');

  // Filtrar e ordenar ativos
  const filteredAssets = useMemo(() => {
    let filtered = mockAssets.filter(
      (asset) =>
        asset.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Ordenar
    if (sortBy === 'variation') {
      filtered.sort((a, b) => calculateVariation(b) - calculateVariation(a));
    } else if (sortBy === 'volume') {
      filtered.sort((a, b) => b.volume - a.volume);
    } else {
      filtered.sort((a, b) => a.code.localeCompare(b.code));
    }

    return filtered;
  }, [searchTerm, sortBy]);

  // Calcular top gainers e losers
  const topMovers = useMemo(() => {
    const sorted = [...mockAssets].sort(
      (a, b) => calculateVariation(b) - calculateVariation(a)
    );
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse(),
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Mercado</h1>
        <p className="text-slate-400">Acompanhe os principais ativos da B3</p>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maiores Altas */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Maiores Altas
          </h3>
          <div className="space-y-3">
            {topMovers.gainers.map((asset) => {
              const variation = calculateVariation(asset);
              return (
                <button
                  key={asset.code}
                  onClick={() => setLocation(`/mercado/${asset.code}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.code}</p>
                    <p className="text-sm text-slate-400">{formatCurrency(asset.currentPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-semibold">+{variation.toFixed(2)}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Maiores Quedas */}
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Maiores Quedas
          </h3>
          <div className="space-y-3">
            {topMovers.losers.map((asset) => {
              const variation = calculateVariation(asset);
              return (
                <button
                  key={asset.code}
                  onClick={() => setLocation(`/mercado/${asset.code}`)}
                  className="w-full flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-800/50 rounded-lg transition-colors text-left"
                >
                  <div>
                    <p className="text-white font-medium">{asset.code}</p>
                    <p className="text-sm text-slate-400">{formatCurrency(asset.currentPrice)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-400 font-semibold">{variation.toFixed(2)}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

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
              {filteredAssets.map((asset) => {
                const variation = calculateVariation(asset);
                const isPositive = variation >= 0;

                return (
                  <tr
                    key={asset.code}
                    className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-semibold">{asset.code}</td>
                    <td className="py-3 px-4 text-slate-300">{asset.name}</td>
                    <td className="py-3 px-4 text-white">{formatCurrency(asset.currentPrice)}</td>
                    <td className={`py-3 px-4 font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{variation.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-slate-300">{formatCurrency(asset.dayHigh)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatCurrency(asset.dayLow)}</td>
                    <td className="py-3 px-4 text-slate-300">{formatNumber(asset.volume)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setLocation(`/mercado/${asset.code}`)}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAssets.length === 0 && (
          <div className="text-center py-8">
            <p className="text-slate-400">Nenhum ativo encontrado</p>
          </div>
        )}
      </Card>
    </div>
  );
}
