import { Card } from '@/components/ui/card';

interface HeatmapData {
  day: string;
  performance: number;
}

const generateHeatmapData = (): HeatmapData[] => {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  return days.map((day) => ({
    day,
    performance: Math.random() * 100 - 50,
  }));
};

const getHeatmapColor = (value: number): string => {
  if (value > 5) return 'bg-green-600';
  if (value > 0) return 'bg-green-500/50';
  if (value > -5) return 'bg-red-500/50';
  return 'bg-red-600';
};

export default function HeatmapWidget() {
  const data = generateHeatmapData();

  return (
    <Card className="p-6 bg-slate-900/50 border-slate-800">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Heatmap Semanal</h3>
        <p className="text-sm text-slate-400 mt-1">Performance diária (%)</p>
      </div>
      <div className="flex gap-3 items-end justify-between">
        {data.map((item, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2">
            <div
              className={`w-12 h-20 rounded-lg ${getHeatmapColor(item.performance)} transition-all hover:scale-105 cursor-pointer`}
              title={`${item.day}: ${item.performance.toFixed(2)}%`}
            />
            <span className="text-xs text-slate-400">{item.day}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 flex gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-600" />
          <span className="text-slate-400">Ganho forte</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-600" />
          <span className="text-slate-400">Perda forte</span>
        </div>
      </div>
    </Card>
  );
}
