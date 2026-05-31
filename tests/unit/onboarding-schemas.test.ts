import { describe, expect, it } from 'vitest';
import { shopSchema, barberSchema, serviceSchema } from '@/features/onboarding/schemas';

describe('shopSchema', () => {
  it('accepts valid shop data', () => {
    const result = shopSchema.safeParse({
      name: 'Norte Fino Barbería',
      timezone: 'America/Santiago',
      openTime: '09:00',
      closeTime: '20:00',
      slotMinutes: 30,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(
      shopSchema.safeParse({
        name: '',
        timezone: 'America/Santiago',
        openTime: '09:00',
        closeTime: '20:00',
        slotMinutes: 30,
      }).success,
    ).toBe(false);
  });

  it('rejects when closeTime is before openTime', () => {
    expect(
      shopSchema.safeParse({
        name: 'Foo',
        timezone: 'America/Santiago',
        openTime: '20:00',
        closeTime: '09:00',
        slotMinutes: 30,
      }).success,
    ).toBe(false);
  });
});

describe('barberSchema', () => {
  it('accepts valid barber data', () => {
    expect(barberSchema.safeParse({ fullName: 'Diego', commissionDefault: 40 }).success).toBe(
      true,
    );
  });

  it('rejects commission > 100', () => {
    expect(barberSchema.safeParse({ fullName: 'Diego', commissionDefault: 150 }).success).toBe(
      false,
    );
  });
});

describe('serviceSchema', () => {
  it('accepts valid service data', () => {
    expect(
      serviceSchema.safeParse({
        name: 'Corte',
        durationMinutes: 30,
        priceAmount: 12000,
        commissionPercent: 40,
      }).success,
    ).toBe(true);
  });

  it('rejects negative price', () => {
    expect(
      serviceSchema.safeParse({
        name: 'Corte',
        durationMinutes: 30,
        priceAmount: -100,
        commissionPercent: 40,
      }).success,
    ).toBe(false);
  });
});
