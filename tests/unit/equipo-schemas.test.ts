import { describe, expect, it } from 'vitest';
import { barberFormSchema } from '@/features/equipo/schemas';

describe('barberFormSchema', () => {
  it('accepts valid barber', () => {
    expect(
      barberFormSchema.safeParse({
        fullName: 'Diego',
        chairLabel: 'Silla 1',
        commissionDefault: 40,
      }).success,
    ).toBe(true);
  });

  it('rejects empty name', () => {
    expect(
      barberFormSchema.safeParse({
        fullName: '',
        chairLabel: 'Silla 1',
        commissionDefault: 40,
      }).success,
    ).toBe(false);
  });

  it('rejects commission above 100', () => {
    expect(
      barberFormSchema.safeParse({
        fullName: 'Diego',
        chairLabel: 'Silla 1',
        commissionDefault: 120,
      }).success,
    ).toBe(false);
  });

  it('rejects negative commission', () => {
    expect(
      barberFormSchema.safeParse({
        fullName: 'Diego',
        chairLabel: 'Silla 1',
        commissionDefault: -5,
      }).success,
    ).toBe(false);
  });
});
