import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

export interface ComparisonData {
  date: string;
  strategy: number;
  ibov: number;
}

interface IBOVComparisonProps {
  data: ComparisonData[];
  strategyName: string;
  strategyReturn: number;
  ibovReturn: number;
  outperformance: number;
}

export function IBOVComparison({
  data,
  strategyName,
  strategyReturn,
  ibovReturn,
  outperformance,
}: IBOVComparisonProps) {
  // Calcular correlação
  const calculateCorrelation = () => {
    if (data.length < 2) return 0;

    const strategyReturns = data.slice(1).map((d, i) => (d.strategy - data[i].strategy) / data[i].strategy);
    const ibovReturns = data.slice(1).map((d, i) => (d.ibov - data[i].ibov) / data[i].ibov);

    const avgStrategy = strategyReturns.reduce((a, b) => a + b, 0) / strategyReturns.length;
    const avgIbov = ibovReturns.reduce((a, b) => a + b, 0) / ibovReturns.length;

    let covariance = 0;
    let varStrategy = 0;
    let varIbov = 0;

    for (let i = 0; i < strategyReturns.length; i++) {
      covariance += (strategyReturns[i] - avgStrategy) * (ibovReturns[i] - avgIbov);
      varStrategy += Math.pow(strategyReturns[i] - avgStrategy, 2);
      varIbov += Math.pow(ibovReturns[i] - avgIbov, 2);
    }

    const stdStrategy = Math.sqrt(varStrategy / strategyReturns.length);
    const stdIbov = Math.sqrt(varIbov / ibovReturns.length);

    if (stdStrategy === 0 || stdIbov === 0) return 0;

    const correlation = (covariance / strategyReturns.length) / (stdStrategy * stdIbov);
    return Math.round(correlation * 100) / 100;
  };

  const correlation = calculateCorrelation();

  return (
    <div className="space-y-6">
      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-sm">Retorno da Estratégia</p>
            {strategyReturn > ibovReturn ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className="text-3xl font-bold text-white mb-2">{strategyReturn.toFixed(2)}%</p>
          <p className="text-slate-400 text-sm">{strategyName}</p>
        </Card>

        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-sm">Retorno do IBOV</p>
            <Award className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{ibovReturn.toFixed(2)}%</p>
          <p className="text-slate-400 text-sm">Índice de Referência</p>
        </Card>

        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-sm">Outperformance</p>
            {outperformance > 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <p className={`text-3xl font-bold mb-2 ${outperformance > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {outperformance > 0 ? '+' : ''}{outperformance.toFixed(2)}%
          </p>
          <p className="text-slate-400 text-sm">Diferença de Performance</p>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Performance Comparativa</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
              formatter={(value: any) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="strategy"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6' }}
              name={strategyName}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="ibov"
              stroke="#10b981"
              dot={{ fill: '#10b981' }}
              name="IBOV"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Statistics */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Estatísticas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <p className="text-slate-400 text-sm mb-2">Correlação com IBOV</p>
            <p className="text-2xl font-bold text-white">{correlation.toFixed(2)}</p>
            <p className="text-slate-400 text-xs mt-2">
              {Math.abs(correlation) > 0.7
                ? 'Altamente correlacionada'
                : Math.abs(correlation) > 0.4
                  ? 'Moderadamente correlacionada'
                  : 'Baixa correlação'}
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
            <p className="text-slate-400 text-sm mb-2">Diferença de Volatilidade</p>
            <p className="text-2xl font-bold text-white">
              {strategyReturn > ibovReturn ? '-' : '+'}
              {Math.abs(strategyReturn - ibovReturn).toFixed(2)}%
            </p>
            <p className="text-slate-400 text-xs mt-2">
              {strategyReturn > ibovReturn ? 'Menos volátil' : 'Mais volátil'} que IBOV
            </p>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <h3 className="text-lg font-semibold text-white mb-4">Insights</h3>
        <div className="space-y-3">
          {outperformance > 0 ? (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-300 font-semibold">Estratégia Superando o Mercado</p>
                <p className="text-green-200 text-sm">
                  Sua estratégia está gerando {outperformance.toFixed(2)}% a mais de retorno que o IBOV
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 font-semibold">Estratégia Abaixo do Mercado</p>
                <p className="text-red-200 text-sm">
                  Sua estratégia está gerando {Math.abs(outperformance).toFixed(2)}% a menos que o IBOV
                </p>
              </div>
            </div>
          )}

          {Math.abs(correlation) < 0.4 && (
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Award className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-300 font-semibold">Diversificação Efetiva</p>
                <p className="text-blue-200 text-sm">
                  Baixa correlação com IBOV oferece benefícios de diversificação em portfólio
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
