import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
// No leading/trailing hyphen, no consecutive hyphens.
// Must match migration 021's CHECK constraint on barbershops.slug.
const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const shopSettingsSchema = z
  .object({
    name: z.string().min(1, 'Requerido').max(80),
    slug: z
      .string()
      .regex(
        slugRegex,
        'Solo minúsculas, números y guiones; sin guiones al inicio/fin ni dobles',
      )
      .min(3, 'Mínimo 3 caracteres')
      .max(50)
      .nullable(),
    timezone: z.string().min(1),
    openTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    closeTime: z.string().regex(timeRegex, 'Formato HH:MM'),
    slotMinutes: z.number().int().refine((v) => [10, 15, 20, 30, 45, 60].includes(v), {
      message: 'Debe ser 10, 15, 20, 30, 45 o 60',
    }),
    phone: z.string().max(30).catch(''),
  })
  .refine((d) => d.openTime < d.closeTime, {
    message: 'La hora de cierre debe ser posterior a la apertura',
    path: ['closeTime'],
  });

export type ShopSettingsInput = z.infer<typeof shopSettingsSchema>;
