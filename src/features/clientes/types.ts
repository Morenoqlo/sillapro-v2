export type ClientStatus = 'active' | 'inactive' | 'blocked';

export interface Client {
  id: string;
  barbershop_id: string;
  full_name: string;
  phone: string;
  notes: string;
  status: ClientStatus;
}
