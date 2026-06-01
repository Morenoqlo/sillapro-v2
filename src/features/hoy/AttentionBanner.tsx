import { Card } from '@/ui/Card';
import { parseISOToDate, minutesBetween } from '@/lib/dates';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface AttentionBannerProps {
  appointments: AppointmentWithRefs[];
}

export function AttentionBanner({ appointments }: AttentionBannerProps) {
  const now = new Date();
  const urgentPending = appointments.filter((a) => {
    if (a.status !== 'pending') return false;
    const mins = minutesBetween(now, parseISOToDate(a.starts_at));
    return mins >= 0 && mins <= 60;
  });

  if (urgentPending.length === 0) return null;

  return (
    <Card className="border-l-4 border-amber-500 bg-amber-50">
      <p className="text-sm font-semibold text-amber-900">
        ⚠ {urgentPending.length === 1
          ? '1 cita próxima sin confirmar'
          : `${urgentPending.length} citas próximas sin confirmar`}
      </p>
      <p className="mt-1 text-xs text-amber-800/80">
        {urgentPending
          .slice(0, 3)
          .map((a) => `${a.client?.full_name ?? '—'}`)
          .join(' · ')}
        {urgentPending.length > 3 && ` · y ${urgentPending.length - 3} más`}
      </p>
    </Card>
  );
}
