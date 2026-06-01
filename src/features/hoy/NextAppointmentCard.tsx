import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { formatTime, parseISOToDate, minutesBetween } from '@/lib/dates';
import { formatCLP } from '@/lib/money';
import { useCharge } from '@/app/ChargeModalContext';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface NextAppointmentCardProps {
  appointment: AppointmentWithRefs | null;
}

export function NextAppointmentCard({ appointment }: NextAppointmentCardProps) {
  const { openFor: openCharge } = useCharge();

  if (!appointment) {
    return (
      <Card>
        <p className="text-sm text-gray-500">No tienes citas próximas.</p>
      </Card>
    );
  }

  const now = new Date();
  const starts = parseISOToDate(appointment.starts_at);
  const ends = parseISOToDate(appointment.ends_at);
  const mins = minutesBetween(now, starts);
  const inLabel =
    mins < 0
      ? `Hace ${Math.abs(mins)} min`
      : mins < 60
        ? `En ${mins} min`
        : `En ${Math.floor(mins / 60)}h ${mins % 60}m`;

  return (
    <Card className="flex items-center gap-4 p-4">
      <div className="min-w-[80px] rounded-md bg-gray-900 px-3 py-2 text-center text-white">
        <p className="text-[10px] uppercase tracking-wide opacity-70">
          {mins < 0 ? 'Hace' : 'En'}
        </p>
        <p className="text-sm font-bold">{inLabel.replace(/^(En |Hace )/, '')}</p>
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">
          {appointment.client?.full_name ?? '—'} · {appointment.service?.name ?? '—'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          {formatTime(starts)} – {formatTime(ends)} · con {appointment.barber?.full_name ?? '—'} ·{' '}
          {formatCLP(appointment.price_amount)}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="success" onClick={() => openCharge(appointment)}>
          ✓ Marcar + cobrar
        </Button>
      </div>
    </Card>
  );
}
