export interface PublicService {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number;
}

export interface PublicBarber {
  id: string;
  full_name: string;
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
}

export interface BookingState {
  service: PublicService | null;
  barber: PublicBarber | null;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  clientName: string;
  clientPhone: string;
}
