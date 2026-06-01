import { useState } from 'react';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, parseISOToDate, todayBusinessDate } from '@/lib/dates';
import { useChargeableToday } from './hooks/useChargeableToday';
import { ChargeAppointmentModal } from './ChargeAppointmentModal';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface ChargeableListModalProps {
  onClose: () => void;
}

export function ChargeableListModal({ onClose }: ChargeableListModalProps) {
  const today = todayBusinessDate();
  const { data, isLoading } = useChargeableToday(today);
  const [picked, setPicked] = useState<AppointmentWithRefs | null>(null);

  if (picked) {
    return (
      <ChargeAppointmentModal
        appointment={picked}
        onClose={() => setPicked(null)}
        onDone={() => {
          setPicked(null);
          onClose();
        }}
      />
    );
  }

  const appts = data ?? [];

  return (
    <Dialog open onClose={onClose} title="Cobrar cita" maxWidth="max-w-lg">
      {isLoading && <p className="text-sm text-gray-500">Cargando...</p>}

      {!isLoading && appts.length === 0 && (
        <EmptyState
          title="Nada por cobrar"
          description="Todas las citas de hoy ya fueron cobradas o no quedan citas activas."
        />
      )}

      {appts.length > 0 && (
        <>
          <p className="mb-3 text-xs text-gray-500">
            Elige la cita que quieres cobrar. Solo se muestran citas de hoy que no están
            completadas, canceladas ni marcadas como no asistió.
          </p>
          <ul className="divide-y divide-gray-100">
            {appts.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2">
                <span className="w-12 text-xs text-gray-500">
                  {formatTime(parseISOToDate(a.starts_at))}
                </span>
                <div className="flex-1 text-sm">
                  <p className="font-medium text-gray-900">{a.client?.full_name ?? '—'}</p>
                  <p className="text-xs text-gray-500">
                    {a.service?.name ?? '—'} · {a.barber?.full_name ?? '—'} ·{' '}
                    {formatCLP(a.price_amount)}
                  </p>
                </div>
                <AppointmentStatusBadge status={a.status} />
                <Button size="sm" variant="success" onClick={() => setPicked(a)}>
                  Cobrar
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Dialog>
  );
}
