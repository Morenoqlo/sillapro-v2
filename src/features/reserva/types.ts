export interface PublicService {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number;
}

export interface PublicBarber {
  id: string;
  full_name: string;
  experience_level: string; // free-text: "Senior", "Estilista", "Junior", "" ...
}

export interface BarberServiceOverride {
  barber_id: string;
  service_id: string;
  price_amount: number | null;
  commission_percent: number | null;
}

export interface PublicShop {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  open_time: string;   // HH:MM
  close_time: string;  // HH:MM
  slot_minutes: number;
  phone: string;
  services: PublicService[];
  barbers: PublicBarber[];
  /** Per-barber price/commission overrides for specific services */
  barberServices: BarberServiceOverride[];
  /** Dates (YYYY-MM-DD) the shop is closed */
  closedDates: string[];
}

export interface BookingState {
  service: PublicService | null;
  barber: PublicBarber | null;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  saveAsClient: boolean;
}

/**
 * Returns the price for a (barber, service) pair, applying the override if present.
 */
export function priceForBarberService(
  shop: Pick<PublicShop, 'barberServices'>,
  barber: { id: string } | null,
  service: PublicService | null,
): number {
  if (!service) return 0;
  if (!barber) return service.price_amount;
  const ov = shop.barberServices.find(
    (x) => x.barber_id === barber.id && x.service_id === service.id,
  );
  if (ov && ov.price_amount != null) return Number(ov.price_amount);
  return service.price_amount;
}
