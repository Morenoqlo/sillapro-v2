import { describe, expect, it } from 'vitest';
import { calcPaymentTotals, type PaymentSummary } from '@/features/caja/types';

describe('calcPaymentTotals', () => {
  it('returns zeros for empty payments array', () => {
    const result = calcPaymentTotals([]);
    expect(result.gross).toBe(0);
    expect(result.tips).toBe(0);
    expect(result.total).toBe(0);
    expect(result.byMethod.cash).toBe(0);
    expect(result.byMethod.card).toBe(0);
  });

  it('sums amount + tip_amount as total per payment', () => {
    const payments: PaymentSummary[] = [
      { method: 'cash', amount: 10000, tip_amount: 1000 },
      { method: 'card', amount: 15000, tip_amount: 0 },
    ];
    const result = calcPaymentTotals(payments);
    expect(result.gross).toBe(25000);
    expect(result.tips).toBe(1000);
    expect(result.total).toBe(26000);
    expect(result.byMethod.cash).toBe(11000);
    expect(result.byMethod.card).toBe(15000);
  });

  it('groups multiple payments by same method', () => {
    const payments: PaymentSummary[] = [
      { method: 'cash', amount: 5000, tip_amount: 0 },
      { method: 'cash', amount: 8000, tip_amount: 500 },
    ];
    const result = calcPaymentTotals(payments);
    expect(result.byMethod.cash).toBe(13500);
  });
});
