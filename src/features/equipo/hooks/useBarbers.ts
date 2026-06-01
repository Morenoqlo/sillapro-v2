import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Barber } from '../types';
import type { BarberFormInput } from '../schemas';

export function useBarbers() {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  const list = useQuery({
    queryKey: ['barbers', barbershopId],
    queryFn: async (): Promise<Barber[]> => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', barbershopId!)
        .order('full_name');
      if (error) throw error;
      return data as unknown as Barber[];
    },
    enabled: !!barbershopId,
  });

  return { list, barbershopId };
}

export function useBarberMutations() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['barbers', barbershopId] });
  }

  const create = useMutation({
    mutationFn: async (input: BarberFormInput) => {
      const { error } = await supabase.from('barbers').insert({
        barbershop_id: barbershopId,
        full_name: input.fullName,
        chair_label: input.chairLabel,
        commission_default: input.commissionDefault,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BarberFormInput }) => {
      const { error } = await supabase
        .from('barbers')
        .update({
          full_name: input.fullName,
          chair_label: input.chairLabel,
          commission_default: input.commissionDefault,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from('barbers').update({ active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, toggleActive };
}
