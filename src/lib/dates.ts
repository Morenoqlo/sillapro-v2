import { addMinutes as fnsAddMinutes, differenceInMinutes } from 'date-fns';

const TZ = 'America/Santiago';

/**
 * Returns YYYY-MM-DD for the given date interpreted in Santiago timezone.
 * Used as the "business date" for grouping appointments/cash by local day.
 */
export function todayBusinessDate(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value ?? '';
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const d = parts.find((p) => p.type === 'day')?.value ?? '';
  return `${y}-${m}-${d}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    timeZone: TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

export function formatDateLong(date: Date): string {
  const formatted = new Intl.DateTimeFormat('es-CL', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  // Capitalize first letter (some locales return lowercase weekday)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function minutesBetween(a: Date, b: Date): number {
  return differenceInMinutes(b, a);
}

export function addMinutes(date: Date, minutes: number): Date {
  return fnsAddMinutes(date, minutes);
}
