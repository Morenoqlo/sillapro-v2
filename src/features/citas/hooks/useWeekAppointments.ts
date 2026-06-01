import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { AppointmentWithRefs } from '../types';

/**
 * Returns appointments for a 7-day window starting at `weekStartDate` (Mon),
 * Santiago timezone. `weekStartDate` is YYYY-MM-DD.
 */
export function useWeekAppointments(weekStartDate: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['appointments', 'week', barbershopId, weekStartDate],
    queryFn: async (): Promise<AppointmentWithRefs[]> => {
      const start = new Date(`${weekStartDate}T00:00:00-04:00`);
      const end = new Date(start.getTime() + 7 * 24 * 3600 * 1000);

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `*,
          client:clients(id, full_name, phone),
          barber:barbers(id, full_name, chair_label),
          service:services(id, name, duration_minutes)`,
        )
        .eq('barbershop_id', barbershopId!)
        .gte('starts_at', start.toISOString())
        .lt('starts_at', end.toISOString())
        .order('starts_at');

      if (error) throw error;
      return data as unknown as AppointmentWithRefs[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
  });
}
