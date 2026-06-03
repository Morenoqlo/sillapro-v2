import type { PaymentMethod } from '@/features/cobrar/types';

export interface Closeout {
  id: string;
  barbershop_id: string;
  business_date: string;
  gross_amount: number;       // Ingreso del local (servicios)
  commission_amount: number;  // Comisión que va a los barberos
  net_amount: number;         // gross - commission = lo que se queda el dueño
  tips_amount: number;        // Propinas registradas (100% al barbero, pass-through)
  completed_count: number;
  no_show_count: number;
  cancelled_count: number;
  closed_at: string;
}

export interface PaymentSummary {
  method: PaymentMethod;
  amount: number;
  tip_amount: number;
}

export interface PaymentTotals {
  gross: number;
  tips: number;
  total: number;
  byMethod: Record<PaymentMethod, number>;
}

export function calcPaymentTotals(payments: PaymentSummary[]): PaymentTotals {
  const byMethod: Record<PaymentMethod, number> = {
    cash: 0,
    card: 0,
    transfer: 0,
    other: 0,
  };
  let gross = 0;
  let tips = 0;
  for (const p of payments) {
    const rowTotal = Number(p.amount) + Number(p.tip_amount);
    gross += Number(p.amount);
    tips += Number(p.tip_amount);
    byMethod[p.method] += rowTotal;
  }
  return { gross, tips, total: gross + tips, byMethod };
}
