import { useState } from 'react';
import { Card } from '@/ui/Card';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { formatTime, parseISOToDate, todayBusinessDate } from '@/lib/dates';
import { useWeekAppointments } from '@/features/citas/hooks/useWeekAppointments';
import { AppointmentDetailModal } from '@/features/citas/AppointmentDetailModal';
import { NewAppointmentModal } from '@/features/citas/NewAppointmentModal';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface WeekViewProps {
  weekStartDate: string;
}

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d! + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function WeekView({ weekStartDate }: WeekViewProps) {
  const { data, isLoading } = useWeekAppointments(weekStartDate);
  const [detailFor, setDetailFor] = useState<AppointmentWithRefs | null>(null);
  const [editFor, setEditFor] = useState<AppointmentWithRefs | null>(null);

  if (isLoading) return <p className="text-sm text-gray-500">Cargando semana...</p>;

  const today = todayBusinessDate();
  const days: { ymd: string; label: string; appts: AppointmentWithRefs[] }[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = addDays(weekStartDate, i);
    const appts = (data ?? []).filter((a) => todayBusinessDate(parseISOToDate(a.starts_at)) === ymd);
    days.push({ ymd, label: DAY_LABELS[i] ?? '', appts });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-7">
        {days.map((day) => {
          const isToday = day.ymd === today;
          const [, mm, dd] = day.ymd.split('-');
          return (
            <Card
              key={day.ymd}
              className={`p-3 ${isToday ? 'border-brand bg-brand/5' : ''}`}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <p
                  className={`text-xs font-semibold uppercase tracking-wide ${isToday ? 'text-brand' : 'text-gray-500'}`}
                >
                  {day.label}
                </p>
                <p className="text-xs text-gray-400">
                  {dd}/{mm}
                </p>
              </div>
              {day.appts.length === 0 && (
                <p className="text-xs text-gray-400">Sin citas</p>
              )}
              <ul className="space-y-2">
                {day.appts.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => setDetailFor(a)}
                      className="w-full rounded-md border border-gray-100 px-2 py-1.5 text-left text-xs hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-900">
                        {formatTime(parseISOToDate(a.starts_at))} · {a.client?.full_name ?? '—'}
                      </p>
                      <div className="mt-0.5 flex items-center justify-between">
                        <span className="truncate text-gray-500">
                          {a.service?.name ?? '—'}
                        </span>
                        <AppointmentStatusBadge status={a.status} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {detailFor && (
        <AppointmentDetailModal
          appointment={detailFor}
          onEdit={() => {
            setEditFor(detailFor);
            setDetailFor(null);
          }}
          onClose={() => setDetailFor(null)}
        />
      )}
      {editFor && (
        <NewAppointmentModal
          appointment={editFor}
          onClose={() => setEditFor(null)}
        />
      )}
    </>
  );
}
