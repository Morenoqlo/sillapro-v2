import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { TableSkeleton } from '@/ui/Skeleton';
import { formatCLP } from '@/lib/money';
import { formatTime, parseISOToDate } from '@/lib/dates';
import { METHOD_LABEL, type PaymentWithRefs } from '@/features/cobrar/types';

interface TodayPaymentsTableProps {
  payments: PaymentWithRefs[];
  isLoading: boolean;
}

export function TodayPaymentsTable({ payments, isLoading }: TodayPaymentsTableProps) {
  if (isLoading) return <TableSkeleton rows={5} cols={5} />;

  if (payments.length === 0) {
    return (
      <EmptyState
        title="Sin cobros aún"
        description="Cuando cobres una cita, aparecerá aquí."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Hora</th>
            <th className="px-4 py-2 font-medium">Cliente</th>
            <th className="px-4 py-2 font-medium">Servicio</th>
            <th className="px-4 py-2 font-medium">Barbero</th>
            <th className="px-4 py-2 font-medium">Método</th>
            <th className="px-4 py-2 text-right font-medium">Monto</th>
            <th className="px-4 py-2 text-right font-medium">Propina</th>
            <th className="px-4 py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => {
            const total = Number(p.amount) + Number(p.tip_amount);
            return (
              <tr key={p.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-2 text-gray-600">
                  {formatTime(parseISOToDate(p.paid_at))}
                </td>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {p.appointment?.client?.full_name ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {p.appointment?.service?.name ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-600">
                  {p.appointment?.barber?.full_name ?? '—'}
                </td>
                <td className="px-4 py-2 text-gray-600">{METHOD_LABEL[p.method]}</td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {formatCLP(p.amount)}
                </td>
                <td className="px-4 py-2 text-right text-gray-600">
                  {Number(p.tip_amount) > 0 ? formatCLP(p.tip_amount) : '—'}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-gray-900">
                  {formatCLP(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
