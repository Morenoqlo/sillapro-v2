import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { ShopInput, BarberInput, ServiceInput } from '../schemas';

export interface CreateInitialShopInput {
  shop: ShopInput;
  barber: BarberInput;
  service: ServiceInput;
}

export function useCreateInitialShop() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateInitialShopInput): Promise<string> => {
      const { data, error } = await supabase.rpc('create_initial_barbershop', {
        shop_name: input.shop.name,
        shop_timezone: input.shop.timezone,
        shop_open_time: input.shop.openTime,
        shop_close_time: input.shop.closeTime,
        shop_slot_minutes: input.shop.slotMinutes,
        barber_full_name: input.barber.fullName,
        barber_commission_default: input.barber.commissionDefault,
        service_name: input.service.name,
        service_duration_minutes: input.service.durationMinutes,
        service_price_amount: input.service.priceAmount,
        service_commission_percent: input.service.commissionPercent,
      });
      if (error) throw error;
      const barbershopId = data as string;

      // Set slug if provided (RPC doesn't accept it as param)
      if (input.shop.slug) {
        const { error: slugErr } = await supabase
          .from('barbershops')
          .update({ slug: input.shop.slug })
          .eq('id', barbershopId);
        if (slugErr) {
          // Slug uniqueness conflict → user can set it in Ajustes later
          console.warn('Slug conflict during onboarding:', slugErr.message);
        }
      }

      return barbershopId;
    },
    onSuccess: () => {
      // Update cache directly so RequireOnboarded sees hasMembership=true on
      // next render (invalidate alone leaves stale cached value momentarily).
      if (user?.id) {
        qc.setQueryData(['onboarding-status', user.id], { hasMembership: true });
      }
      qc.invalidateQueries({ queryKey: ['onboarding-status'] });
      qc.invalidateQueries({ queryKey: ['tenant'] });
    },
  });
}
