import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

const data = [
  { date: 'Jan 1', user: 0, market: 0 },
  { date: 'Jan 8', user: 5, market: 2 },
  { date: 'Jan 15', user: 12, market: 3 },
  { date: 'Jan 22', user: 8, market: 1 },
  { date: 'Jan 29', user: 15, market: 4 },
  { date: 'Feb 5', user: 21, market: 5 },
  { date: 'Feb 12', user: 19, market: 6 },
  { date: 'Feb 19', user: 28, market: 7 },
];

export default function PerformanceComparison() {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Você vs Mercado</h3>
        <p className="text-sm text-slate-400 mt-1">Rentabilidade comparativa (%)</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value) => `${value}%`}
          />
          <Legend wrapperStyle={{ color: '#94a3b8' }} />
          <Line
            type="monotone"
            dataKey="user"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Sua Carteira"
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="market"
            stroke="#8b5cf6"
            strokeWidth={2}
            name="Ibovespa"
            dot={{ fill: '#8b5cf6', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
