import { describe, expect, it } from 'vitest';
import {
  todayBusinessDate,
  formatTime,
  formatDateLong,
  minutesBetween,
  addMinutes,
} from '@/lib/dates';

describe('todayBusinessDate', () => {
  it('returns YYYY-MM-DD string for a given Date in America/Santiago', () => {
    // 2026-05-30 03:00 UTC = 2026-05-29 23:00 CLT (UTC-4 standard time)
    const d = new Date('2026-05-30T03:00:00Z');
    expect(todayBusinessDate(d)).toBe('2026-05-29');
  });

  it('handles dates near midnight Santiago correctly', () => {
    // 2026-05-30 12:00 UTC = 2026-05-30 08:00 CLT
    const d = new Date('2026-05-30T12:00:00Z');
    expect(todayBusinessDate(d)).toBe('2026-05-30');
  });
});

describe('formatTime', () => {
  it('formats Date as HH:mm in Santiago timezone', () => {
    // 2026-05-30 18:30 UTC = 14:30 CLT
    const d = new Date('2026-05-30T18:30:00Z');
    expect(formatTime(d)).toBe('14:30');
  });
});

describe('formatDateLong', () => {
  it('formats Date as Spanish long form starting with capitalized weekday', () => {
    const d = new Date('2026-05-30T16:00:00Z');
    const result = formatDateLong(d);
    expect(result).toMatch(/^[A-ZÁÉÍÓÚ]/); // starts with capital
    expect(result.toLowerCase()).toContain('mayo');
    expect(result).toContain('30');
  });
});

describe('minutesBetween', () => {
  it('returns minutes between two dates', () => {
    const a = new Date('2026-05-30T14:00:00Z');
    const b = new Date('2026-05-30T14:30:00Z');
    expect(minutesBetween(a, b)).toBe(30);
  });

  it('returns negative for past dates', () => {
    const a = new Date('2026-05-30T14:30:00Z');
    const b = new Date('2026-05-30T14:00:00Z');
    expect(minutesBetween(a, b)).toBe(-30);
  });
});

describe('addMinutes', () => {
  it('adds minutes to a Date', () => {
    const d = new Date('2026-05-30T14:00:00Z');
    expect(addMinutes(d, 30).toISOString()).toBe('2026-05-30T14:30:00.000Z');
  });
});
