import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/ui/Button';
import { todayBusinessDate, formatDateLong, parseISOToDate } from '@/lib/dates';
import { WeekView } from './WeekView';
import { DayView } from './DayView';

type Mode = 'week' | 'day';

function mondayOf(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const dayOfWeek = dt.getUTCDay();
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  dt.setUTCDate(dt.getUTCDate() + offset);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function addDaysToYMD(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function AgendaPage() {
  const today = todayBusinessDate();
  const [mode, setMode] = useState<Mode>('week');
  const [dayDate, setDayDate] = useState(today);
  const [weekStart, setWeekStart] = useState(mondayOf(today));

  const weekEnd = addDaysToYMD(weekStart, 6);

  function modeBtn(m: Mode, label: string) {
    return (
      <button
        type="button"
        onClick={() => setMode(m)}
        className={cn(
          'rounded-md px-3 py-1.5 text-sm font-medium',
          mode === m ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agenda</h2>
          <p className="mt-1 text-sm text-gray-500">
            {mode === 'week'
              ? `Semana ${weekStart} → ${weekEnd}`
              : formatDateLong(parseISOToDate(`${dayDate}T12:00:00Z`))}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {modeBtn('week', 'Semana')}
          {modeBtn('day', 'Día')}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        {mode === 'week' ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(addDaysToYMD(weekStart, -7))}
            >
              ← Anterior
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(mondayOf(today))}
            >
              Esta semana
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(addDaysToYMD(weekStart, 7))}
            >
              Siguiente →
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDayDate(addDaysToYMD(dayDate, -1))}
            >
              ← Día
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDayDate(today)}>
              Hoy
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDayDate(addDaysToYMD(dayDate, 1))}
            >
              Día →
            </Button>
            <input
              type="date"
              value={dayDate}
              onChange={(e) => setDayDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </>
        )}
      </div>

      {mode === 'week' ? <WeekView weekStartDate={weekStart} /> : <DayView date={dayDate} />}
    </div>
  );
}
