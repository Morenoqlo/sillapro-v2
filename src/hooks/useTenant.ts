import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type MembershipRole = 'owner' | 'admin' | 'barber' | 'staff';

export type Membership = {
  barbershop_id: string;
  role: MembershipRole;
  barber_id: string | null;
  barbershop: {
    id: string;
    name: string;
    timezone: string;
    currency: string;
    slug: string | null;
    open_time: string;
    close_time: string;
    slot_minutes: number;
  };
};

/**
 * Returns the user's currently active barbershop membership.
 * For now picks the first one — multi-shop switcher is a future feature.
 */
export function useTenant() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tenant', user?.id],
    queryFn: async (): Promise<Membership | null> => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('memberships')
        .select(
          `
          barbershop_id,
          role,
          barber_id,
          barbershop:barbershops(id, name, timezone, currency, slug, open_time, close_time, slot_minutes)
        `,
        )
        .eq('user_id', user.id)
        .eq('active', true)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Membership | null;
    },
    enabled: !!user,
  });
}
