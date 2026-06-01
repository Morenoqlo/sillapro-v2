import { describe, expect, it } from 'vitest';
import { clientFormSchema } from '@/features/clientes/schemas';

describe('clientFormSchema', () => {
  it('accepts valid client with full data', () => {
    expect(
      clientFormSchema.safeParse({
        fullName: 'Carla Rodríguez',
        phone: '+56 9 8765 4321',
        notes: 'Prefiere mañana',
      }).success,
    ).toBe(true);
  });

  it('accepts client with only name (phone and notes optional)', () => {
    expect(clientFormSchema.safeParse({ fullName: 'Juan', phone: '', notes: '' }).success).toBe(
      true,
    );
  });

  it('rejects empty name', () => {
    expect(clientFormSchema.safeParse({ fullName: '', phone: '', notes: '' }).success).toBe(false);
  });

  it('rejects name longer than 80 chars', () => {
    expect(
      clientFormSchema.safeParse({ fullName: 'a'.repeat(81), phone: '', notes: '' }).success,
    ).toBe(false);
  });
});
