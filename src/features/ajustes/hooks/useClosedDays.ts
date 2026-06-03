import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';

export interface ClosedDay {
  id: string;
  closed_date: string; // YYYY-MM-DD
  reason: string;
}

export function useClosedDays() {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['closed-days', barbershopId],
    queryFn: async (): Promise<ClosedDay[]> => {
      if (!barbershopId) return [];
      const { data, error } = await supabase
        .from('closed_days')
        .select('id, closed_date, reason')
        .eq('barbershop_id', barbershopId)
        .order('closed_date', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ClosedDay[];
    },
    enabled: !!barbershopId,
  });
}

export function useAddClosedDay() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (input: { closed_date: string; reason?: string }) => {
      if (!barbershopId) throw new Error('Sin barbería activa');
      const { data, error } = await supabase
        .from('closed_days')
        .insert({
          barbershop_id: barbershopId,
          closed_date: input.closed_date,
          reason: input.reason ?? '',
        })
        .select('id')
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closed-days', barbershopId] });
    },
  });
}

export function useDeleteClosedDay() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('closed_days').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['closed-days', barbershopId] });
    },
  });
}
