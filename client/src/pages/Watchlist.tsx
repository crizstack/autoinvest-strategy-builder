import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Trash2, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

const allAssets = [
  { id: 1, symbol: 'PETR4', name: 'Petrobras', sector: 'Energia' },
  { id: 2, symbol: 'VALE3', name: 'Vale', sector: 'Mineração' },
  { id: 3, symbol: 'ITUB4', name: 'Itaú', sector: 'Financeiro' },
  { id: 4, symbol: 'BBDC4', name: 'Bradesco', sector: 'Financeiro' },
  { id: 5, symbol: 'WEGE3', name: 'WEG', sector: 'Industrial' },
  { id: 6, symbol: 'MGLU3', name: 'Magazine Luiza', sector: 'Varejo' },
  { id: 7, symbol: 'ABEV3', name: 'Ambev', sector: 'Bebidas' },
  { id: 8, symbol: 'B3SA3', name: 'B3', sector: 'Financeiro' },
];

const mockPrices: Record<string, { price: number; change: number; changePercent: number }> = {
  PETR4: { price: 28.45, change: 0.85, changePercent: 3.08 },
  VALE3: { price: 56.20, change: -1.20, changePercent: -2.09 },
  ITUB4: { price: 27.80, change: 0.45, changePercent: 1.64 },
  BBDC4: { price: 29.15, change: -0.35, changePercent: -1.19 },
  WEGE3: { price: 45.30, change: 2.10, changePercent: 4.85 },
  MGLU3: { price: 8.50, change: 0.25, changePercent: 3.03 },
  ABEV3: { price: 12.80, change: -0.15, changePercent: -1.16 },
  B3SA3: { price: 14.50, change: 0.50, changePercent: 3.57 },
};

export default function Watchlist() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: watchlistItems = [], isLoading, refetch } = trpc.watchlist.getAll.useQuery();
  const removeMutation = trpc.watchlist.remove.useMutation({
    onSuccess: () => refetch(),
  });
  const addMutation = trpc.watchlist.add.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddModal(false);
    },
  });

  const handleRemove = (id: number) => {
    removeMutation.mutate({ id });
  };

  const handleAdd = (assetId: number) => {
    addMutation.mutate({ assetId });
  };

  const watchlistSymbols = new Set(watchlistItems.map((item: any) => item.symbol));
  const availableAssets = allAssets.filter((asset) => !watchlistSymbols.has(asset.symbol));
  const filteredAssets = availableAssets.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">Minha Watchlist</h1>
          <p className="text-slate-400 mt-2">{watchlistItems.length} ativos monitorados</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Ativo
        </Button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg">
          <Card className="p-6 bg-slate-900 border-slate-800 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Adicionar Ativo</h2>
            <div className="mb-4">
              <Input
                placeholder="Buscar ativo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {filteredAssets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => handleAdd(asset.id)}
                  className="w-full text-left p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-green-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{asset.symbol}</p>
                      <p className="text-xs text-slate-400">{asset.name}</p>
                    </div>
                    <Plus className="w-4 h-4 text-green-400" />
                  </div>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full border-slate-700"
              onClick={() => {
                setShowAddModal(false);
                setSearchTerm('');
              }}
            >
              Cancelar
            </Button>
          </Card>
        </div>
      )}

      {/* Watchlist Items */}
      {isLoading ? (
        <Card className="p-8 bg-slate-900/50 border-slate-800 text-center">
          <p className="text-slate-400">Carregando...</p>
        </Card>
      ) : watchlistItems.length === 0 ? (
        <Card className="p-8 bg-slate-900/50 border-slate-800 text-center">
          <p className="text-slate-400 mb-4">Sua watchlist está vazia</p>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Ativo
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {watchlistItems.map((item: any) => {
            const priceData = mockPrices[item.symbol] || { price: 0, change: 0, changePercent: 0 };
            const isPositive = priceData.changePercent >= 0;

            return (
              <Card key={item.id} className="p-6 bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-white">{item.symbol}</h3>
                        <p className="text-sm text-slate-400">{item.name}</p>
                      </div>
                      {item.sector && (
                        <span className="px-3 py-1 rounded-full bg-slate-800 text-xs text-slate-300">
                          {item.sector}
                        </span>
                      )}
                    </div>
                    {item.notes && <p className="text-sm text-slate-400 mt-2">Nota: {item.notes}</p>}
                  </div>
                  <div className="text-right mr-6">
                    <p className="text-2xl font-bold text-white mb-1">R$ {priceData.price.toFixed(2)}</p>
                    <div className={`flex items-center gap-1 justify-end ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
