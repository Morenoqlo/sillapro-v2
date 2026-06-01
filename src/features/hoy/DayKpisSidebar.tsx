import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface DayKpisSidebarProps {
  appointments: AppointmentWithRefs[];
}

export function DayKpisSidebar({ appointments }: DayKpisSidebarProps) {
  const completed = appointments.filter((a) => a.status === 'completed');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const pending = appointments.filter((a) => a.status === 'pending');
  const grossCompleted = completed.reduce((sum, a) => sum + Number(a.price_amount), 0);

  return (
    <Card>
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Caja del día</p>
        <p className="text-2xl font-bold text-gray-900">{formatCLP(grossCompleted)}</p>
        <p className="text-xs text-gray-400">
          (Sólo cobros confirmados — flujo completo en Plan 1D)
        </p>
      </div>
      <ul className="space-y-1 text-sm">
        <li className="flex justify-between">
          <span className="text-gray-600">Completadas</span>
          <span className="font-semibold">
            {completed.length} / {appointments.length}
          </span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600">Confirmadas</span>
          <span className="font-semibold">{confirmed.length}</span>
        </li>
        <li className="flex justify-between">
          <span className="text-gray-600">Pendientes</span>
          <span
            className={`font-semibold ${pending.length > 0 ? 'text-amber-700' : ''}`}
          >
            {pending.length}
          </span>
        </li>
      </ul>
    </Card>
  );
}
