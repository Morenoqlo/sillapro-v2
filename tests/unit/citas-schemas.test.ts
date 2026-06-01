import { describe, expect, it } from 'vitest';
import { appointmentFormSchema, cancelReasonSchema } from '@/features/citas/schemas';

describe('appointmentFormSchema', () => {
  const valid = {
    clientId: '11111111-1111-1111-1111-111111111111',
    serviceId: '22222222-2222-2222-2222-222222222222',
    barberId: '33333333-3333-3333-3333-333333333333',
    date: '2026-06-01',
    time: '14:30',
    note: '',
  };

  it('accepts valid data', () => {
    expect(appointmentFormSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects when clientId is empty', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, clientId: '' }).success).toBe(false);
  });

  it('rejects when serviceId is empty', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, serviceId: '' }).success).toBe(false);
  });

  it('rejects when barberId is empty', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, barberId: '' }).success).toBe(false);
  });

  it('rejects bad date format', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, date: '06/01/2026' }).success).toBe(false);
  });

  it('rejects bad time format', () => {
    expect(appointmentFormSchema.safeParse({ ...valid, time: '2:30 PM' }).success).toBe(false);
  });
});

describe('cancelReasonSchema', () => {
  it('accepts non-empty reason', () => {
    expect(cancelReasonSchema.safeParse({ reason: 'Cliente avisó' }).success).toBe(true);
  });

  it('rejects empty reason', () => {
    expect(cancelReasonSchema.safeParse({ reason: '' }).success).toBe(false);
  });

  it('rejects very long reason (>500)', () => {
    expect(cancelReasonSchema.safeParse({ reason: 'a'.repeat(501) }).success).toBe(false);
  });
});
