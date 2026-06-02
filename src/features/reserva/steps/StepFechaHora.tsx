import { useState } from 'react';
import { cn } from '@/lib/cn';
import { todayBusinessDate, formatTime, parseISOToDate } from '@/lib/dates';
import { usePublicSlots } from '../hooks/usePublicSlots';
import type { PublicShop, BookingState } from '../types';

interface Props {
  shop: PublicShop;
  booking: BookingState;
  onUpdate: (p: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

function addDaysToYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

const DAY_LABELS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function StepFechaHora({ shop, booking, onUpdate, onNext, onBack }: Props) {
  const today = todayBusinessDate();
  const [selectedDate, setSelectedDate] = useState(booking.date || today);

  const slotsQuery = usePublicSlots(
    booking.barber && booking.service
      ? {
          shopId: shop.id,
          barberId: booking.barber.id,
          date: selectedDate,
          openTime: shop.open_time,
          closeTime: shop.close_time,
          slotMinutes: shop.slot_minutes,
          serviceDuration: booking.service.duration_minutes,
        }
      : null,
  );

  const days = Array.from({ length: 7 }, (_, i) => addDaysToYMD(today, i));

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-brand hover:underline">
        ← Volver
      </button>
      <h2 className="mb-1 text-xl font-bold text-gray-900">Elige fecha y hora</h2>
      <p className="mb-4 text-sm text-gray-500">Selecciona un día y el horario disponible.</p>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {days.map((d) => {
          const dt = new Date(`${d}T12:00:00Z`);
          const dowLabel = DAY_LABELS_SHORT[dt.getUTCDay()] ?? '';
          const dayNum = String(dt.getUTCDate()).padStart(2, '0');
          const isSelected = d === selectedDate;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={cn(
                'flex min-w-[52px] flex-col items-center rounded-lg border px-2 py-2 text-xs transition-colors',
                isSelected
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-200 text-gray-700 hover:border-brand/50',
              )}
            >
              <span className="font-medium">{dowLabel}</span>
              <span className="text-base font-bold">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {slotsQuery.isLoading && (
        <p className="text-sm text-gray-500">Cargando horarios disponibles...</p>
      )}
      {!slotsQuery.isLoading && (slotsQuery.data ?? []).length === 0 && (
        <p className="text-sm text-gray-400">Sin horarios disponibles para este día.</p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(slotsQuery.data ?? []).map((slot) => {
          const t = formatTime(parseISOToDate(slot.starts_at));
          const isSelected = t === booking.time && selectedDate === booking.date;
          return (
            <button
              key={slot.starts_at}
              type="button"
              onClick={() => {
                onUpdate({ date: selectedDate, time: t });
                onNext();
              }}
              className={cn(
                'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-200 text-gray-700 hover:border-brand/50',
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
