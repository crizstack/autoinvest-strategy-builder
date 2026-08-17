import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TradeHistoryItem {
  id: number;
  asset: string;
  type: 'buy' | 'sell';
  quantity: number;
  entryPrice: number;
  exitPrice?: number | null;
  status: 'open' | 'closed' | 'canceled';
  profitLoss?: number | null;
  profitLossPercent?: number | null;
  entryTime: Date;
  exitTime?: Date | null;
  strategyName?: string;
}

export const TradeHistoryWidget: React.FC = () => {
  const [trades, setTrades] = useState<TradeHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Query para buscar histórico de trades
  const { data: closedTrades, isLoading: closedLoading } = trpc.paperTrading.getClosedTrades.useQuery(
    { limit: 20 },
    { refetchInterval: 30000 } // Atualizar a cada 30 segundos
  );

  useEffect(() => {
    if (closedTrades) {
      setTrades(closedTrades);
      setIsLoading(false);
    }
  }, [closedTrades]);

  if (isLoading || closedLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Operações</CardTitle>
          <CardDescription>Últimas 20 operações fechadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Carregando histórico...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trades || trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Operações</CardTitle>
          <CardDescription>Últimas 20 operações fechadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-64">
            <p className="text-sm text-muted-foreground">Nenhuma operação fechada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Operações</CardTitle>
        <CardDescription>Últimas {trades.length} operações fechadas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Ativo</th>
                <th className="text-left py-2 px-2">Tipo</th>
                <th className="text-right py-2 px-2">Qtd</th>
                <th className="text-right py-2 px-2">Entrada</th>
                <th className="text-right py-2 px-2">Saída</th>
                <th className="text-right py-2 px-2">P&L</th>
                <th className="text-left py-2 px-2">Data</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-2 font-semibold">{trade.asset}</td>
                  <td className="py-2 px-2">
                    <Badge variant={trade.type === 'buy' ? 'default' : 'secondary'}>
                      {trade.type === 'buy' ? '📈 Compra' : '📉 Venda'}
                    </Badge>
                  </td>
                  <td className="text-right py-2 px-2">{trade.quantity}</td>
                  <td className="text-right py-2 px-2">R$ {trade.entryPrice.toFixed(2)}</td>
                  <td className="text-right py-2 px-2">
                    {trade.exitPrice ? `R$ ${trade.exitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="text-right py-2 px-2">
                    {trade.profitLoss !== undefined && trade.profitLoss !== null ? (
                      <span className={trade.profitLoss > 0 ? 'text-[#38A636]' : 'text-red-600'}>
                        {trade.profitLoss > 0 ? '+' : ''}R$ {trade.profitLoss.toFixed(2)}
                        {trade.profitLossPercent !== undefined && trade.profitLossPercent !== null && (
                          <span className="text-xs ml-1">
                            ({trade.profitLossPercent > 0 ? '+' : ''}{trade.profitLossPercent.toFixed(2)}%)
                          </span>
                        )}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-2 px-2 text-xs text-muted-foreground">
                    {trade.exitTime
                      ? format(new Date(trade.exitTime), 'dd/MM HH:mm', { locale: ptBR })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Resumo de Estatísticas */}
        <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Total de Operações</p>
            <p className="text-2xl font-bold">{trades.length}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Operações Lucrativas</p>
            <p className="text-2xl font-bold text-[#38A636]">
              {trades.filter((t) => t.profitLoss && t.profitLoss > 0).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Taxa de Acerto</p>
            <p className="text-2xl font-bold">
              {trades.length > 0
                ? ((trades.filter((t) => t.profitLoss && t.profitLoss > 0).length / trades.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
