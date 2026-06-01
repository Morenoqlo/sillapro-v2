import { z } from 'zod';

export const chargeFormSchema = z.object({
  method: z.enum(['cash', 'card', 'transfer', 'other']),
  tipAmount: z.number().min(0, 'Debe ser ≥ 0'),
});
export type ChargeFormInput = z.infer<typeof chargeFormSchema>;
