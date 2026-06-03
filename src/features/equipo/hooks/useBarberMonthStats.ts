import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { todayBusinessDate } from '@/lib/dates';
import type { AppointmentWithRefs } from '@/features/citas/types';

export interface BarberMonthStats {
  appointments: AppointmentWithRefs[];
  completedCount: number;
  grossRevenue: number;
  barberCommission: number;
  barberTips: number;
}

export function useBarberMonthStats(barberId: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;
  const today = todayBusinessDate();
  const monthStart = today.slice(0, 7) + '-01';

  return useQuery({
    queryKey: ['appointments', 'barber-month', barbershopId, barberId, monthStart],
    queryFn: async (): Promise<BarberMonthStats> => {
      const rangeStart = new Date(`${monthStart}T00:00:00-04:00`).toISOString();
      const rangeEnd = new Date(`${today}T24:00:00-04:00`).toISOString();

      const [apptRes, tipRes] = await Promise.all([
        supabase
          .from('appointments')
          .select(
            `*,
            client:clients(id, full_name, phone),
            barber:barbers(id, full_name, chair_label),
            service:services(id, name, duration_minutes)`,
          )
          .eq('barbershop_id', barbershopId!)
          .eq('barber_id', barberId)
          .gte('starts_at', rangeStart)
          .lt('starts_at', rangeEnd)
          .order('starts_at', { ascending: false }),
        supabase.rpc('barber_tips_in_range', {
          p_barber_id: barberId,
          p_range_start: rangeStart,
          p_range_end: rangeEnd,
        }),
      ]);

      if (apptRes.error) throw apptRes.error;
      // Tips RPC may fail silently for unauthorized users — default to 0.
      const tipsRaw = tipRes.error ? 0 : Number(tipRes.data ?? 0);

      const appointments = apptRes.data as unknown as AppointmentWithRefs[];
      const completed = appointments.filter((a) => a.status === 'completed');
      const grossRevenue = completed.reduce((s, a) => s + Number(a.price_amount), 0);
      const barberCommission = completed.reduce(
        (s, a) => s + Math.round((Number(a.price_amount) * Number(a.commission_percent)) / 100),
        0,
      );
      return {
        appointments,
        completedCount: completed.length,
        grossRevenue,
        barberCommission,
        barberTips: tipsRaw,
      };
    },
    enabled: !!barbershopId && !!barberId,
  });
}
