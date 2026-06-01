import { z } from 'zod';

export const barberFormSchema = z.object({
  fullName: z.string().min(1, 'Requerido').max(80),
  chairLabel: z.string().min(1, 'Requerido').max(40),
  commissionDefault: z.number().min(0, 'Debe ser ≥ 0').max(100, 'Debe ser ≤ 100'),
});
export type BarberFormInput = z.infer<typeof barberFormSchema>;
