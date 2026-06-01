export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'other';

export interface Payment {
  id: string;
  appointment_id: string;
  barbershop_id: string;
  method: PaymentMethod;
  amount: number;
  tip_amount: number;
  paid_at: string;
}

export interface PaymentWithRefs extends Payment {
  appointment: {
    id: string;
    client: { full_name: string } | null;
    barber: { id: string; full_name: string } | null;
    service: { name: string } | null;
  } | null;
}

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
  other: 'Otro',
};
