import { z } from 'zod';

export const serviceFormSchema = z.object({
  name: z.string().min(1, 'Requerido').max(80),
  category: z.string().min(1, 'Requerido').max(40),
  durationMinutes: z.number().int().min(10, 'Mínimo 10').max(240, 'Máximo 240'),
  priceAmount: z.number().min(0, 'Debe ser ≥ 0'),
  commissionPercent: z.number().min(0).max(100),
});
export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
