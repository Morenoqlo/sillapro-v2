import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { AppointmentWithRefs } from '@/features/citas/types';

export function useClientAppointments(clientId: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['appointments', 'client', barbershopId, clientId],
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
        .eq('client_id', clientId)
        .order('starts_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as AppointmentWithRefs[];
    },
    enabled: !!barbershopId && !!clientId,
  });
}
