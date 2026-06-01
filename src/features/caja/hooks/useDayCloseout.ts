import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Closeout } from '../types';

/** Returns the closeout record for a given YYYY-MM-DD business date, or null. */
export function useDayCloseout(date: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['closeout', barbershopId, date],
    queryFn: async (): Promise<Closeout | null> => {
      const { data, error } = await supabase
        .from('cash_closeouts')
        .select('*')
        .eq('barbershop_id', barbershopId!)
        .eq('business_date', date)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Closeout | null;
    },
    enabled: !!barbershopId,
  });
}
