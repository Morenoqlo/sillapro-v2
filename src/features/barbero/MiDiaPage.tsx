import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { EmptyState } from '@/ui/EmptyState';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { ListSkeleton } from '@/ui/Skeleton';
import { formatCLP } from '@/lib/money';
import { formatTime, parseISOToDate, todayBusinessDate, formatDateLong } from '@/lib/dates';
import { useTenant } from '@/hooks/useTenant';
import { useDayAppointments } from '@/features/citas/hooks/useDayAppointments';
import { useAppointmentMutations } from '@/features/citas/hooks/useAppointmentMutations';

export function MiDiaPage() {
  const { data: tenant } = useTenant();
  const barberId = tenant?.barber_id;
  const today = todayBusinessDate();
  const { data: allAppointments = [], isLoading } = useDayAppointments(today);
  const { confirm, markNoShow } = useAppointmentMutations();

  const myAppointments = barberId
    ? allAppointments.filter((a) => a.barber_id === barberId)
    : allAppointments;

  const active = myAppointments.filter((a) =>
    ['pending', 'confirmed', 'in_chair'].includes(a.status),
  );
  const done = myAppointments.filter((a) =>
    ['completed', 'cancelled', 'no_show'].includes(a.status),
  );

  async function handleConfirm(id: string) {
    try {
      await confirm.mutateAsync(id);
      toast.success('Cita confirmada');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleNoShow(id: string) {
    try {
      await markNoShow.mutateAsync(id);
      toast.success('Marcada como no asistió');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  if (isLoading) return <ListSkeleton rows={4} />;

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900">Mi día</h2>
        <p className="mt-0.5 text-sm text-gray-500">{formatDateLong(new Date())}</p>
      </div>

      {myAppointments.length === 0 && (
        <EmptyState
          title="Sin citas hoy"
          description="Cuando te asignen citas para hoy aparecerán aquí."
        />
      )}

      {active.length > 0 && (
        <>
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Pendientes</p>
          <div className="mb-4 space-y-2">
            {active.map((a) => {
              const starts = parseISOToDate(a.starts_at);
              const canConfirm = a.status === 'pending';
              const canComplete = ['pending', 'confirmed', 'in_chair'].includes(a.status);
              return (
                <Card key={a.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {a.client?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(starts)} · {a.service?.name ?? '—'}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-gray-700">
                        {formatCLP(a.price_amount)}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={a.status} />
                  </div>
                  <div className="mt-2 flex gap-2">
                    {canConfirm && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(a.id)}
                        disabled={confirm.isPending}
                      >
                        Confirmar
                      </Button>
                    )}
                    {canComplete && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => toast.info('El cobro lo hace el administrador')}
                      >
                        ✓ Lista
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleNoShow(a.id)}
                      disabled={markNoShow.isPending}
                    >
                      No asistió
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Completadas hoy</p>
          <Card className="overflow-hidden p-0">
            <ul>
              {done.map((a) => {
                const commission = Math.round(
                  (Number(a.price_amount) * Number(a.commission_percent)) / 100,
                );
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between border-b border-gray-100 px-4 py-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {a.client?.full_name ?? '—'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(parseISOToDate(a.starts_at))} · {a.service?.name ?? '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <AppointmentStatusBadge status={a.status} />
                      {a.status === 'completed' && (
                        <p className="mt-0.5 text-xs text-brand">+{formatCLP(commission)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
