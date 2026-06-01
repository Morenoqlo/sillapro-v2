import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { PaymentMethod } from '../types';

export interface ChargeInput {
  appointmentId: string;
  method: PaymentMethod;
  tipAmount: number;
}

export function useChargeAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChargeInput): Promise<string> => {
      const { data, error } = await supabase.rpc('complete_and_charge', {
        p_appointment_id: input.appointmentId,
        p_method: input.method,
        p_tip_amount: input.tipAmount,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}
