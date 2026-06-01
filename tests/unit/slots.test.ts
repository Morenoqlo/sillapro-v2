import { describe, expect, it } from 'vitest';
import { computeFreeSlots, type BookedRange } from '@/lib/slots';

const SHOP = {
  date: '2026-06-01',
  openTime: '09:00',
  closeTime: '12:00',
  slotMinutes: 30,
};

describe('computeFreeSlots', () => {
  it('returns all slots when no bookings (3 hours / 30min = 6 slots)', () => {
    const slots = computeFreeSlots(SHOP, []);
    expect(slots).toHaveLength(6);
    expect(slots[0]).toEqual({
      starts_at: '2026-06-01T13:00:00.000Z',
      ends_at: '2026-06-01T13:30:00.000Z',
    });
    expect(slots[5]).toEqual({
      starts_at: '2026-06-01T15:30:00.000Z',
      ends_at: '2026-06-01T16:00:00.000Z',
    });
  });

  it('excludes slots overlapping a booking', () => {
    const booked: BookedRange[] = [
      { starts_at: '2026-06-01T14:00:00.000Z', ends_at: '2026-06-01T14:30:00.000Z' },
    ];
    const slots = computeFreeSlots(SHOP, booked);
    expect(slots).toHaveLength(5);
    expect(slots.some((s) => s.starts_at === '2026-06-01T14:00:00.000Z')).toBe(false);
  });

  it('excludes multi-slot bookings (60 min booking covers 2 slots of 30 min)', () => {
    const booked: BookedRange[] = [
      { starts_at: '2026-06-01T14:00:00.000Z', ends_at: '2026-06-01T15:00:00.000Z' },
    ];
    const slots = computeFreeSlots(SHOP, booked);
    expect(slots).toHaveLength(4);
  });

  it('returns empty when no slot fits inside open hours', () => {
    const slots = computeFreeSlots(
      { ...SHOP, openTime: '09:00', closeTime: '09:15' },
      [],
    );
    expect(slots).toHaveLength(0);
  });
});
