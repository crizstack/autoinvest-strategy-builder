import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Star, Trash2, Plus, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { getMultipleQuotes } from '@/services/marketDataService';

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  sector?: string;
  addedAt: Date;
  notes?: string;
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
}

export default function WatchlistWidget() {
  const [, setLocation] = useLocation();
  const { data: items = [], isLoading } = trpc.watchlist.getAll.useQuery();
  const removeMutation = trpc.watchlist.remove.useMutation();
  const [priceData, setPriceData] = useState<Record<string, PriceData>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);

  // Buscar preços reais da BRAPI
  useEffect(() => {
    if (items.length === 0) return;

    const fetchPrices = async () => {
      setLoadingPrices(true);
      try {
        const symbols = items.slice(0, 5).map(item => item.symbol);
        const quotes = await getMultipleQuotes(symbols);

        if (quotes && Array.isArray(quotes)) {
          const newPriceData: Record<string, PriceData> = {};
          for (const quote of quotes) {
            newPriceData[quote.symbol] = {
              price: quote.regularMarketPrice || 0,
              change: quote.regularMarketChange || 0,
              changePercent: quote.regularMarketChangePercent || 0,
            };
          }
          setPriceData(newPriceData);
        }
      } catch (error) {
        console.error('Erro ao buscar preços:', error);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [items]);

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
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          <span className="text-slate-400 text-sm ml-2">Carregando ativos...</span>
        </div>
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
        <div className="flex items-center gap-2">
          {loadingPrices && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
          <Star className="w-5 h-5 text-amber-400" />
        </div>
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
              const priceInfo = priceData[item.symbol];
              const isPositive = (priceInfo?.changePercent || 0) >= 0;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{item.symbol}</span>
                      {priceInfo && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          isPositive
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isPositive ? '+' : ''}{priceInfo.changePercent.toFixed(2)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{item.name}</p>
                  </div>

                  <div className="text-right mr-4">
                    {priceInfo ? (
                      <>
                        <p className="font-semibold text-white">
                          R$ {priceInfo.price.toFixed(2)}
                        </p>
                        <p className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                          {' '}{Math.abs(priceInfo.change).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>

          {items.length > 5 && (
            <Button
              variant="ghost"
              className="w-full mt-4 text-slate-400 hover:text-white"
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
