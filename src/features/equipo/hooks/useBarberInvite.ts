import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useCreateBarberInvite() {
  return useMutation({
    mutationFn: async (barberId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('create_barber_invite', {
        p_barber_id: barberId,
      });
      if (error) throw error;
      return data as string;
    },
  });
}
