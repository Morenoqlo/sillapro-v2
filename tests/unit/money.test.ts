import { describe, expect, it } from 'vitest';
import { formatCLP, parseCLP, calculateCommission } from '@/lib/money';

describe('formatCLP', () => {
  it('formats integer amounts with thousand separators and CLP prefix', () => {
    expect(formatCLP(18000)).toBe('$18.000');
  });

  it('handles zero', () => {
    expect(formatCLP(0)).toBe('$0');
  });

  it('rounds decimal cents away (CLP has no cents)', () => {
    expect(formatCLP(18000.6)).toBe('$18.001');
  });

  it('formats large amounts', () => {
    expect(formatCLP(1234567)).toBe('$1.234.567');
  });

  it('handles negative amounts (refunds) with leading minus', () => {
    const result = formatCLP(-5000);
    // Intl varies between '-$5.000' and '$-5.000' depending on runtime locale
    expect(result).toMatch(/^-?\$-?5\.000$/);
    expect(result.includes('-')).toBe(true);
  });
});

describe('parseCLP', () => {
  it('parses formatted string back to number', () => {
    expect(parseCLP('$18.000')).toBe(18000);
  });

  it('parses with no prefix', () => {
    expect(parseCLP('18000')).toBe(18000);
  });

  it('returns NaN for invalid input', () => {
    expect(parseCLP('abc')).toBeNaN();
  });
});

describe('calculateCommission', () => {
  it('calculates barber commission from price and percent', () => {
    expect(calculateCommission(18000, 40)).toBe(7200);
  });

  it('returns 0 when percent is 0', () => {
    expect(calculateCommission(18000, 0)).toBe(0);
  });

  it('returns full price when percent is 100', () => {
    expect(calculateCommission(18000, 100)).toBe(18000);
  });

  it('rounds to integer (CLP has no cents)', () => {
    expect(calculateCommission(10000, 33.33)).toBe(3333);
  });
});
