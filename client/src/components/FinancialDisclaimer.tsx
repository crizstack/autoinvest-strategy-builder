import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function PaperTradingDisclaimer() {
  return (
    <Alert className="bg-amber-500/10 border-amber-500/30 mb-4">
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <AlertDescription className="text-amber-200">
        <strong>Paper Trading:</strong> Esta é uma simulação. Nenhuma operação real é executada. 
        Use para testar estratégias antes de operar com dinheiro real.
      </AlertDescription>
    </Alert>
  );
}

export function BacktestDisclaimer() {
  return (
    <Alert className="bg-blue-500/10 border-blue-500/30 mb-4">
      <AlertCircle className="h-4 w-4 text-blue-500" />
      <AlertDescription className="text-blue-200">
        <strong>Aviso de Backtest:</strong> Resultados passados não garantem desempenho futuro. 
        O backtest usa dados históricos e não considera custos reais, slippage ou gaps de preço.
      </AlertDescription>
    </Alert>
  );
}

export function RiskWarning() {
  return (
    <Alert className="bg-red-500/10 border-red-500/30 mb-4">
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-200">
        <strong>Aviso de Risco:</strong> Trading envolve risco significativo de perda. 
        Nunca invista dinheiro que não possa perder. Consulte um consultor financeiro antes de operar.
      </AlertDescription>
    </Alert>
  );
}

export function StrategyRiskWarning({ drawdown, winRate }: { drawdown?: number; winRate?: number }) {
  const risks: string[] = [];

  if (drawdown && drawdown > 30) {
    risks.push(`Drawdown elevado (${drawdown.toFixed(1)}%)`);
  }

  if (winRate && winRate < 40) {
    risks.push(`Taxa de acerto baixa (${winRate.toFixed(1)}%)`);
  }

  if (risks.length === 0) return null;

  return (
    <Alert className="bg-red-500/10 border-red-500/30">
      <AlertCircle className="h-4 w-4 text-red-500" />
      <AlertDescription className="text-red-200">
        <strong>Riscos Detectados:</strong> {risks.join(', ')}. 
        Revise sua estratégia antes de operar.
      </AlertDescription>
    </Alert>
  );
}

export function OperationConfirmation({ 
  type, 
  asset, 
  quantity, 
  price 
}: { 
  type: 'buy' | 'sell'; 
  asset: string; 
  quantity: number; 
  price: number; 
}) {
  const total = quantity * price;
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
      <h4 className="text-white font-semibold mb-3">Confirmar Operação</h4>
      <div className="space-y-2 text-sm text-slate-300">
        <div className="flex justify-between">
          <span>Tipo:</span>
          <span className={type === 'buy' ? 'text-green-400' : 'text-red-400'}>
            {type === 'buy' ? 'COMPRA' : 'VENDA'}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Ativo:</span>
          <span className="text-white">{asset}</span>
        </div>
        <div className="flex justify-between">
          <span>Quantidade:</span>
          <span className="text-white">{quantity}</span>
        </div>
        <div className="flex justify-between">
          <span>Preço:</span>
          <span className="text-white">R$ {price.toFixed(2)}</span>
        </div>
        <div className="border-t border-slate-700 pt-2 mt-2 flex justify-between font-semibold">
          <span>Total:</span>
          <span className="text-white">R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
