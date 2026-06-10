import { useState } from 'react';
import { Card } from '@/ui/Card';
import { CardGridSkeleton } from '@/ui/Skeleton';
import { formatCLP } from '@/lib/money';
import { RangeToggle } from './RangeToggle';
import { DailyRevenueChart } from './DailyRevenueChart';
import { BarberCommissionsChart } from './BarberCommissionsChart';
import { TopServicesTable } from './TopServicesTable';
import { FrequentClientsTable } from './FrequentClientsTable';
import { useReportData } from './hooks/useReportData';
import type { RangePreset } from './types';

export function ReportesPage() {
  const [range, setRange] = useState<RangePreset>('week');
  const { data, isLoading } = useReportData(range);

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Operación</p>
        <h2 className="text-2xl font-bold text-gray-900">Reportes</h2>
      </div>

      <div className="mb-4">
        <RangeToggle value={range} onChange={setRange} />
      </div>

      {isLoading && (
        <div className="space-y-4">
          <CardGridSkeleton count={4} />
          <CardGridSkeleton count={2} />
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card>
              <p className="text-xs uppercase tracking-wide text-gray-500">Ingresos del local</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCLP(data.totalRevenue)}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-gray-500">Comisiones</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {formatCLP(data.totalCommissions)}
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-gray-500">Propinas</p>
              <p className="mt-1 text-xl font-bold text-green-700">
                {formatCLP(data.totalTips)}
              </p>
              <p className="text-[10px] text-gray-400">Para los barberos</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-wide text-gray-500">Citas completadas</p>
              <p className="mt-1 text-xl font-bold text-gray-900">{data.totalAppointments}</p>
            </Card>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <DailyRevenueChart data={data.dailyRevenue} />
            <BarberCommissionsChart data={data.barberCommissions} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <TopServicesTable data={data.topServices} />
            <FrequentClientsTable data={data.frequentClients} />
          </div>
        </>
      )}
    </div>
  );
}
