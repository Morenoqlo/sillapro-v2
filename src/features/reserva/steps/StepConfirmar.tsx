import { useState } from 'react';
import { formatCLP } from '@/lib/money';
import { parseISOToDate, formatTime, formatDateLong, isoForDateTimeInTZ, addMinutes } from '@/lib/dates';
import { supabase } from '@/lib/supabase';
import type { PublicShop, BookingState } from '../types';

interface Props {
  shop: PublicShop;
  booking: BookingState;
  onBack: () => void;
  onDone: (appointmentId: string) => void;
}

export function StepConfirmar({ shop, booking, onBack, onDone }: Props) {
  const [name, setName] = useState(booking.clientName);
  const [phone, setPhone] = useState(booking.clientPhone);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (!name.trim()) { setError('Ingresa tu nombre'); return; }
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
      });
      if (rpcErr) throw rpcErr;
      onDone(data as string);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al reservar';
      setError(msg.includes('overlap') || msg.includes('exclusion')
        ? 'Ese horario ya fue reservado. Por favor elige otro.'
        : msg);
    } finally {
      setSubmitting(false);
    }
  }

  const starts = booking.date && booking.time
    ? parseISOToDate(isoForDateTimeInTZ(booking.date, booking.time))
    : null;

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-brand hover:underline">
        ← Volver
      </button>
      <h2 className="mb-1 text-xl font-bold text-gray-900">Confirmar reserva</h2>

      <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-semibold text-gray-900">{booking.service?.name}</p>
        <p className="text-gray-600">{booking.barber?.full_name}</p>
        {starts && (
          <p className="text-gray-600">
            {formatDateLong(starts)} · {formatTime(starts)}
          </p>
        )}
        <p className="mt-1 font-medium text-gray-900">
          {booking.service ? formatCLP(booking.service.price_amount) : ''}
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Teléfono (opcional — para recordatorios)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+56 9 8765 4321"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
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
