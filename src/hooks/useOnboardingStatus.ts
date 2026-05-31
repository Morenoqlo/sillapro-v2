import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

/**
 * Returns whether the current user has at least one active membership.
 * False = needs onboarding.
 */
export function useOnboardingStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['onboarding-status', user?.id],
    queryFn: async () => {
      if (!user) return { hasMembership: false };
      const { count, error } = await supabase
        .from('memberships')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('active', true);
      if (error) throw error;
      return { hasMembership: (count ?? 0) > 0 };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
