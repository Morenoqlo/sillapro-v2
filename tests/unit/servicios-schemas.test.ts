import { describe, expect, it } from 'vitest';
import { serviceFormSchema } from '@/features/servicios/schemas';

describe('serviceFormSchema', () => {
  it('accepts valid service', () => {
    expect(
      serviceFormSchema.safeParse({
        name: 'Corte clásico',
        category: 'Corte',
        durationMinutes: 30,
        priceAmount: 12000,
        commissionPercent: 40,
      }).success,
    ).toBe(true);
  });

  it('rejects empty name', () => {
    expect(
      serviceFormSchema.safeParse({
        name: '',
        category: 'Corte',
        durationMinutes: 30,
        priceAmount: 12000,
        commissionPercent: 40,
      }).success,
    ).toBe(false);
  });

  it('rejects duration below 10', () => {
    expect(
      serviceFormSchema.safeParse({
        name: 'X',
        category: 'Corte',
        durationMinutes: 5,
        priceAmount: 12000,
        commissionPercent: 40,
      }).success,
    ).toBe(false);
  });

  it('rejects negative price', () => {
    expect(
      serviceFormSchema.safeParse({
        name: 'X',
        category: 'Corte',
        durationMinutes: 30,
        priceAmount: -1,
        commissionPercent: 40,
      }).success,
    ).toBe(false);
  });

  it('rejects commission above 100', () => {
    expect(
      serviceFormSchema.safeParse({
        name: 'X',
        category: 'Corte',
        durationMinutes: 30,
        priceAmount: 12000,
        commissionPercent: 150,
      }).success,
    ).toBe(false);
  });
});
