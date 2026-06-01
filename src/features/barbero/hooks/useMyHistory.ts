import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { AppointmentWithRefs } from '@/features/citas/types';

export function useMyHistory() {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;
  const barberId = tenant?.barber_id;

  return useQuery({
    queryKey: ['my-history', barbershopId, barberId],
    queryFn: async (): Promise<AppointmentWithRefs[]> => {
      const { data, error } = await supabase
        .from('appointments')
        .select(
          `*,
          client:clients(id, full_name, phone),
          barber:barbers(id, full_name, chair_label),
          service:services(id, name, duration_minutes)`,
        )
        .eq('barbershop_id', barbershopId!)
        .eq('barber_id', barberId!)
        .in('status', ['completed', 'cancelled', 'no_show'])
        .order('starts_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as unknown as AppointmentWithRefs[];
    },
    enabled: !!barbershopId && !!barberId,
  });
}
