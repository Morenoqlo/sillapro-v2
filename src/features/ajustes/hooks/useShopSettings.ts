import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import type { ShopSettingsInput } from '../schemas';

export interface ShopSettings {
  id: string;
  name: string;
  slug: string | null;
  timezone: string;
  open_time: string;
  close_time: string;
  slot_minutes: number;
}

export function useShopSettings() {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  const query = useQuery({
    queryKey: ['shop-settings', barbershopId],
    queryFn: async (): Promise<ShopSettings> => {
      const { data, error } = await supabase
        .from('barbershops')
        .select('id, name, slug, timezone, open_time, close_time, slot_minutes')
        .eq('id', barbershopId!)
        .single();
      if (error) throw error;
      const raw = data as unknown as ShopSettings;
      // Postgres TIME columns return "HH:MM:SS" — strip seconds to match HH:MM schema
      return {
        ...raw,
        open_time: raw.open_time.slice(0, 5),
        close_time: raw.close_time.slice(0, 5),
      };
    },
    enabled: !!barbershopId,
  });

  return { query, barbershopId };
}

export function useUpdateShopSettings() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  return useMutation({
    mutationFn: async (input: ShopSettingsInput) => {
      const { error } = await supabase
        .from('barbershops')
        .update({
          name: input.name,
          slug: input.slug ?? null,
          timezone: input.timezone,
          open_time: input.openTime,
          close_time: input.closeTime,
          slot_minutes: input.slotMinutes,
        })
        .eq('id', barbershopId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] });
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['shop-settings', barbershopId] });
    },
  });
}
