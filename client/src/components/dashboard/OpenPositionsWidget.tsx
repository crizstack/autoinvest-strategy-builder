/**
 * Open Positions Widget
 * Exibe posições abertas em tempo real com PnL
 */

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, X, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface OpenPosition {
  tradeId: number;
  asset: string;
  currentPrice: number;
  entryPrice: number;
  quantity: number;
  type: 'buy' | 'sell';
  pnl: number;
  pnlPercent: number;
  unrealizedPnL?: number;
  unrealizedPnLPercent?: number;
}

export default function OpenPositionsWidget() {
  const [positions, setPositions] = useState<OpenPosition[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Buscar PnL em tempo real do portfolio
  const { data: portfolioPnL, refetch: refetchPortfolioPnL } =
    trpc.paperTrading.getPortfolioPnLRealtime.useQuery(undefined, {
      refetchInterval: 5000, // Atualizar a cada 5 segundos
      retry: 1,
    });

  // Mutation para fechar posição
  const closePositionMutation = trpc.paperTrading.closePosition.useMutation({
    onSuccess: () => {
      refetchPortfolioPnL();
    },
  });

  // Atualizar posições quando dados chegam
  useEffect(() => {
    if (portfolioPnL?.positions) {
      setPositions(portfolioPnL.positions);
    }
  }, [portfolioPnL]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchPortfolioPnL();
    setIsRefreshing(false);
  };

  const handleClosePosition = async (tradeId: number, currentPrice: number) => {
    if (confirm('Tem certeza que deseja fechar esta posição?')) {
      try {
        await closePositionMutation.mutateAsync({
          tradeId,
          exitPrice: currentPrice,
          exitReason: 'Fechamento manual',
        });
      } catch (error) {
        console.error('Erro ao fechar posição:', error);
      }
    }
  };

  if (!portfolioPnL) {
    return (
      <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-4">
        <div className="flex items-center justify-center h-40">
          <Loader className="w-6 h-6 text-green-400 animate-spin" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Posições Abertas</h3>
          <p className="text-sm text-slate-400 mt-1">
            {portfolioPnL.openPositionsCount} posição{portfolioPnL.openPositionsCount !== 1 ? 's' : ''} ativa{portfolioPnL.openPositionsCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-slate-700 hover:border-slate-600"
        >
          {isRefreshing ? <Loader className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>

      {/* Total PnL Summary */}
      {portfolioPnL.openPositionsCount > 0 && (
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">PnL Total Não Realizado</p>
              <p className={`text-2xl font-bold mt-1 ${portfolioPnL.totalUnrealizedPnL > 0 ? 'text-green-400' : 'text-red-400'}`}>
                R$ {portfolioPnL.totalUnrealizedPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Retorno %</p>
              <div className="flex items-center gap-2 mt-1">
                {portfolioPnL.totalUnrealizedPnLPercent > 0 ? (
                  <>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <p className="text-2xl font-bold text-green-400">+{portfolioPnL.totalUnrealizedPnLPercent.toFixed(2)}%</p>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-5 h-5 text-red-400" />
                    <p className="text-2xl font-bold text-red-400">{portfolioPnL.totalUnrealizedPnLPercent.toFixed(2)}%</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Positions List */}
      {positions.length > 0 ? (
        <div className="space-y-3">
          {positions.map((position) => (
            <div
              key={position.tradeId}
              className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left: Asset Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {position.asset.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{position.asset}</p>
                      <p className="text-xs text-slate-400">
                        {position.type === 'buy' ? 'Compra' : 'Venda'} • {position.quantity} unidades
                      </p>
                    </div>
                  </div>
                </div>

                {/* Center: Price Info */}
                <div className="text-right mx-6">
                  <p className="text-sm text-slate-400">Entrada</p>
                  <p className="font-semibold text-white">R$ {position.entryPrice.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 mt-1">Atual: R$ {position.currentPrice.toFixed(2)}</p>
                </div>

                {/* Right: PnL */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${position.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {position.pnl > 0 ? '+' : ''}R$ {position.pnl.toFixed(2)}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {position.pnlPercent > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-400" />
                        <p className="text-sm font-semibold text-green-400">+{position.pnlPercent.toFixed(2)}%</p>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 text-red-400" />
                        <p className="text-sm font-semibold text-red-400">{position.pnlPercent.toFixed(2)}%</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Close Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-4 hover:bg-red-600/20 hover:text-red-400"
                  onClick={() => handleClosePosition(position.tradeId, position.currentPrice)}
                  disabled={closePositionMutation.isPending}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-slate-400">Nenhuma posição aberta</p>
          <p className="text-sm text-slate-500 mt-2">Suas estratégias ativas aparecerão aqui</p>
        </div>
      )}
    </Card>
  );
}
