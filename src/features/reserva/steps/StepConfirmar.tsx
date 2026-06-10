import { useState } from 'react';
import { formatCLP } from '@/lib/money';
import { parseISOToDate, formatTime, formatDateLong, isoForDateTimeInTZ, addMinutes } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import { type PublicShop, type BookingState, priceForBarberService } from '../types';

interface Props {
  shop: PublicShop;
  booking: BookingState;
  onBack: () => void;
  onDone: (appointmentId: string) => void;
  onUpdate: (p: Partial<BookingState>) => void;
}

export function StepConfirmar({ shop, booking, onBack, onDone, onUpdate }: Props) {
  const [name, setName] = useState(booking.clientName);
  const [phone, setPhone] = useState(booking.clientPhone);
  const [email, setEmail] = useState(booking.clientEmail);
  const [save, setSave] = useState(booking.saveAsClient);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
    if (!phone.trim()) { setError('Ingresa tu teléfono para que el local pueda contactarte'); return; }
    if (save && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('El correo no parece válido'); return;
    }
    if (!booking.service || !booking.barber || !booking.date || !booking.time) {
      setError('Faltan datos de la reserva'); return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const starts_at = isoForDateTimeInTZ(booking.date, booking.time);
      const ends_at = addMinutes(new Date(starts_at), booking.service.duration_minutes).toISOString();

      const { data, error: rpcErr } = await supabase.rpc('book_appointment_public', {
        p_barbershop_id: shop.id,
        p_barber_id:     booking.barber.id,
        p_service_id:    booking.service.id,
        p_starts_at:     starts_at,
        p_ends_at:       ends_at,
        p_client_name:   name.trim(),
        p_client_phone:  phone.trim(),
        p_client_email:  save ? email.trim() : '',
        p_save_as_client: save,
      });
      if (rpcErr) throw rpcErr;
      onUpdate({
        clientName: name.trim(),
        clientPhone: phone.trim(),
        clientEmail: save ? email.trim() : '',
        saveAsClient: save,
      });
      onDone(data as string);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reservar';
      if (msg.includes('Shop is closed')) {
        setError('Este día el local está cerrado. Vuelve atrás y elige otra fecha.');
      } else if (msg.includes('overlap') || msg.includes('exclusion')) {
        setError('Ese horario ya fue reservado. Por favor elige otro.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const starts = booking.date && booking.time
    ? parseISOToDate(isoForDateTimeInTZ(booking.date, booking.time))
    : null;
  const price = priceForBarberService(shop, booking.barber, booking.service);

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-brand hover:underline">
        ← Volver
      </button>
      <h2 className="mb-1 text-xl font-bold text-gray-900">Confirmar reserva</h2>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-semibold text-gray-900">{booking.service?.name}</p>
        <p className="text-gray-600">
          {booking.barber?.full_name}
          {booking.barber?.experience_level && (
            <span className="ml-1 text-xs uppercase tracking-wide text-brand-accent">
              · {booking.barber.experience_level}
            </span>
          )}
        </p>
        {starts && (
          <p className="text-gray-600">
            {formatDateLong(starts)} · {formatTime(starts)}
          </p>
        )}
        <p className="mt-1 font-medium text-gray-900">
          {booking.service ? formatCLP(price) : ''}
        </p>
      </div>

      <div className="mb-3 space-y-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tu nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carla Rodríguez"
            maxLength={80}
            autoComplete="name"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 8765 4321"
            maxLength={30}
            autoComplete="tel"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>

        {/* Save as client + optional email */}
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={save}
              onChange={(e) => setSave(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm">
              <span className="font-medium text-gray-900">
                Guardar mis datos para próximas reservas
              </span>
              <span className="block text-xs text-gray-500">
                Tu nombre y teléfono quedarán asociados a tu próxima cita aquí.
              </span>
            </span>
          </label>

          {save && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Correo (opcional · para recibir avisos)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.cl"
                maxLength={100}
                autoComplete="email"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
              />
            </div>
          )}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={submitting}
        className="w-full rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {submitting ? 'Reservando...' : 'Confirmar reserva'}
      </button>
    </div>
  );
}
