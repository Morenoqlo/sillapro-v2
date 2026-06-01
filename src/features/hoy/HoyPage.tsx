import { todayBusinessDate, formatDateLong, parseISOToDate, minutesBetween } from '@/lib/dates';
import { useDayAppointments } from '@/features/citas/hooks/useDayAppointments';
import { TodayAgendaList } from './TodayAgendaList';
import { NextAppointmentCard } from './NextAppointmentCard';
import { AttentionBanner } from './AttentionBanner';
import { DayKpisSidebar } from './DayKpisSidebar';

export function HoyPage() {
  const today = todayBusinessDate();
  const { data, isLoading } = useDayAppointments(today);
  const appointments = data ?? [];

  const now = new Date();
  const upcoming = appointments
    .filter(
      (a) =>
        ['pending', 'confirmed', 'in_chair'].includes(a.status) &&
        minutesBetween(now, parseISOToDate(a.starts_at)) >= 0,
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const nextAppointment = upcoming[0] ?? null;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs uppercase tracking-wide text-gray-500">Operación</p>
        <h2 className="text-2xl font-bold text-gray-900">Hoy</h2>
        <p className="mt-1 text-sm text-gray-500">{formatDateLong(new Date())}</p>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Cargando agenda...</p>}

      {!isLoading && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <AttentionBanner appointments={appointments} />
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Lo que viene</p>
              <NextAppointmentCard appointment={nextAppointment} />
            </div>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                Agenda del día ({appointments.length}{' '}
                {appointments.length === 1 ? 'cita' : 'citas'})
              </p>
              <TodayAgendaList date={today} appointments={appointments} />
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Día en números</p>
            <DayKpisSidebar appointments={appointments} />
          </div>
        </div>
      )}
    </div>
  );
}
