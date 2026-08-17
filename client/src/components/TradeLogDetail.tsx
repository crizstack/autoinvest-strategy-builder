import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Zap,
} from 'lucide-react';
import type { TradeLog } from '@shared/types/tradeLog';

interface TradeLogDetailProps {
  trade: TradeLog;
  isExpanded?: boolean;
}

export function TradeLogDetail({ trade, isExpanded: initialExpanded = false }: TradeLogDetailProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const isProfit = trade.result > 0;
  const isOpen = trade.status === 'open';

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <Card className="bg-[#0B110B]/50 border-[#235317]/30 overflow-hidden">
      {/* Header - Resumo */}
      <div
        className="p-4 cursor-pointer hover:bg-[#141C14]/30 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Ícone de tipo */}
            <div
              className={`p-2 rounded-lg ${
                trade.signal === 'BUY'
                  ? 'bg-[#38A636]/20 text-[#76E821]'
                  : 'bg-red-600/20 text-red-400'
              }`}
            >
              {trade.signal === 'BUY' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
            </div>

            {/* Informações principais */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-white">{trade.symbol}</span>
                <Badge variant="outline" className="text-xs">
                  {trade.signal}
                </Badge>
                {isOpen && (
                  <Badge variant="secondary" className="text-xs bg-[#38A636]/20 text-[#76E821]">
                    Aberto
                  </Badge>
                )}
              </div>
              <p className="text-sm text-[#B8C2B8]">
                {formatTime(trade.entryTime)}
              </p>
            </div>

            {/* Resultado */}
            <div className="text-right">
              <p className={`text-lg font-bold ${isProfit ? 'text-[#76E821]' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}R$ {trade.result.toLocaleString('pt-BR')}
              </p>
              <p className={`text-sm ${isProfit ? 'text-[#76E821]' : 'text-red-400'}`}>
                {isProfit ? '+' : ''}{trade.resultPercent.toFixed(2)}%
              </p>
            </div>

            {/* Botão expandir */}
            <button className="p-1 text-[#B8C2B8] hover:text-white transition-colors">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Detalhes expandidos */}
      {isExpanded && (
        <div className="border-t border-[#235317]/30 p-4 space-y-4">
          {/* Explicação de Entrada */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">Motivo da Entrada</p>
                <p className="text-sm text-[#B8C2B8]">{trade.explanation.entryReason}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {trade.explanation.entryIndicators.map((ind: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {ind.name}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-[#B8C2B8] mt-2">
                  Confiança: {trade.explanation.entryConfidence}%
                </p>
              </div>
            </div>
          </div>

          {/* Explicação de Saída */}
          {trade.status === 'closed' && (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Target className="w-4 h-4 text-[#76E821] mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-1">Motivo da Saída</p>
                  <p className="text-sm text-[#B8C2B8]">{trade.explanation.exitReason}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {trade.explanation.exitIndicators.map((ind: any, idx: number) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {ind.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[#B8C2B8] mt-2">
                    Tipo: {trade.explanation.exitType}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Contexto de Mercado */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#76E821] mt-1 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-white mb-1">Contexto de Mercado</p>
                <p className="text-sm text-[#B8C2B8]">{trade.explanation.marketContext}</p>
              </div>
            </div>
          </div>

          {/* Detalhes Técnicos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#235317]/30">
            <div>
              <p className="text-xs text-[#B8C2B8] mb-1">Preço Entrada</p>
              <p className="text-sm font-semibold text-white">
                R$ {trade.entryPrice.toFixed(2)}
              </p>
            </div>

            {trade.exitPrice && (
              <div>
                <p className="text-xs text-[#B8C2B8] mb-1">Preço Saída</p>
                <p className="text-sm font-semibold text-white">
                  R$ {trade.exitPrice.toFixed(2)}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-[#B8C2B8] mb-1">Quantidade</p>
              <p className="text-sm font-semibold text-white">{trade.quantity}</p>
            </div>

            <div>
              <p className="text-xs text-[#B8C2B8] mb-1">Duração</p>
              <p className="text-sm font-semibold text-white">
                {formatDuration(trade.duration)}
              </p>
            </div>

            <div>
              <p className="text-xs text-[#B8C2B8] mb-1">Risco/Recompensa</p>
              <p className="text-sm font-semibold text-white">
                {trade.explanation.riskReward}:1
              </p>
            </div>

            <div>
              <p className="text-xs text-[#B8C2B8] mb-1">Confiança</p>
              <p className="text-sm font-semibold text-white">
                {trade.confidence}%
              </p>
            </div>

            {trade.exitTime && (
              <div>
                <p className="text-xs text-[#B8C2B8] mb-1">Saída</p>
                <p className="text-xs font-semibold text-white">
                  {new Date(trade.exitTime).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            )}
          </div>

          {/* Tags */}
          {trade.tags.length > 0 && (
            <div className="pt-2 border-t border-[#235317]/30">
              <p className="text-xs text-[#B8C2B8] mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {trade.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {trade.explanation.notes && (
            <div className="pt-2 border-t border-[#235317]/30">
              <p className="text-xs text-[#B8C2B8] mb-2">Notas</p>
              <p className="text-sm text-[#B8C2B8]">{trade.explanation.notes}</p>
            </div>
          )}

          {/* Ações */}
          <div className="pt-2 border-t border-[#235317]/30 flex gap-2">
            <Button variant="outline" size="sm" className="text-xs">
              Duplicar Estratégia
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              Analisar Padrão
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
