import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { PaymentWithRefs } from '../types';

export function useTodayPayments(date: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['payments', 'day', barbershopId, date],
    queryFn: async (): Promise<PaymentWithRefs[]> => {
      const dayStart = new Date(`${date}T00:00:00-04:00`).toISOString();
      const dayEnd = new Date(`${date}T24:00:00-04:00`).toISOString();

      const { data, error } = await supabase
        .from('payments')
        .select(
          `*,
          appointment:appointments(
            id,
            client:clients(full_name),
            barber:barbers(id, full_name),
            service:services(name)
          )`,
        )
        .eq('barbershop_id', barbershopId!)
        .gte('paid_at', dayStart)
        .lt('paid_at', dayEnd)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PaymentWithRefs[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
  });
}
