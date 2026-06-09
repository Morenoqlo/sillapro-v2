import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
}

/**
 * Single shimmer placeholder block. Combine with width/height utility
 * classes for any shape:
 *   <Skeleton className="h-4 w-32" />
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn('animate-pulse rounded bg-gray-200', className)}
    />
  );
}

/**
 * Skeleton for a typical data table — N rows × M column placeholders.
 * Used while a query is still pending, instead of the bare "Cargando…"
 * text fallback.
 */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex gap-6">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-6 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn('h-4', c === 0 ? 'w-36' : 'w-20')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Grid de cards skeleton — para KPIs en Hoy / Reportes.
 */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/**
 * Lista vertical (Hoy agenda, MiDia, historial). Cada fila tiene avatar
 * o tiempo + título + subtítulo.
 */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}
