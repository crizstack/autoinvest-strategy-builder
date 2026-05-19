import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface Trade {
  id: number;
  date: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  result: number;
}

export interface EquityCurvePoint {
  date: string;
  value: number;
  trades?: Trade[];
}

interface BacktestReplayProps {
  trades: Trade[];
  equityCurve: EquityCurvePoint[];
  onTradeSelect?: (trade: Trade | null) => void;
}

export function BacktestReplay({ trades, equityCurve, onTradeSelect }: BacktestReplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= trades.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [isPlaying, speed, trades.length]);

  const currentTrade = trades[currentStep];
  const displayedTrades = trades.slice(0, currentStep + 1);
  const displayedEquity = equityCurve.slice(0, Math.ceil((currentStep + 1) / (trades.length / equityCurve.length)));

  const totalProfit = displayedTrades.reduce((sum, t) => sum + t.result, 0);
  const wins = displayedTrades.filter((t) => t.result > 0).length;
  const losses = displayedTrades.filter((t) => t.result < 0).length;

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    onTradeSelect?.(null);
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(trades.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const handleTradeClick = (trade: Trade) => {
    onTradeSelect?.(trade);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="space-y-4">
          {/* Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-400 text-sm">Progresso do Replay</p>
              <p className="text-white font-semibold">
                {currentStep + 1} / {trades.length}
              </p>
            </div>
            <div className="w-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
              <div
                className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${((currentStep + 1) / trades.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="p-2"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            <Button
              onClick={handlePrevious}
              variant="outline"
              size="sm"
              className="p-2"
              disabled={currentStep === 0}
              title="Anterior"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Reproduzir
                </>
              )}
            </Button>

            <Button
              onClick={handleNext}
              variant="outline"
              size="sm"
              className="p-2"
              disabled={currentStep === trades.length - 1}
              title="Próximo"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Speed Control */}
            <div className="ml-auto flex items-center gap-2">
              <label className="text-slate-400 text-sm">Velocidade:</label>
              <select
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="px-2 py-1 bg-slate-950 border border-slate-800 text-white rounded text-sm"
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={4}>4x</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Current Trade Info */}
      {currentTrade && (
        <Card className="p-6 bg-slate-900/50 border-slate-800 border-l-4 border-l-blue-500">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Data</p>
              <p className="text-white font-semibold">{currentTrade.date}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Tipo</p>
              <p
                className={`font-semibold ${
                  currentTrade.type === 'BUY' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {currentTrade.type}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Preço</p>
              <p className="text-white font-semibold">R$ {currentTrade.price.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Resultado</p>
              <p
                className={`font-semibold ${
                  currentTrade.result > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {currentTrade.result > 0 ? '+' : ''}R$ {currentTrade.result.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Lucro Acumulado</p>
          <p className={`text-2xl font-bold ${totalProfit > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {totalProfit > 0 ? '+' : ''}R$ {totalProfit.toLocaleString('pt-BR')}
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Ganhos / Perdas</p>
          <p className="text-white font-semibold">
            <span className="text-green-400">{wins}W</span> / <span className="text-red-400">{losses}L</span>
          </p>
        </Card>

        <Card className="p-4 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-1">Taxa de Acerto</p>
          <p className="text-white font-semibold">
            {displayedTrades.length > 0
              ? Math.round((wins / displayedTrades.length) * 100)
              : 0}
            %
          </p>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Curva de Equity</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={displayedEquity}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6' }}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Trades List */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Operações Executadas</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displayedTrades.map((trade, idx) => (
            <button
              key={trade.id}
              onClick={() => handleTradeClick(trade)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                currentTrade?.id === trade.id
                  ? 'bg-blue-500/20 border border-blue-500'
                  : 'bg-slate-950 border border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm">#{idx + 1}</span>
                  <span className="text-white font-semibold">{trade.date}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY'
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-red-600/20 text-red-400'
                    }`}
                  >
                    {trade.type}
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    trade.result > 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {trade.result > 0 ? '+' : ''}R$ {trade.result.toLocaleString('pt-BR')}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
