import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Service } from '@/features/servicios/types';

export interface ServiceWithCommission extends Service {
  is_assigned: boolean;
}

export function useBarberServiceCommissions(barberId: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['barber-services', barbershopId, barberId],
    queryFn: async (): Promise<ServiceWithCommission[]> => {
      const { data: services, error: sErr } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', barbershopId!)
        .eq('active', true)
        .order('name');
      if (sErr) throw sErr;

      const { data: overrides, error: oErr } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId)
        .eq('barbershop_id', barbershopId!);
      if (oErr) throw oErr;

      const assignedSet = new Set(
        (overrides ?? []).map((o: { service_id: string }) => o.service_id),
      );

      return (services as unknown as Service[]).map((s) => ({
        ...s,
        is_assigned: assignedSet.has(s.id),
      }));
    },
    enabled: !!barbershopId && !!barberId,
  });
}

export function useToggleBarberService(barberId: string) {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async ({ serviceId, enabled }: { serviceId: string; enabled: boolean }) => {
      if (enabled) {
        const { error } = await supabase.from('barber_services').insert({
          barbershop_id: barbershopId,
          barber_id: barberId,
          service_id: serviceId,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('barber_services')
          .delete()
          .eq('barber_id', barberId)
          .eq('service_id', serviceId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barber-services', barbershopId, barberId] });
    },
  });
}
