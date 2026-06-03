import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Service } from '@/features/servicios/types';

export interface ServiceWithCommission extends Service {
  is_assigned: boolean;
  /** Override price for this barber+service. null = use service default. */
  override_price: number | null;
  /** Override commission for this barber+service. null = use service default. */
  override_commission: number | null;
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
        .select('service_id, price_amount, commission_percent')
        .eq('barber_id', barberId)
        .eq('barbershop_id', barbershopId!);
      if (oErr) throw oErr;

      const overrideMap = new Map<
        string,
        { price: number | null; commission: number | null }
      >();
      for (const o of overrides ?? []) {
        const row = o as {
          service_id: string;
          price_amount: number | null;
          commission_percent: number | null;
        };
        overrideMap.set(row.service_id, {
          price: row.price_amount,
          commission: row.commission_percent,
        });
      }

      return (services as unknown as Service[]).map((s) => {
        const ov = overrideMap.get(s.id);
        return {
          ...s,
          is_assigned: overrideMap.has(s.id),
          override_price: ov?.price ?? null,
          override_commission: ov?.commission ?? null,
        };
      });
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

/**
 * Updates the price/commission override for a barber+service pair.
 * Pass null in a field to clear it (use service default).
 */
export function useUpdateBarberServiceOverride(barberId: string) {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (input: {
      serviceId: string;
      price: number | null;
      commission: number | null;
    }) => {
      const { error } = await supabase
        .from('barber_services')
        .update({
          price_amount: input.price,
          commission_percent: input.commission,
        })
        .eq('barber_id', barberId)
        .eq('service_id', input.serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barber-services', barbershopId, barberId] });
    },
  });
}
