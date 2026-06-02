import { useState } from 'react';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { AppointmentStatusBadge } from '@/ui/AppointmentStatusBadge';
import { EmptyState } from '@/ui/EmptyState';
import { formatTime, parseISOToDate } from '@/lib/dates';
import { computeFreeSlots } from '@/lib/slots';
import { useTenant } from '@/hooks/useTenant';
import { useBarbers } from '@/features/equipo/hooks/useBarbers';
import { AppointmentDetailModal } from '@/features/citas/AppointmentDetailModal';
import { NewAppointmentModal } from '@/features/citas/NewAppointmentModal';
import type { AppointmentWithRefs } from '@/features/citas/types';
import type { Barber } from '@/features/equipo/types';

interface TodayAgendaListProps {
  date: string;
  appointments: AppointmentWithRefs[];
}

const BARBER_COLORS = [
  'bg-green-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-pink-500',
  'bg-cyan-500',
];

function colorForBarber(barberId: string, barbers: Barber[]): string {
  const idx = barbers.findIndex((b) => b.id === barberId);
  if (idx < 0) return 'bg-gray-400';
  return BARBER_COLORS[idx % BARBER_COLORS.length] ?? 'bg-gray-400';
}

interface Row {
  key: string;
  type: 'appt' | 'free';
  time: string;
  appt?: AppointmentWithRefs;
  freeStart?: string;
  freeEnd?: string;
}

export function TodayAgendaList({ date, appointments }: TodayAgendaListProps) {
  const { data: tenant } = useTenant();
  const { list: barbersQ } = useBarbers();
  const [detailFor, setDetailFor] = useState<AppointmentWithRefs | null>(null);
  const [editFor, setEditFor] = useState<AppointmentWithRefs | null>(null);
  const [createFromSlot, setCreateFromSlot] = useState<{ date: string; time: string } | null>(null);

  const barbers = (barbersQ.data ?? []).filter((b) => b.active);
  const shop = tenant?.barbershop;

  if (!shop) return null;

  const apptsActive = appointments.filter(
    (a) => a.status === 'pending' || a.status === 'confirmed' || a.status === 'in_chair',
  );
  const booked = apptsActive.map((a) => ({ starts_at: a.starts_at, ends_at: a.ends_at }));
  const freeSlots = computeFreeSlots(
    {
      date,
      openTime: shop.open_time,
      closeTime: shop.close_time,
      slotMinutes: shop.slot_minutes,
    },
    booked,
  );

  const rows: Row[] = [
    ...appointments.map<Row>((a) => ({
      key: `a-${a.id}`,
      type: 'appt',
      time: a.starts_at,
      appt: a,
    })),
    ...freeSlots.map<Row>((f) => ({
      key: `f-${f.starts_at}`,
      type: 'free',
      time: f.starts_at,
      freeStart: f.starts_at,
      freeEnd: f.ends_at,
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin agenda configurada"
        description="Define horario de atención en Ajustes."
      />
    );
  }

  function openCreateAt(starts_at: string) {
    const d = parseISOToDate(starts_at);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(d);
    const ymd: Record<string, string> = {};
    for (const p of parts) ymd[p.type] = p.value;
    const time = formatTime(d);
    setCreateFromSlot({ date: `${ymd.year}-${ymd.month}-${ymd.day}`, time });
  }

  return (
    <>
      <Card className="overflow-hidden p-0">
        <ul>
          {rows.map((row, i) => {
            const alt = i % 2 === 1 ? 'bg-gray-50' : 'bg-white';
            if (row.type === 'free') {
              return (
                <li
                  key={row.key}
                  className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2 ${alt} last:border-0`}
                >
                  <span className="w-12 text-xs text-gray-400">
                    {formatTime(parseISOToDate(row.freeStart!))}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-gray-200" />
                  <span className="flex-1 text-sm text-gray-400">— Libre —</span>
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => openCreateAt(row.freeStart!)}
                  >
                    + Agendar
                  </Button>
                </li>
              );
            }
            const a = row.appt!;
            const dot = colorForBarber(a.barber_id, barbers);
            return (
              <li
                key={row.key}
                className={`flex items-center gap-3 border-b border-gray-100 px-4 py-2 ${alt} last:border-0 cursor-pointer hover:bg-gray-100`}
                onClick={() => setDetailFor(a)}
              >
                <span className="w-12 text-xs text-gray-500">
                  {formatTime(parseISOToDate(a.starts_at))}
                </span>
                <span className={`h-2 w-2 rounded-full ${dot}`} />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  {a.client?.full_name ?? '—'} ·{' '}
                  <span className="font-normal text-gray-500">{a.service?.name ?? '—'}</span>
                </span>
                <AppointmentStatusBadge status={a.status} />
              </li>
            );
          })}
        </ul>
      </Card>

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
      {createFromSlot && (
        <NewAppointmentModal
          appointment={null}
          prefilled={createFromSlot}
          onClose={() => setCreateFromSlot(null)}
        />
      )}
    </>
  );
}
