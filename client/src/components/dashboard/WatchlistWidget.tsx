import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Star, Trash2, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  addedAt: Date;
  notes?: string;
}

// Mock data for prices - in production, fetch from BRAPI
const mockPrices: Record<string, { price: number; change: number; changePercent: number }> = {
  PETR4: { price: 28.45, change: 0.85, changePercent: 3.08 },
  VALE3: { price: 56.20, change: -1.20, changePercent: -2.09 },
  ITUB4: { price: 27.80, change: 0.45, changePercent: 1.64 },
  BBDC4: { price: 29.15, change: -0.35, changePercent: -1.19 },
  WEGE3: { price: 45.30, change: 2.10, changePercent: 4.85 },
  MGLU3: { price: 8.50, change: 0.25, changePercent: 3.03 },
};

export default function WatchlistWidget() {
  const [, setLocation] = useLocation();
  const { data: items = [], isLoading } = trpc.watchlist.getAll.useQuery();
  const removeMutation = trpc.watchlist.remove.useMutation();

  const handleRemove = (id: number) => {
    removeMutation.mutate({ id });
  };

  const handleViewAll = () => {
    setLocation('/watchlist');
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Minha Watchlist</h3>
        <p className="text-slate-400 text-sm">Carregando...</p>
      </Card>
    );
  }

  const displayItems = items.slice(0, 5);

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Minha Watchlist</h3>
          <p className="text-sm text-slate-400 mt-1">{items.length} ativos</p>
        </div>
        <Star className="w-5 h-5 text-amber-400" />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-400 text-sm mb-4">Nenhum ativo na watchlist</p>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleViewAll}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Ativo
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayItems.map((item: any) => {
              const priceData = mockPrices[item.symbol] || { price: 0, change: 0, changePercent: 0 };
              const isPositive = priceData.changePercent >= 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors cursor-pointer group"
                  onClick={() => setLocation(`/mercado/${item.symbol}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{item.symbol}</span>
                      <span className="text-xs text-slate-400">{item.name}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">R$ {priceData.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-right ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="flex items-center gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span className="font-semibold text-sm">
                          {isPositive ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 5 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-4 border-slate-700"
              onClick={handleViewAll}
            >
              Ver todos ({items.length})
            </Button>
          )}
        </>
      )}
    </Card>
  );
}
