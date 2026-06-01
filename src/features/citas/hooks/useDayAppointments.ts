import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { AppointmentWithRefs } from '../types';

/**
 * Returns appointments whose start is within the given Santiago business day.
 * `date` is YYYY-MM-DD.
 */
export function useDayAppointments(date: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['appointments', 'day', barbershopId, date],
    queryFn: async (): Promise<AppointmentWithRefs[]> => {
      const dayStart = new Date(`${date}T00:00:00-04:00`).toISOString();
      const dayEnd = new Date(`${date}T24:00:00-04:00`).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(
          `*,
          client:clients(id, full_name, phone),
          barber:barbers(id, full_name, chair_label),
          service:services(id, name, duration_minutes)`,
        )
        .eq('barbershop_id', barbershopId!)
        .gte('starts_at', dayStart)
        .lt('starts_at', dayEnd)
        .order('starts_at');

      if (error) throw error;
      return data as unknown as AppointmentWithRefs[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
  });
}
