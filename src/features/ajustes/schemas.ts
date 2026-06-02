import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const slugRegex = /^[a-z0-9-]+$/;

export const shopSettingsSchema = z
  .object({
    name: z.string().min(1, 'Requerido').max(80),
    slug: z
      .string()
      .regex(slugRegex, 'Solo letras minúsculas, números y guiones')
      .min(3, 'Mínimo 3 caracteres')
      .max(50)
      .nullable(),
    timezone: z.string().min(1),
    openTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    closeTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    slotMinutes: z.number().int().refine((v) => [10, 15, 20, 30, 45, 60].includes(v), {
      message: 'Debe ser 10, 15, 20, 30, 45 o 60',
    }),
  })
  .refine((d) => d.openTime < d.closeTime, {
    message: 'La hora de cierre debe ser posterior a la apertura',
    path: ['closeTime'],
  });

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
