import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { computeFreeSlots, type FreeSlot } from '@/lib/slots';

interface UsePublicSlotsParams {
  shopId: string;
  barberId: string;
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  serviceDuration: number;
}

export function usePublicSlots(params: UsePublicSlotsParams | null) {
  return useQuery({
    queryKey: ['public-slots', params?.shopId, params?.barberId, params?.date],
    queryFn: async (): Promise<FreeSlot[]> => {
      if (!params) return [];
      const { shopId, barberId, date, openTime, closeTime, slotMinutes, serviceDuration } = params;

      const dayStart = new Date(`${date}T00:00:00-04:00`).toISOString();
      const dayEnd   = new Date(`${date}T24:00:00-04:00`).toISOString();

      const { data: booked, error } = await supabase
        .from('appointments')
        .select('starts_at, ends_at')
        .eq('barbershop_id', shopId)
        .eq('barber_id', barberId)
        .gte('starts_at', dayStart)
        .lt('starts_at', dayEnd);

      if (error) throw error;

      const allSlots = computeFreeSlots(
        { date, openTime, closeTime, slotMinutes },
        (booked ?? []) as { starts_at: string; ends_at: string }[],
      );

      const slotMs = slotMinutes * 60_000;
      const serviceMs = serviceDuration * 60_000;
      const slotsNeeded = Math.ceil(serviceMs / slotMs);

      if (slotsNeeded <= 1) return allSlots;

      return allSlots.filter((_slot, i) => {
        for (let j = 1; j < slotsNeeded; j++) {
          const next = allSlots[i + j];
          if (!next) return false;
          const expected = new Date(allSlots[i]!.starts_at).getTime() + j * slotMs;
          if (new Date(next.starts_at).getTime() !== expected) return false;
        }
        return true;
      });
    },
    enabled: !!params,
    staleTime: 30_000,
  });
}
