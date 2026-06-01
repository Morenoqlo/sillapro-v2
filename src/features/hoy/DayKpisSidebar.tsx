import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import { todayBusinessDate } from '@/lib/dates';
import { useTodayPayments } from '@/features/cobrar/hooks/useTodayPayments';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface DayKpisSidebarProps {
  appointments: AppointmentWithRefs[];
}

export function DayKpisSidebar({ appointments }: DayKpisSidebarProps) {
  const today = todayBusinessDate();
  const { data: payments } = useTodayPayments(today);

  const completed = appointments.filter((a) => a.status === 'completed');
  const confirmed = appointments.filter((a) => a.status === 'confirmed');
  const pending = appointments.filter((a) => a.status === 'pending');

  const paymentsList = payments ?? [];
  const grossPaid = paymentsList.reduce(
    (sum, p) => sum + Number(p.amount) + Number(p.tip_amount),
    0,
  );

  return (
    <Card>
      <div className="mb-3">
        <p className="text-xs uppercase tracking-wide text-gray-500">Caja del día</p>
        <p className="text-2xl font-bold text-gray-900">{formatCLP(grossPaid)}</p>
        <p className="text-xs text-gray-400">
          {paymentsList.length} {paymentsList.length === 1 ? 'cobro' : 'cobros'} hoy
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
