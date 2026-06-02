import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PublicShop } from '../types';

/**
 * Loads all public data for a barbershop by slug.
 * Uses the anon Supabase client — no auth required.
 */
export function usePublicShop(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-shop', slug],
    queryFn: async (): Promise<PublicShop | null> => {
      if (!slug) return null;

      const { data: shop, error: shopErr } = await supabase
        .from('barbershops')
        .select('id, name, slug, timezone, open_time, close_time, slot_minutes')
        .eq('slug', slug)
        .maybeSingle();
      if (shopErr) throw shopErr;
      if (!shop) return null;

      const { data: services, error: sErr } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price_amount')
        .eq('barbershop_id', (shop as unknown as { id: string }).id)
        .eq('active', true)
        .order('name');
      if (sErr) throw sErr;

      const { data: barbers, error: bErr } = await supabase
        .from('barbers')
        .select('id, full_name')
        .eq('barbershop_id', (shop as unknown as { id: string }).id)
        .eq('active', true)
        .order('full_name');
      if (bErr) throw bErr;

      const raw = shop as unknown as {
        id: string; name: string; slug: string; timezone: string;
        open_time: string; close_time: string; slot_minutes: number;
      };
      return {
        ...raw,
        open_time: raw.open_time.slice(0, 5),
        close_time: raw.close_time.slice(0, 5),
        services: (services ?? []) as unknown as PublicShop['services'],
        barbers: (barbers ?? []) as unknown as PublicShop['barbers'],
      };
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}
