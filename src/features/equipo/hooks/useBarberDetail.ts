import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Barber } from '../types';

export function useBarberDetail(barberId: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['barber', barbershopId, barberId],
    queryFn: async (): Promise<Barber | null> => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('id', barberId)
        .eq('barbershop_id', barbershopId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Barber | null;
    },
    enabled: !!barbershopId && !!barberId,
  });
}
