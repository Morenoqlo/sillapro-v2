import { useDayAppointments } from '@/features/citas/hooks/useDayAppointments';
import { TodayAgendaList } from '@/features/hoy/TodayAgendaList';
import { ListSkeleton } from '@/ui/Skeleton';

interface DayViewProps {
  date: string;
}

export function DayView({ date }: DayViewProps) {
  const { data, isLoading } = useDayAppointments(date);
  if (isLoading) return <ListSkeleton rows={5} />;
  return <TodayAgendaList date={date} appointments={data ?? []} />;
}
