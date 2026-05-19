import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  BarChart,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';

export interface EquityCurveData {
  date: string;
  value: number;
  drawdown?: number;
  monthlyReturn?: number;
}

interface ProfessionalEquityCurveProps {
  data: EquityCurveData[];
  initialCapital?: number;
  showDrawdown?: boolean;
  showMonthlyReturns?: boolean;
}

export function ProfessionalEquityCurve({
  data,
  initialCapital = 10000,
  showDrawdown = true,
  showMonthlyReturns = true,
}: ProfessionalEquityCurveProps) {
  // Calcular drawdown
  const calculateDrawdown = () => {
    let maxValue = data[0].value;
    return data.map((point) => {
      if (point.value > maxValue) {
        maxValue = point.value;
      }
      const drawdown = ((maxValue - point.value) / maxValue) * 100;
      return { ...point, drawdown: Math.max(0, drawdown) };
    });
  };

  // Calcular retornos mensais
  const calculateMonthlyReturns = () => {
    const monthlyData: { [key: string]: number } = {};

    data.forEach((point) => {
      const month = point.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = point.value;
      }
    });

    const months = Object.keys(monthlyData).sort();
    const returns = [];

    for (let i = 1; i < months.length; i++) {
      const prevValue = monthlyData[months[i - 1]];
      const currValue = monthlyData[months[i]];
      const monthlyReturn = ((currValue - prevValue) / prevValue) * 100;

      returns.push({
        month: months[i],
        return: monthlyReturn,
        color: monthlyReturn > 0 ? '#10b981' : '#ef4444',
      });
    }

    return returns;
  };

  const dataWithDrawdown = calculateDrawdown();
  const monthlyReturns = calculateMonthlyReturns();

  // Calcular estatísticas
  const finalValue = data[data.length - 1].value;
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const maxDrawdown = Math.max(...dataWithDrawdown.map((d) => d.drawdown || 0));

  return (
    <div className="space-y-6">
      {/* Main Equity Curve */}
      <Card className="p-6 bg-slate-900/50 border-slate-800">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Curva de Equity</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Capital Inicial</p>
              <p className="text-white font-semibold">R$ {initialCapital.toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Valor Final</p>
              <p className={`font-semibold ${finalValue > initialCapital ? 'text-green-400' : 'text-red-400'}`}>
                R$ {finalValue.toLocaleString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Retorno Total</p>
              <p className={`font-semibold ${totalReturn > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalReturn > 0 ? '+' : ''}{totalReturn.toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Drawdown Máx</p>
              <p className="text-amber-400 font-semibold">{maxDrawdown.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={dataWithDrawdown}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Saldo"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Drawdown Chart */}
      {showDrawdown && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Drawdown ao Longo do Tempo</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dataWithDrawdown}>
              <defs>
                <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => `${value.toFixed(2)}%`}
              />
              <Area
                type="monotone"
                dataKey="drawdown"
                stroke="#ef4444"
                fillOpacity={1}
                fill="url(#colorDrawdown)"
                name="Drawdown %"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Monthly Returns Heatmap */}
      {showMonthlyReturns && monthlyReturns.length > 0 && (
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-4">Retornos Mensais</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyReturns}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                formatter={(value: any) => `${value.toFixed(2)}%`}
              />
              <Bar dataKey="return" name="Retorno Mensal %">
                {monthlyReturns.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-2">Maior Valor Atingido</p>
          <p className="text-2xl font-bold text-green-400">R$ {maxValue.toLocaleString('pt-BR')}</p>
          <p className="text-slate-400 text-xs mt-2">
            +{(((maxValue - initialCapital) / initialCapital) * 100).toFixed(2)}% do capital inicial
          </p>
        </Card>

        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-2">Menor Valor Atingido</p>
          <p className="text-2xl font-bold text-red-400">R$ {minValue.toLocaleString('pt-BR')}</p>
          <p className="text-slate-400 text-xs mt-2">
            {(((minValue - initialCapital) / initialCapital) * 100).toFixed(2)}% do capital inicial
          </p>
        </Card>

        <Card className="p-6 bg-slate-900/50 border-slate-800">
          <p className="text-slate-400 text-sm mb-2">Variação Total</p>
          <p className="text-2xl font-bold text-white">
            R$ {(maxValue - minValue).toLocaleString('pt-BR')}
          </p>
          <p className="text-slate-400 text-xs mt-2">
            {(((maxValue - minValue) / minValue) * 100).toFixed(2)}% de amplitude
          </p>
        </Card>
      </div>
    </div>
  );
}
