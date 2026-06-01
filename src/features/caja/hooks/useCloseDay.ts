import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';

export function useCloseDay() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (businessDate: string): Promise<string> => {
      const { data, error } = await supabase.rpc('close_business_day', {
        p_business_date: businessDate,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, businessDate) => {
      qc.invalidateQueries({ queryKey: ['closeout', barbershopId, businessDate] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
