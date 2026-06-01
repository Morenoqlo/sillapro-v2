import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { isoForDateTimeInTZ, addMinutes } from '@/lib/dates';
import type { AppointmentFormInput } from '../schemas';

export interface CreateInput extends AppointmentFormInput {
  servicePriceAmount: number;
  serviceCommissionPercent: number;
  serviceDurationMinutes: number;
}

export interface UpdateInput extends CreateInput {
  id: string;
}

export function useAppointmentMutations() {
  const qc = useQueryClient();
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['appointments'] });
  }

  const create = useMutation({
    mutationFn: async (input: CreateInput) => {
      const starts_at = isoForDateTimeInTZ(input.date, input.time);
      const ends_at = addMinutes(new Date(starts_at), input.serviceDurationMinutes).toISOString();

      const { error } = await supabase.from('appointments').insert({
        barbershop_id: barbershopId,
        barber_id: input.barberId,
        client_id: input.clientId,
        service_id: input.serviceId,
        starts_at,
        ends_at,
        price_amount: input.servicePriceAmount,
        commission_percent: input.serviceCommissionPercent,
        note: input.note,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async (input: UpdateInput) => {
      const starts_at = isoForDateTimeInTZ(input.date, input.time);
      const ends_at = addMinutes(new Date(starts_at), input.serviceDurationMinutes).toISOString();
      const { error } = await supabase
        .from('appointments')
        .update({
          barber_id: input.barberId,
          client_id: input.clientId,
          service_id: input.serviceId,
          starts_at,
          ends_at,
          price_amount: input.servicePriceAmount,
          commission_percent: input.serviceCommissionPercent,
          note: input.note,
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const confirm = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'confirmed' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const cancel = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled', status_reason: reason })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markNoShow = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'no_show' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, confirm, cancel, markNoShow };
}
