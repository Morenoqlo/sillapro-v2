import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { useClosedDays, useAddClosedDay, useDeleteClosedDay } from './hooks/useClosedDays';

function todayInSantiago(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  return `${map.year}-${map.month}-${map.day}`;
}

function tomorrowInSantiago(): string {
  const t = new Date(`${todayInSantiago()}T12:00:00`);
  t.setDate(t.getDate() + 1);
  return t.toISOString().slice(0, 10);
}

function formatDateLocal(iso: string): string {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ClosedDaysSection() {
  const today = todayInSantiago();
  const tomorrow = tomorrowInSantiago();
  const [date, setDate] = useState(tomorrow);
  const [reason, setReason] = useState('');

  const list = useClosedDays();
  const add = useAddClosedDay();
  const remove = useDeleteClosedDay();

  async function handleAdd() {
    if (!date) {
      toast.error('Elige una fecha');
      return;
    }
    if (date < today) {
      toast.error('No puedes marcar fechas pasadas');
      return;
    }
    try {
      await add.mutateAsync({ closed_date: date, reason });
      toast.success('Día marcado como cerrado');
      setReason('');
      setDate(tomorrow);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error';
      toast.error(msg.includes('duplicate') ? 'Ese día ya está marcado' : msg);
    }
  }

  async function handleDelete(id: string) {
    try {
      await remove.mutateAsync(id);
      toast.success('Día reactivado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  const upcoming = list.data ?? [];

  return (
    <Card>
      <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Días cerrados
      </h3>
      <p className="mb-4 text-xs text-gray-500">
        Los clientes no pueden reservar en estos días por tu URL pública.
      </p>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Fecha</label>
          <Input
            type="date"
            min={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Motivo (opcional)
          </label>
          <Input
            type="text"
            placeholder="Ej: feriado, vacaciones"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" onClick={handleAdd} disabled={add.isPending}>
            {add.isPending ? 'Guardando...' : 'Marcar cerrado'}
          </Button>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <p className="text-sm text-gray-400">No hay días cerrados marcados.</p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
          {upcoming.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium capitalize text-gray-900">
                  {formatDateLocal(d.closed_date)}
                </p>
                {d.reason && <p className="text-xs text-gray-500">{d.reason}</p>}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(d.id)}
                className="text-sm text-red-600 hover:underline"
                disabled={remove.isPending}
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
