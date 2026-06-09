import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface Props {
  appointments: AppointmentWithRefs[];
  loading: boolean;
}

/**
 * Tab "Historial del mes": tabla con cada cita del barbero del mes actual,
 * cliente, servicio, precio y comisión calculada.
 */
export function BarberHistoryTab({ appointments, loading }: Props) {
  if (loading) return <p className="text-sm text-gray-500">Cargando historial...</p>;

  if (appointments.length === 0) {
    return (
      <EmptyState
        title="Sin citas este mes"
        description="Las citas completadas en el mes actual aparecerán aquí."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Fecha</th>
            <th className="px-4 py-2 font-medium">Cliente</th>
            <th className="px-4 py-2 font-medium">Servicio</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 text-right font-medium">Precio</th>
            <th className="px-4 py-2 text-right font-medium">Comisión</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((a) => {
            const commission = Math.round(
              (Number(a.price_amount) * Number(a.commission_percent)) / 100,
            );
            const starts = parseISOToDate(a.starts_at);
            return (
              <tr key={a.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-600">
                  <p>{formatDateLong(starts)}</p>
                  <p className="text-xs text-gray-400">{formatTime(starts)}</p>
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {a.client?.full_name ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-600">{a.service?.name ?? '—'}</td>
                <td className="px-4 py-2">
                  <AppointmentStatusBadge status={a.status} />
                </td>
                <td className="px-4 py-2 text-right text-gray-700">
                  {formatCLP(a.price_amount)}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {a.status === 'completed' ? formatCLP(commission) : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
