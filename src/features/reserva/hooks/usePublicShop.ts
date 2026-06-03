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
        .select('id, name, slug, timezone, open_time, close_time, slot_minutes, phone')
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
        .select('id, full_name, experience_level')
        .eq('barbershop_id', (shop as unknown as { id: string }).id)
        .eq('active', true)
        .order('full_name');
      if (bErr) throw bErr;

      const { data: overrides, error: oErr } = await supabase
        .from('barber_services')
        .select('barber_id, service_id, price_amount, commission_percent')
        .eq('barbershop_id', (shop as unknown as { id: string }).id);
      if (oErr) throw oErr;

      // Closed days from today onward
      const today = new Date().toISOString().slice(0, 10);
      const { data: closed, error: cdErr } = await supabase
        .from('closed_days')
        .select('closed_date')
        .eq('barbershop_id', (shop as unknown as { id: string }).id)
        .gte('closed_date', today);
      if (cdErr) throw cdErr;

      const raw = shop as unknown as {
        id: string; name: string; slug: string; timezone: string;
        open_time: string; close_time: string; slot_minutes: number; phone: string;
      };
      return {
        ...raw,
        open_time: raw.open_time.slice(0, 5),
        close_time: raw.close_time.slice(0, 5),
        services: (services ?? []) as unknown as PublicShop['services'],
        barbers: (barbers ?? []) as unknown as PublicShop['barbers'],
        barberServices: (overrides ?? []) as unknown as PublicShop['barberServices'],
        closedDates: (closed ?? []).map(
          (c) => (c as { closed_date: string }).closed_date,
        ),
      };
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}
