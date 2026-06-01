export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_chair'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  barbershop_id: string;
  barber_id: string;
  client_id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  price_amount: number;
  commission_percent: number;
  note: string;
  status_reason: string;
}

export interface AppointmentWithRefs extends Appointment {
  client: { id: string; full_name: string; phone: string } | null;
  barber: { id: string; full_name: string; chair_label: string } | null;
  service: { id: string; name: string; duration_minutes: number } | null;
}
