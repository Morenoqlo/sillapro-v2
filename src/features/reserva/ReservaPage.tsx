import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatCLP } from '@/lib/money';
import { formatTime, parseISOToDate, formatDateLong, isoForDateTimeInTZ } from '@/lib/dates';
import { usePublicShop } from './hooks/usePublicShop';
import { StepServicio } from './steps/StepServicio';
import { StepBarbero } from './steps/StepBarbero';
import { StepFechaHora } from './steps/StepFechaHora';
import { StepConfirmar } from './steps/StepConfirmar';
import { type BookingState, priceForBarberService } from './types';

type Step = 'servicio' | 'barbero' | 'fecha' | 'confirmar' | 'done';

const STEP_LABELS: Step[] = ['servicio', 'barbero', 'fecha', 'confirmar'];

function ProgressBar({ current }: { current: Step }) {
  const idx = STEP_LABELS.indexOf(current);
  if (idx < 0) return null;
  const pct = Math.round(((idx + 1) / STEP_LABELS.length) * 100);
  return (
    <div className="mb-6">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full bg-brand transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">Paso {idx + 1} de {STEP_LABELS.length}</p>
    </div>
  );
}

const INITIAL_BOOKING: BookingState = {
  service: null,
  barber: null,
  date: '',
  time: '',
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  saveAsClient: true,
};

export function ReservaPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: shop, isLoading, error } = usePublicShop(slug);
  const [step, setStep] = useState<Step>('servicio');
  const [booking, setBooking] = useState<BookingState>(INITIAL_BOOKING);

  function update(partial: Partial<BookingState>) {
    setBooking((prev) => ({ ...prev, ...partial }));
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">Cargando...</p>
      </div>
    );
  }
  if (error || !shop) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900">Local no encontrado</p>
          <p className="mt-2 text-gray-500">
            El link de reserva no es válido o la barbería no ha configurado su URL todavía.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'done' && booking.service && booking.barber && booking.date && booking.time) {
    const starts = parseISOToDate(isoForDateTimeInTZ(booking.date, booking.time));
    const waText = encodeURIComponent(
      `Reserva confirmada en ${shop.name}!\n` +
      `Servicio: ${booking.service.name}\n` +
      `Barbero: ${booking.barber.full_name}\n` +
      `Fecha: ${formatDateLong(starts)} a las ${formatTime(starts)}\n` +
      `Precio: ${formatCLP(priceForBarberService(shop, booking.barber, booking.service))}\n` +
      (booking.clientPhone ? `Teléfono: ${booking.clientPhone}` : ''),
    );
    const ownerWaText = encodeURIComponent(
      `Nueva reserva en ${shop.name}!\n` +
      `Cliente: ${booking.clientName}${booking.clientPhone ? ` (${booking.clientPhone})` : ''}\n` +
      `Servicio: ${booking.service?.name ?? ''}\n` +
      `Barbero: ${booking.barber?.full_name ?? ''}\n` +
      `${starts ? `Fecha: ${formatDateLong(starts)} a las ${formatTime(starts)}` : ''}\n` +
      `Precio: ${booking.service ? formatCLP(priceForBarberService(shop, booking.barber, booking.service)) : ''}`,
    );
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900">¡Reserva confirmada!</h2>
          <p className="mt-2 text-gray-600">
            {formatDateLong(starts)} · {formatTime(starts)} · {shop.name}
          </p>
          <p className="mt-1 text-gray-600">
            {booking.service.name} con {booking.barber.full_name}
          </p>
          {booking.clientPhone && (
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Enviar confirmación por WhatsApp
            </a>
          )}
          {/* Notify owner via WhatsApp if phone configured */}
          {shop.phone && (
            <a
              href={`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=${ownerWaText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-green-600 bg-white px-5 py-3 text-sm font-semibold text-green-600 hover:bg-green-50"
            >
              📩 Notificar al local
            </a>
          )}
          <button
            type="button"
            onClick={() => { setStep('servicio'); setBooking(INITIAL_BOOKING); }}
            className="mt-3 block w-full text-center text-sm text-brand hover:underline"
          >
            Hacer otra reserva
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Reservar en</p>
        <h1 className="text-lg font-bold text-gray-900">{shop.name}</h1>
      </header>
      <main className="mx-auto max-w-md px-4 py-6">
        {step !== 'done' && <ProgressBar current={step} />}

        {step === 'servicio' && (
          <StepServicio
            shop={shop}
            booking={booking}
            onUpdate={update}
            onNext={() => setStep('barbero')}
          />
        )}
        {step === 'barbero' && (
          <StepBarbero
            shop={shop}
            booking={booking}
            onUpdate={update}
            onNext={() => setStep('fecha')}
            onBack={() => setStep('servicio')}
          />
        )}
        {step === 'fecha' && (
          <StepFechaHora
            shop={shop}
            booking={booking}
            onUpdate={update}
            onNext={() => setStep('confirmar')}
            onBack={() => setStep('barbero')}
          />
        )}
        {step === 'confirmar' && (
          <StepConfirmar
            shop={shop}
            booking={booking}
            onBack={() => setStep('fecha')}
            onDone={(_id) => setStep('done')}
            onUpdate={update}
          />
        )}
      </main>
    </div>
  );
}
