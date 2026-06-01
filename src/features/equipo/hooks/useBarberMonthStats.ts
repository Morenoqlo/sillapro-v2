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

      const { data, error } = await supabase
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
        .order('starts_at', { ascending: false });

      if (error) throw error;
      const appointments = data as unknown as AppointmentWithRefs[];
      const completed = appointments.filter((a) => a.status === 'completed');
      const grossRevenue = completed.reduce((s, a) => s + Number(a.price_amount), 0);
      const barberCommission = completed.reduce(
        (s, a) => s + Math.round((Number(a.price_amount) * Number(a.commission_percent)) / 100),
        0,
      );
      return { appointments, completedCount: completed.length, grossRevenue, barberCommission };
    },
    enabled: !!barbershopId && !!barberId,
  });
}
