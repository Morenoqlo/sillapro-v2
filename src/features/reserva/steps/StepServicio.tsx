import { formatCLP } from '@/lib/money';
import { cn } from '@/lib/cn';
import type { PublicShop, BookingState } from '../types';

interface Props {
  shop: PublicShop;
  booking: BookingState;
  onUpdate: (p: Partial<BookingState>) => void;
  onNext: () => void;
}

export function StepServicio({ shop, booking, onUpdate, onNext }: Props) {
  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-gray-900">¿Qué servicio necesitas?</h2>
      <p className="mb-4 text-sm text-gray-500">Selecciona un servicio para continuar.</p>
      <ul className="space-y-2">
        {shop.services.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => { onUpdate({ service: s }); onNext(); }}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                booking.service?.id === s.id
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-brand/50',
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.duration_minutes} min</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCLP(s.price_amount)}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
