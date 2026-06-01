import { isoForDateTimeInTZ } from './dates';

export interface ShopWindow {
  date: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
}

export interface BookedRange {
  starts_at: string;
  ends_at: string;
}

export interface FreeSlot {
  starts_at: string;
  ends_at: string;
}

function toMinutes(hm: string): number {
  const [h, m] = hm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function computeFreeSlots(window: ShopWindow, booked: BookedRange[]): FreeSlot[] {
  const openMin = toMinutes(window.openTime);
  const closeMin = toMinutes(window.closeTime);
  const slot = window.slotMinutes;
  const slots: FreeSlot[] = [];

  for (let start = openMin; start + slot <= closeMin; start += slot) {
    const end = start + slot;
    const startHM = `${String(Math.floor(start / 60)).padStart(2, '0')}:${String(start % 60).padStart(2, '0')}`;
    const endHM = `${String(Math.floor(end / 60)).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}`;
    const starts_at = isoForDateTimeInTZ(window.date, startHM);
    const ends_at = isoForDateTimeInTZ(window.date, endHM);
    slots.push({ starts_at, ends_at });
  }

  if (booked.length === 0) return slots;

  return slots.filter((s) => {
    const sStart = new Date(s.starts_at).getTime();
    const sEnd = new Date(s.ends_at).getTime();
    return !booked.some((b) => {
      const bStart = new Date(b.starts_at).getTime();
      const bEnd = new Date(b.ends_at).getTime();
      return sStart < bEnd && sEnd > bStart;
    });
  });
}
