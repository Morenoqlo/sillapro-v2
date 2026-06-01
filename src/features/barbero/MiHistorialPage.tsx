import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import { useMyHistory } from './hooks/useMyHistory';

export function MiHistorialPage() {
  const { data: appointments = [], isLoading } = useMyHistory();

  if (isLoading) return <p className="text-sm text-gray-500">Cargando historial...</p>;
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Sin historial aún"
        description="Tus citas completadas, canceladas o no asistidas aparecerán aquí."
      />
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-gray-900">Mi historial</h2>
      <Card className="overflow-hidden p-0">
        <ul>
          {appointments.map((a, i) => {
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
                  <div className="flex flex-col items-end gap-1">
                    <AppointmentStatusBadge status={a.status} />
                    <p className="text-sm font-medium text-gray-900">
                      {formatCLP(a.price_amount)}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
