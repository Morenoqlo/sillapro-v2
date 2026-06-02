import { useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from 'react-router-dom';
import { useCommandPalette } from '@/app/CommandPaletteContext';
import { useNewAppointment } from '@/app/NewAppointmentModalContext';
import { useCharge } from '@/app/ChargeModalContext';
import { useClients } from '@/features/clientes/hooks/useClients';
import { useDayAppointments } from '@/features/citas/hooks/useDayAppointments';
import { todayBusinessDate, formatTime, parseISOToDate } from '@/lib/dates';
import { formatCLP } from '@/lib/money';

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { open: openNewCita } = useNewAppointment();
  const { openList: openCobrar } = useCharge();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const today = todayBusinessDate();
  const { list: clientsQ } = useClients(search.length >= 2 ? search : '');
  const { data: todayAppts = [] } = useDayAppointments(today);

  const filteredAppts = search.length >= 2
    ? todayAppts.filter((a) =>
        a.client?.full_name?.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  function close() {
    setOpen(false);
    setSearch('');
  }

  function run(fn: () => void) {
    close();
    setTimeout(fn, 50);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh]"
      onKeyDown={(e) => { if (e.key === 'Escape') close(); }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <Command className="overflow-hidden rounded-xl" shouldFilter={false}>
          <div className="flex items-center border-b border-gray-200 px-4">
            <span className="mr-2 text-gray-400">🔍</span>
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Buscar clientes, citas o acciones..."
              className="h-12 w-full border-0 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            <kbd className="ml-2 rounded border border-gray-200 bg-gray-100 px-1.5 text-xs text-gray-500">
              Esc
            </kbd>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-gray-400">
              Sin resultados para &quot;{search}&quot;
            </Command.Empty>

            <Command.Group heading="Acciones" className="mb-1">
              <CmdItem onSelect={() => run(() => openNewCita())} icon="📅" label="Nueva cita" hint="N" />
              <CmdItem onSelect={() => run(() => openCobrar())} icon="💳" label="Cobrar" hint="C" />
              <CmdItem onSelect={() => run(() => navigate('/admin/agenda'))} icon="📋" label="Ir a Agenda" />
              <CmdItem onSelect={() => run(() => navigate('/admin/caja'))} icon="🏦" label="Ir a Caja" />
              <CmdItem onSelect={() => run(() => navigate('/admin/reportes'))} icon="📊" label="Ir a Reportes" />
            </Command.Group>

            {search.length >= 2 && (clientsQ.data ?? []).length > 0 && (
              <Command.Group heading="Clientes">
                {(clientsQ.data ?? []).slice(0, 5).map((c) => (
                  <CmdItem
                    key={c.id}
                    onSelect={() => run(() => navigate(`/admin/clientes/${c.id}`))}
                    icon="👤"
                    label={c.full_name}
                    {...(c.phone ? { hint: c.phone } : {})}
                  />
                ))}
              </Command.Group>
            )}

            {search.length >= 2 && filteredAppts.length > 0 && (
              <Command.Group heading="Citas de hoy">
                {filteredAppts.slice(0, 5).map((a) => (
                  <CmdItem
                    key={a.id}
                    onSelect={close}
                    icon="✂️"
                    label={a.client?.full_name ?? '—'}
                    hint={`${formatTime(parseISOToDate(a.starts_at))} · ${a.service?.name ?? ''} · ${formatCLP(a.price_amount)}`}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}

interface CmdItemProps {
  onSelect: () => void;
  icon: string;
  label: string;
  hint?: string;
}

function CmdItem({ onSelect, icon, label, hint }: CmdItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-900 aria-selected:bg-brand/10 aria-selected:text-brand"
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </Command.Item>
  );
}
