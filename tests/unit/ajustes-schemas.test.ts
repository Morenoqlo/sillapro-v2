import { describe, expect, it } from 'vitest';
import { shopSettingsSchema } from '@/features/ajustes/schemas';

describe('shopSettingsSchema', () => {
  const valid = {
    name: 'Norte Fino Barbería',
    slug: 'norte-fino',
    timezone: 'America/Santiago',
    openTime: '09:00',
    closeTime: '20:00',
    slotMinutes: 30,
  };

  it('accepts valid settings', () => {
    expect(shopSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(shopSettingsSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    expect(shopSettingsSchema.safeParse({ ...valid, slug: 'Norte-Fino' }).success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    expect(shopSettingsSchema.safeParse({ ...valid, slug: 'norte fino' }).success).toBe(false);
  });

  it('accepts null slug (not yet set)', () => {
    expect(shopSettingsSchema.safeParse({ ...valid, slug: null }).success).toBe(true);
  });

  it('rejects when closeTime <= openTime', () => {
    expect(
      shopSettingsSchema.safeParse({ ...valid, openTime: '20:00', closeTime: '09:00' }).success,
    ).toBe(false);
  });
});
