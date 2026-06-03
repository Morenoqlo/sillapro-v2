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

  const isClosed = (date: string) => shop.closedDates.includes(date);
  const selectedIsClosed = isClosed(selectedDate);

  const slotsQuery = usePublicSlots(
    booking.barber && booking.service && !selectedIsClosed
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
          const closed = isClosed(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDate(d)}
              className={cn(
                'flex min-w-[52px] flex-col items-center rounded-lg border px-2 py-2 text-xs transition-colors',
                closed && !isSelected && 'border-dashed border-red-200 bg-red-50 text-red-400',
                !closed && isSelected && 'border-brand bg-brand text-white',
                closed && isSelected && 'border-red-400 bg-red-100 text-red-700',
                !closed && !isSelected && 'border-gray-200 text-gray-700 hover:border-brand/50',
              )}
            >
              <span className="font-medium">{dowLabel}</span>
              <span className="text-base font-bold">{dayNum}</span>
              {closed && <span className="mt-0.5 text-[10px] uppercase">Cerr.</span>}
            </button>
          );
        })}
      </div>

      {selectedIsClosed && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          🚫 El local está cerrado este día. Elige otra fecha.
        </p>
      )}

      {!selectedIsClosed && slotsQuery.isLoading && (
        <p className="text-sm text-gray-500">Cargando horarios disponibles...</p>
      )}
      {!selectedIsClosed && !slotsQuery.isLoading && (slotsQuery.data ?? []).length === 0 && (
        <p className="text-sm text-gray-400">Sin horarios disponibles para este día.</p>
      )}
      <div className={cn('grid grid-cols-3 gap-2 sm:grid-cols-4', selectedIsClosed && 'hidden')}>
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
