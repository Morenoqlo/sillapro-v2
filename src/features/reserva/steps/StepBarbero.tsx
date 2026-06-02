import { cn } from '@/lib/cn';
import type { PublicShop, BookingState } from '../types';

interface Props {
  shop: PublicShop;
  booking: BookingState;
  onUpdate: (p: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepBarbero({ shop, booking, onUpdate, onNext, onBack }: Props) {
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-brand hover:underline">
        ← Volver
      </button>
      <h2 className="mb-1 text-xl font-bold text-gray-900">¿Con quién quieres reservar?</h2>
      <p className="mb-4 text-sm text-gray-500">Elige un barbero.</p>
      <ul className="space-y-2">
        {shop.barbers.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => { onUpdate({ barber: b }); onNext(); }}
              className={cn(
                'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                booking.barber?.id === b.id
                  ? 'border-brand bg-brand/5'
                  : 'border-gray-200 hover:border-brand/50',
              )}
            >
              <p className="font-medium text-gray-900">{b.full_name}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
