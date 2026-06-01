import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import { calcPaymentTotals } from './types';
import { METHOD_LABEL } from '@/features/cobrar/types';
import type { PaymentWithRefs } from '@/features/cobrar/types';

interface PaymentsSummaryCardsProps {
  payments: PaymentWithRefs[];
}

export function PaymentsSummaryCards({ payments }: PaymentsSummaryCardsProps) {
  const { total, tips, byMethod } = calcPaymentTotals(payments);

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Total cobrado</p>
        <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(total)}</p>
        <p className="mt-1 text-xs text-gray-400">
          {payments.length} {payments.length === 1 ? 'cobro' : 'cobros'}
        </p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">Propinas</p>
        <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(tips)}</p>
        <p className="mt-1 text-xs text-gray-400">100% a barberos</p>
      </Card>
      {(['cash', 'card'] as const).map((m) => (
        <Card key={m}>
          <p className="text-xs uppercase tracking-wide text-gray-500">{METHOD_LABEL[m]}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{formatCLP(byMethod[m])}</p>
        </Card>
      ))}
    </div>
  );
}
