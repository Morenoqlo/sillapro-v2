import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { PaymentWithRefs } from '@/features/cobrar/types';

/**
 * Returns payments whose paid_at falls in [startDate, endDate] inclusive,
 * where dates are YYYY-MM-DD in America/Santiago timezone.
 */
export function usePaymentsByRange(startDate: string, endDate: string) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useQuery({
    queryKey: ['payments', 'range', barbershopId, startDate, endDate],
    queryFn: async (): Promise<PaymentWithRefs[]> => {
      const rangeStart = new Date(`${startDate}T00:00:00-04:00`).toISOString();
      const rangeEnd = new Date(`${endDate}T24:00:00-04:00`).toISOString();

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
        .gte('paid_at', rangeStart)
        .lt('paid_at', rangeEnd)
        .order('paid_at', { ascending: false });

      if (error) throw error;
      return data as unknown as PaymentWithRefs[];
    },
    enabled: !!barbershopId,
    refetchOnWindowFocus: true,
  });
}
