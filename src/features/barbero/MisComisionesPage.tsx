import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import { useTenant } from '@/hooks/useTenant';
import { useBarberMonthStats } from '@/features/equipo/hooks/useBarberMonthStats';

export function MisComisionesPage() {
  const { data: tenant } = useTenant();
  const barberId = tenant?.barber_id ?? '';
  const { data: stats, isLoading } = useBarberMonthStats(barberId);

  if (!barberId) {
    return (
      <EmptyState
        title="Sin perfil de barbero"
        description="Este usuario no tiene un perfil de barbero asociado."
      />
    );
  }

  if (isLoading) return <p className="text-sm text-gray-500">Cargando comisiones...</p>;

  const completed = stats?.appointments.filter((a) => a.status === 'completed') ?? [];

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Mis comisiones</h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Citas este mes</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{stats?.completedCount ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Mis comisiones</p>
          <p className="mt-1 text-2xl font-bold text-brand">
            {formatCLP(stats?.barberCommission ?? 0)}
          </p>
        </Card>
        <Card className="col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Facturado</p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {formatCLP(stats?.grossRevenue ?? 0)}
          </p>
        </Card>
      </div>

      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Desglose del mes</p>

      {completed.length === 0 && (
        <EmptyState
          title="Sin citas completadas este mes"
          description="Tus comisiones aparecerán aquí cuando completes citas."
        />
      )}

      {completed.length > 0 && (
        <Card className="overflow-hidden p-0">
          <ul>
            {completed.map((a, i) => {
              const commission = Math.round(
                (Number(a.price_amount) * Number(a.commission_percent)) / 100,
              );
              const starts = parseISOToDate(a.starts_at);
              return (
                <li
                  key={a.id}
                  className={`border-b border-gray-100 px-4 py-3 last:border-0 ${
                    i % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {a.client?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateLong(starts)} · {formatTime(starts)}
                      </p>
                      <p className="text-xs text-gray-500">{a.service?.name ?? '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{formatCLP(a.price_amount)}</p>
                      <p className="text-sm font-semibold text-brand">
                        +{formatCLP(commission)}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
