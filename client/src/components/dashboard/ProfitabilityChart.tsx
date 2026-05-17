import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';

const data = [
  { week: 'Sem 1', profit: 500, loss: -200 },
  { week: 'Sem 2', profit: 800, loss: -150 },
  { week: 'Sem 3', profit: 1200, loss: -300 },
  { week: 'Sem 4', profit: 600, loss: -100 },
];

export default function ProfitabilityChart() {
  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800 col-span-2">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Ganhos vs Perdas</h3>
        <p className="text-sm text-slate-400 mt-1">Performance semanal</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis dataKey="week" stroke="#94a3b8" style={{ fontSize: '12px' }} />
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
          <Legend wrapperStyle={{ color: '#94a3b8' }} />
          <Bar dataKey="profit" fill="#10b981" name="Ganhos" />
          <Bar dataKey="loss" fill="#ef4444" name="Perdas" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
