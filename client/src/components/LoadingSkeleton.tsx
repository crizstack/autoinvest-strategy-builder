import { Card } from '@/components/ui/card';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`bg-muted rounded-md animate-pulse ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <Card className="p-4 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </Card>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-5 w-1/6" />
          </div>
          <Skeleton className="h-4 w-full" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-6 w-full" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={`row-${rowIdx}`}
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        >
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Skeleton key={`cell-${rowIdx}-${colIdx}`} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-4 w-1/3" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-2/3" />
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-4">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>

      {/* Table */}
      <Card className="p-4">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <TableSkeleton rows={5} cols={4} />
      </Card>
    </div>
  );
}

export function StrategyBuilderSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4">
          <Skeleton className="h-6 w-2/3 mb-3" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </Card>
      </div>

      {/* Canvas */}
      <div className="lg:col-span-2">
        <Card className="p-4 h-96">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>

      {/* Config Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-4">
          <Skeleton className="h-6 w-2/3 mb-3" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-3">
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

export function BacktestResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-2/3" />
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>

      {/* Trades Table */}
      <Card className="p-4">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <TableSkeleton rows={5} cols={5} />
      </Card>
    </div>
  );
}
