import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardSkeletonProps {
  cardsCount?: number;
  showChart?: boolean;
  tableRows?: number;
}

export function DashboardSkeleton({ 
  cardsCount = 3, 
  showChart = false, 
  tableRows = 5 
}: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton (Instantly Visible, Fades Up) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-up stagger-1">
        <div>
          <ShimmerBlock className="h-8 w-48 mb-2" />
          <ShimmerBlock className="h-4 w-72" />
        </div>
      </div>

      {/* Cards Skeleton (Progressive Reveal) */}
      <div className={`grid gap-4 md:grid-cols-2 ${cardsCount >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} animate-fade-up stagger-2`}>
        {Array.from({ length: cardsCount }).map((_, i) => (
          <Card key={i} className="bg-zinc-900/40 backdrop-blur-md border-zinc-800 overflow-hidden relative shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
            <ShimmerOverlay />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-4 w-24 bg-zinc-800/80" />
              <Skeleton className="h-8 w-8 rounded-lg bg-zinc-800/80" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 bg-zinc-800/80 mb-2" />
              <div className="flex gap-2 items-center mt-1">
                <Skeleton className="h-3 w-12 bg-zinc-800/80" />
                <Skeleton className="h-3 w-24 bg-zinc-800/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart & Table Skeleton (Progressive Reveal) */}
      {showChart ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up stagger-3">
          <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800 relative overflow-hidden h-[400px]">
            <ShimmerOverlay />
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-zinc-800/80" />
            </CardHeader>
            <CardContent className="flex justify-center items-center h-[300px]">
              <div className="w-full h-full bg-zinc-800/20 rounded-lg blur-md"></div>
            </CardContent>
          </Card>
          
          <TableSkeleton rows={tableRows} className="animate-fade-up stagger-4" />
        </div>
      ) : (
        <TableSkeleton rows={tableRows} className="animate-fade-up stagger-3" />
      )}
    </div>
  );
}

function ShimmerOverlay() {
  return (
    <div className="absolute inset-0 -translate-x-[150%] animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
  );
}

function ShimmerBlock({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-zinc-800/80 rounded-md ${className}`}>
      <ShimmerOverlay />
    </div>
  );
}

function TableSkeleton({ rows, className = "" }: { rows: number, className?: string }) {
  return (
    <Card className={`bg-zinc-900/40 backdrop-blur-md border-zinc-800 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.2)] ${className}`}>
      <ShimmerOverlay />
      <CardHeader>
        <Skeleton className="h-6 w-48 bg-zinc-800/80" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between border-b border-zinc-800 pb-4">
            <Skeleton className="h-4 w-24 bg-zinc-800/80" />
            <Skeleton className="h-4 w-32 bg-zinc-800/80 hidden sm:block" />
            <Skeleton className="h-4 w-24 bg-zinc-800/80" />
          </div>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-zinc-800/50 last:border-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-zinc-800/80" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 bg-zinc-800/80" />
                  <Skeleton className="h-3 w-24 bg-zinc-800/50" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16 bg-zinc-800/80 hidden sm:block" />
                <Skeleton className="h-6 w-20 rounded-full bg-zinc-800/80" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
