import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { Client } from '../types';

export function useClientDetail(clientId: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['client', barbershopId, clientId],
    queryFn: async (): Promise<Client | null> => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, barbershop_id, full_name, phone, email, notes, status, created_at, updated_at')
        .eq('id', clientId)
        .eq('barbershop_id', barbershopId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Client | null;
    },
    enabled: !!barbershopId && !!clientId,
  });
}
