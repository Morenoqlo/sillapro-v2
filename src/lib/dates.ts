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

/**
 * Combines a YYYY-MM-DD date string and HH:MM time string interpreted in
 * America/Santiago timezone and returns a UTC ISO string ready for Postgres.
 * Computes the timezone offset for that specific moment (handles DST transitions).
 */
export function isoForDateTimeInTZ(dateYMD: string, timeHM: string): string {
  const naiveUTC = new Date(`${dateYMD}T${timeHM}:00.000Z`);
  const offsetMinutes = getTzOffsetMinutes(naiveUTC, TZ);
  return new Date(naiveUTC.getTime() - offsetMinutes * 60_000).toISOString();
}

export function parseISOToDate(iso: string): Date {
  return new Date(iso);
}

export function sameDayInTZ(a: Date, b: Date): boolean {
  return todayBusinessDate(a) === todayBusinessDate(b);
}

function getTzOffsetMinutes(date: Date, tz: string): number {
  const utcParts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const tzParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const toMs = (parts: Intl.DateTimeFormatPart[]) => {
    const map: Record<string, string> = {};
    for (const p of parts) map[p.type] = p.value;
    const hour = map.hour === '24' ? '00' : map.hour;
    return Date.UTC(
      Number(map.year),
      Number(map.month) - 1,
      Number(map.day),
      Number(hour),
      Number(map.minute),
      Number(map.second),
    );
  };
  return (toMs(tzParts) - toMs(utcParts)) / 60_000;
}
