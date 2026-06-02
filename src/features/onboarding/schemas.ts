import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const timeField = z.string().regex(timeRegex, 'Formato HH:MM');

export const shopSchema = z
  .object({
    name: z.string().min(1, 'Requerido').max(80),
    timezone: z.string().min(1),
    openTime: timeField,
    closeTime: timeField,
    slotMinutes: z.number().int().refine((v) => [10, 15, 20, 30, 45, 60].includes(v), {
      message: 'Debe ser 10, 15, 20, 30, 45 o 60',
    }),
    slug: z
      .union([
        z.literal(''),
        z.literal(null),
        z.undefined(),
        z
          .string()
          .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones')
          .min(3)
          .max(50),
      ])
      .optional(),
  })
  .refine((data) => data.openTime < data.closeTime, {
    message: 'La hora de cierre debe ser posterior a la de apertura',
    path: ['closeTime'],
  });
export type ShopInput = z.infer<typeof shopSchema>;

export const barberSchema = z.object({
  fullName: z.string().min(1, 'Requerido').max(80),
  commissionDefault: z
    .number()
    .min(0, 'Debe ser ≥ 0')
    .max(100, 'Debe ser ≤ 100'),
});
export type BarberInput = z.infer<typeof barberSchema>;

export const serviceSchema = z.object({
  name: z.string().min(1, 'Requerido').max(80),
  durationMinutes: z.number().int().min(10).max(240),
  priceAmount: z.number().min(0, 'Debe ser ≥ 0'),
  commissionPercent: z.number().min(0).max(100),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
