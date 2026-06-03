import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { formatCLP } from '@/lib/money';
import { useDayCloseout } from './hooks/useDayCloseout';
import { useCloseDay } from './hooks/useCloseDay';

interface DayCloseoutPanelProps {
  date: string;
}

export function DayCloseoutPanel({ date }: DayCloseoutPanelProps) {
  const { data: closeout, isLoading } = useDayCloseout(date);
  const closeDay = useCloseDay();

  async function handleClose() {
    try {
      await closeDay.mutateAsync(date);
      toast.success('Día cerrado correctamente');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cerrar el día');
    }
  }

  if (isLoading) return null;

  if (closeout) {
    return (
      <Card className="border-l-4 border-green-500 bg-green-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-green-900">✓ Día cerrado</p>
            <p className="mt-0.5 text-xs text-green-700">
              Cerrado el {new Date(closeout.closed_at).toLocaleString('es-CL')}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs md:grid-cols-5">
          <div>
            <span className="text-gray-500">Ingreso del local</span>
            <p className="font-semibold text-gray-900">{formatCLP(closeout.gross_amount)}</p>
          </div>
          <div>
            <span className="text-gray-500">Comisiones</span>
            <p className="font-semibold text-gray-900">{formatCLP(closeout.commission_amount)}</p>
          </div>
          <div>
            <span className="text-gray-500">Neto del dueño</span>
            <p className="font-semibold text-brand">{formatCLP(closeout.net_amount)}</p>
          </div>
          <div>
            <span className="text-green-700">Propinas (barberos)</span>
            <p className="font-semibold text-green-700">{formatCLP(closeout.tips_amount)}</p>
          </div>
          <div>
            <span className="text-gray-500">Citas</span>
            <p className="font-semibold text-gray-900">
              {closeout.completed_count} ✓ · {closeout.no_show_count} ausentes ·{' '}
              {closeout.cancelled_count} cancel.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-amber-400 bg-amber-50">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-amber-900">Día abierto</p>
          <p className="mt-0.5 text-xs text-amber-700">
            Al cerrar el día se registran los totales definitivos (inmutable).
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleClose}
          disabled={closeDay.isPending}
        >
          {closeDay.isPending ? 'Cerrando...' : 'Cerrar día'}
        </Button>
      </div>
    </Card>
  );
}
