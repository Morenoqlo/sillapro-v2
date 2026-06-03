import { cn } from '@/lib/cn';
import { formatCLP } from '@/lib/money';
import { type PublicShop, type BookingState, priceForBarberService } from '../types';

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
      <p className="mb-4 text-sm text-gray-500">
        {booking.service
          ? `Precio puede variar según el barbero · Base: ${formatCLP(booking.service.price_amount)}`
          : 'Elige un barbero.'}
      </p>
      <ul className="space-y-2">
        {shop.barbers.map((b) => {
          const price = priceForBarberService(shop, b, booking.service);
          const basePrice = booking.service?.price_amount ?? 0;
          const hasOverride = booking.service != null && price !== basePrice;
          return (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => { onUpdate({ barber: b }); onNext(); }}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left transition-colors',
                  booking.barber?.id === b.id
                    ? 'border-brand bg-brand/5'
                    : 'border-gray-200 hover:border-brand/50',
                )}
              >
                <div>
                  <p className="font-medium text-gray-900">{b.full_name}</p>
                  {b.experience_level && (
                    <p className="text-xs uppercase tracking-wide text-brand-accent">
                      {b.experience_level}
                    </p>
                  )}
                </div>
                {booking.service && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCLP(price)}</p>
                    {hasOverride && (
                      <p className="text-xs text-gray-400">
                        {price > basePrice ? `+${formatCLP(price - basePrice)}` : `-${formatCLP(basePrice - price)}`}
                      </p>
                    )}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
