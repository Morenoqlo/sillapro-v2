import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import type { BarberMonthStats } from './hooks/useBarberMonthStats';

interface Props {
  stats: BarberMonthStats;
  assignedServicesCount: number;
  loadingStats: boolean;
  loadingServices: boolean;
}

/**
 * 5-card KPI grid for a barber's month: citas, facturación, comisiones,
 * propinas, servicios asignados.
 */
export function BarberDetailKPIs({
  stats,
  assignedServicesCount,
  loadingStats,
  loadingServices,
}: Props) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Citas este mes</p>
        <p className="mt-1 text-xl font-bold text-gray-900">
          {loadingStats ? '...' : stats.completedCount}
        </p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Facturación</p>
        <p className="mt-1 text-xl font-bold text-gray-900">
          {loadingStats ? '...' : formatCLP(stats.grossRevenue)}
        </p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Comisiones</p>
        <p className="mt-1 text-xl font-bold text-gray-900">
          {loadingStats ? '...' : formatCLP(stats.barberCommission)}
        </p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Propinas</p>
        <p className="mt-1 text-xl font-bold text-green-700">
          {loadingStats ? '...' : formatCLP(stats.barberTips)}
        </p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Servicios asignados</p>
        <p className="mt-1 text-xl font-bold text-gray-900">
          {loadingServices ? '...' : assignedServicesCount}
        </p>
      </Card>
    </div>
  );
}
