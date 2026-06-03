import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';

/**
 * Updates the free-text experience_level for a barber.
 */
export function useUpdateBarberLevel(barberId: string) {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (level: string) => {
      const { error } = await supabase
        .from('barbers')
        .update({ experience_level: level })
        .eq('id', barberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['barber', barbershopId, barberId] });
      qc.invalidateQueries({ queryKey: ['barbers', barbershopId] });
    },
  });
}
