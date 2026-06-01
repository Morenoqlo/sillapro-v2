import { z } from 'zod';

export const clientFormSchema = z.object({
  fullName: z.string().min(1, 'Requerido').max(80),
  phone: z.string().max(40),
  notes: z.string().max(500),
});
export type ClientFormInput = z.infer<typeof clientFormSchema>;
