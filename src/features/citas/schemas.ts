import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const uuid = z.string().min(1, 'Requerido');

export const appointmentFormSchema = z.object({
  clientId: uuid,
  serviceId: uuid,
  barberId: uuid,
  date: z.string().regex(dateRegex, 'Formato YYYY-MM-DD'),
  time: z.string().regex(timeRegex, 'Formato HH:MM'),
  note: z.string().max(500).default(''),
});
export type AppointmentFormInput = z.infer<typeof appointmentFormSchema>;

export const cancelReasonSchema = z.object({
  reason: z.string().min(1, 'Indica una razón').max(500, 'Máximo 500 caracteres'),
});
export type CancelReasonInput = z.infer<typeof cancelReasonSchema>;
