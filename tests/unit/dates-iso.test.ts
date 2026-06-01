import { describe, expect, it } from 'vitest';
import { isoForDateTimeInTZ, parseISOToDate, sameDayInTZ } from '@/lib/dates';

describe('isoForDateTimeInTZ', () => {
  it('converts Santiago local date+time to UTC ISO', () => {
    const iso = isoForDateTimeInTZ('2026-06-01', '14:30');
    expect(iso).toBe('2026-06-01T18:30:00.000Z');
  });

  it('handles midnight correctly', () => {
    const iso = isoForDateTimeInTZ('2026-06-01', '00:00');
    expect(iso).toBe('2026-06-01T04:00:00.000Z');
  });
});

describe('parseISOToDate', () => {
  it('returns a Date object from an ISO string', () => {
    const d = parseISOToDate('2026-06-01T18:30:00.000Z');
    expect(d.toISOString()).toBe('2026-06-01T18:30:00.000Z');
  });
});

describe('sameDayInTZ', () => {
  it('returns true for two dates on the same Santiago day', () => {
    const a = new Date('2026-06-01T13:00:00.000Z');
    const b = new Date('2026-06-01T23:00:00.000Z');
    expect(sameDayInTZ(a, b)).toBe(true);
  });

  it('returns false across Santiago midnight', () => {
    const a = new Date('2026-06-02T02:00:00.000Z');
    const b = new Date('2026-06-02T05:00:00.000Z');
    expect(sameDayInTZ(a, b)).toBe(false);
  });
});
