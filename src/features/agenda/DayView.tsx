import { useDayAppointments } from '@/features/citas/hooks/useDayAppointments';
import { TodayAgendaList } from '@/features/hoy/TodayAgendaList';

interface DayViewProps {
  date: string;
}

export function DayView({ date }: DayViewProps) {
  const { data, isLoading } = useDayAppointments(date);
  if (isLoading) return <p className="text-sm text-gray-500">Cargando...</p>;
  return <TodayAgendaList date={date} appointments={data ?? []} />;
}
