import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import { todayBusinessDate, formatDateLong } from '@/lib/dates';
import { useTodayPayments } from '@/features/cobrar/hooks/useTodayPayments';
import { TodayPaymentsTable } from './TodayPaymentsTable';
import { METHOD_LABEL, type PaymentMethod } from '@/features/cobrar/types';

const METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];

export function CajaPage() {
  const today = todayBusinessDate();
  const { data, isLoading } = useTodayPayments(today);
  const payments = data ?? [];

  const grossPaid = payments.reduce(
    (s, p) => s + Number(p.amount) + Number(p.tip_amount),
    0,
  );
  const totalTips = payments.reduce((s, p) => s + Number(p.tip_amount), 0);
  const byMethod: Record<PaymentMethod, number> = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
  };
  for (const p of payments) {
    byMethod[p.method] += Number(p.amount) + Number(p.tip_amount);
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-gray-500">Operación</p>
        <h2 className="text-2xl font-bold text-gray-900">Caja</h2>
        <p className="mt-1 text-sm text-gray-500">{formatDateLong(new Date())}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Total cobrado</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(grossPaid)}</p>
          <p className="mt-1 text-xs text-gray-400">
            {payments.length} {payments.length === 1 ? 'cobro' : 'cobros'}
          </p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-gray-500">Propinas</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(totalTips)}</p>
          <p className="mt-1 text-xs text-gray-400">100% a barberos</p>
        </Card>
        {METHODS.slice(0, 2).map((m) => (
          <Card key={m}>
            <p className="text-xs uppercase tracking-wide text-gray-500">
              {METHOD_LABEL[m]}
            </p>
            <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(byMethod[m])}</p>
          </Card>
        ))}
      </div>

      <div className="mb-2">
        <p className="text-xs uppercase tracking-wide text-gray-500">Pagos del día</p>
      </div>
      <TodayPaymentsTable payments={payments} isLoading={isLoading} />
    </div>
  );
}
