import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

const data = [
  { date: 'Jan 1', balance: 10000 },
  { date: 'Jan 8', balance: 10500 },
  { date: 'Jan 15', balance: 11200 },
  { date: 'Jan 22', balance: 10800 },
  { date: 'Jan 29', balance: 11500 },
  { date: 'Feb 5', balance: 12100 },
  { date: 'Feb 12', balance: 11900 },
  { date: 'Feb 19', balance: 12800 },
];

export default function BalanceChart() {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Evolução do Saldo</h3>
        <p className="text-sm text-slate-400 mt-1">Últimos 30 dias</p>
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
            formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
