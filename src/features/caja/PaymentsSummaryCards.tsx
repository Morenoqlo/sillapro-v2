import { Card } from '@/ui/Card';
import { formatCLP } from '@/lib/money';
import { calcPaymentTotals } from './types';
import { METHOD_LABEL } from '@/features/cobrar/types';
import type { PaymentWithRefs } from '@/features/cobrar/types';

interface PaymentsSummaryCardsProps {
  payments: PaymentWithRefs[];
}

export function PaymentsSummaryCards({ payments }: PaymentsSummaryCardsProps) {
  const { gross, total, tips, byMethod } = calcPaymentTotals(payments);

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
        <p className="text-xs uppercase tracking-wide text-gray-500">Ingreso del local</p>
        <p className="mt-1 text-xl font-bold text-brand">{formatCLP(gross)}</p>
        <p className="mt-1 text-xs text-gray-400">Sin contar propinas</p>
      </Card>
      <Card className="border-green-200 bg-green-50/50">
        <p className="text-xs uppercase tracking-wide text-green-700">Propinas (no son del local)</p>
        <p className="mt-1 text-xl font-bold text-green-700">{formatCLP(tips)}</p>
        <p className="mt-1 text-xs text-green-600">100% para los barberos</p>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-gray-500">
          {METHOD_LABEL['cash']} / {METHOD_LABEL['card']}
        </p>
        <p className="mt-1 text-sm font-semibold text-gray-700">
          {formatCLP(byMethod.cash)}
          <span className="text-gray-400"> · </span>
          {formatCLP(byMethod.card)}
        </p>
      </Card>
    </div>
  );
}
