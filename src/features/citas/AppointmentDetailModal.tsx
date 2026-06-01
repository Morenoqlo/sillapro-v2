import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { formatCLP } from '@/lib/money';
import { formatTime, formatDateLong, parseISOToDate } from '@/lib/dates';
import { CancelAppointmentModal } from './CancelAppointmentModal';
import { useAppointmentMutations } from './hooks/useAppointmentMutations';
import type { AppointmentWithRefs } from './types';

interface AppointmentDetailModalProps {
  appointment: AppointmentWithRefs;
  onEdit: () => void;
  onClose: () => void;
}

export function AppointmentDetailModal({
  appointment,
  onEdit,
  onClose,
}: AppointmentDetailModalProps) {
  const { confirm, markNoShow } = useAppointmentMutations();
  const [showCancel, setShowCancel] = useState(false);

  const starts = parseISOToDate(appointment.starts_at);
  const ends = parseISOToDate(appointment.ends_at);
  const canEdit = ['pending', 'confirmed'].includes(appointment.status);
  const canConfirm = appointment.status === 'pending';
  const canCancel = ['pending', 'confirmed'].includes(appointment.status);
  const canNoShow = ['pending', 'confirmed'].includes(appointment.status);
  const canComplete = ['pending', 'confirmed', 'in_chair'].includes(appointment.status);

  async function handleConfirm() {
    try {
      await confirm.mutateAsync(appointment.id);
      toast.success('Cita confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }
  async function handleNoShow() {
    try {
      await markNoShow.mutateAsync(appointment.id);
      toast.success('Marcada como no asistió');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  if (showCancel) {
    return (
      <CancelAppointmentModal
        appointmentId={appointment.id}
        onClose={() => setShowCancel(false)}
        onDone={() => {
          setShowCancel(false);
          onClose();
        }}
      />
    );
  }

  return (
    <Dialog open onClose={onClose} title="Detalle de cita">
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">
              {appointment.client?.full_name ?? '—'}
            </p>
            {appointment.client?.phone && (
              <p className="text-xs text-gray-500">{appointment.client.phone}</p>
            )}
          </div>
          <AppointmentStatusBadge status={appointment.status} />
        </div>
        <div className="rounded-md bg-gray-50 p-3">
          <p className="text-gray-600">{appointment.service?.name ?? '—'}</p>
          <p className="mt-1 text-xs text-gray-500">
            {formatDateLong(starts)} · {formatTime(starts)} – {formatTime(ends)}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Barbero: {appointment.barber?.full_name ?? '—'}
          </p>
          <p className="mt-1 text-sm font-medium text-gray-900">
            {formatCLP(appointment.price_amount)} · comisión {appointment.commission_percent}%
          </p>
        </div>
        {appointment.note && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Nota</p>
            <p className="text-gray-700">{appointment.note}</p>
          </div>
        )}
        {appointment.status_reason && (
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Razón</p>
            <p className="text-gray-700">{appointment.status_reason}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canEdit && (
          <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
            Editar
          </Button>
        )}
        {canConfirm && (
          <Button
            type="button"
            size="sm"
            onClick={handleConfirm}
            disabled={confirm.isPending}
          >
            Confirmar
          </Button>
        )}
        {canComplete && (
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => toast.info('Disponible en Plan 1D (Cobrar)')}
          >
            ✓ Marcar + cobrar
          </Button>
        )}
        {canNoShow && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleNoShow}
            disabled={markNoShow.isPending}
          >
            No asistió
          </Button>
        )}
        {canCancel && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowCancel(true)}
          >
            Cancelar cita
          </Button>
        )}
      </div>
    </Dialog>
  );
}
