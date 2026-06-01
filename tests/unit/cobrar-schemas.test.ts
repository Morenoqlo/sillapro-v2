import { describe, expect, it } from 'vitest';
import { chargeFormSchema } from '@/features/cobrar/schemas';

describe('chargeFormSchema', () => {
  it('accepts valid cash payment with 0 tip', () => {
    expect(chargeFormSchema.safeParse({ method: 'cash', tipAmount: 0 }).success).toBe(true);
  });

  it('accepts valid card with positive tip', () => {
    expect(chargeFormSchema.safeParse({ method: 'card', tipAmount: 2500 }).success).toBe(true);
  });

  it('rejects unknown method', () => {
    expect(chargeFormSchema.safeParse({ method: 'bitcoin', tipAmount: 0 }).success).toBe(false);
  });

  it('rejects negative tip', () => {
    expect(chargeFormSchema.safeParse({ method: 'cash', tipAmount: -1 }).success).toBe(false);
  });

  it('rejects non-number tip', () => {
    expect(
      chargeFormSchema.safeParse({ method: 'cash', tipAmount: 'abc' as unknown as number }).success,
    ).toBe(false);
  });
});
