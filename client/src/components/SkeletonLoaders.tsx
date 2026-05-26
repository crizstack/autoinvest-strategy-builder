import { Skeleton } from '@/components/ui/skeleton';

export function CardSkeleton() {
  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg space-y-4">
      <Skeleton className="h-6 w-1/3 bg-slate-800" />
      <Skeleton className="h-4 w-full bg-slate-800" />
      <Skeleton className="h-4 w-2/3 bg-slate-800" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3 bg-slate-800/30 rounded-lg">
          <Skeleton className="h-4 w-20 bg-slate-800" />
          <Skeleton className="h-4 w-32 bg-slate-800" />
          <Skeleton className="h-4 w-24 bg-slate-800 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-lg">
      <Skeleton className="h-6 w-1/3 mb-6 bg-slate-800" />
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton 
            key={i} 
            className="flex-1 bg-slate-800" 
            style={{ height: `${Math.random() * 100 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function WidgetSkeleton() {
  return (
    <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <Skeleton className="h-3 w-24 bg-slate-800" />
        </div>
        <Skeleton className="h-5 w-5 bg-slate-800 rounded" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WidgetSkeleton />
        <WidgetSkeleton />
      </div>
    </div>
  );
}

export function StrategyBuilderSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 bg-slate-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-slate-800 rounded" />
        ))}
      </div>

      {/* Canvas */}
      <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg p-6 min-h-96">
        <Skeleton className="h-full w-full bg-slate-800" />
      </div>

      {/* Config panel */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32 bg-slate-800" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-800" />
            <Skeleton className="h-8 w-full bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BacktestSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-slate-800 rounded" />
        ))}
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <ChartSkeleton />
      <ChartSkeleton />

      {/* Trades table */}
      <TableSkeleton rows={8} />
    </div>
  );
}
