import { cn } from '@/lib/cn';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_chair'
  | 'completed'
  | 'cancelled'
  | 'no_show';

const CLASSES: Record<AppointmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_chair: 'bg-indigo-100 text-indigo-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-700',
  no_show: 'bg-red-100 text-red-800',
};

const LABELS: Record<AppointmentStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_chair: 'En silla',
  completed: 'Completada',
  cancelled: 'Cancelada',
  no_show: 'No asistió',
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
        CLASSES[status],
      )}
    >
      {LABELS[status]}
    </span>
  );
}
