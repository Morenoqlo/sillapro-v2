import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Service } from '../types';
import type { ServiceFormInput } from '../schemas';

export function useServices() {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  const list = useQuery({
    queryKey: ['services', barbershopId],
    queryFn: async (): Promise<Service[]> => {
      const { data, error } = await supabase
        .from('services')
        .select('id, barbershop_id, name, category, duration_minutes, price_amount, commission_percent, active')
        .eq('barbershop_id', barbershopId!)
        .order('name');
      if (error) throw error;
      return data as unknown as Service[];
    },
    enabled: !!barbershopId,
  });

  return { list, barbershopId };
}

export function useServiceMutations() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['services', barbershopId] });
  }

  const create = useMutation({
    mutationFn: async (input: ServiceFormInput) => {
      const { error } = await supabase.from('services').insert({
        barbershop_id: barbershopId,
        name: input.name,
        category: input.category,
        duration_minutes: input.durationMinutes,
        price_amount: input.priceAmount,
        commission_percent: input.commissionPercent,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ServiceFormInput }) => {
      const { error } = await supabase
        .from('services')
        .update({
          name: input.name,
          category: input.category,
          duration_minutes: input.durationMinutes,
          price_amount: input.priceAmount,
          commission_percent: input.commissionPercent,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('services').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, toggleActive };
}
