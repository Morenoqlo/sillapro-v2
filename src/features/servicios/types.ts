export interface Service {
  id: string;
  barbershop_id: string;
  name: string;
  category: string;
  duration_minutes: number;
  price_amount: number;
  commission_percent: number;
  active: boolean;
}
