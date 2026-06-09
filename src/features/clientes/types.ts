export type ClientStatus = 'active' | 'inactive' | 'blocked';

export interface Client {
  id: string;
  barbershop_id: string;
  full_name: string;
  phone: string;
  /** Optional. Filled when client opts in via public booking. */
  email: string;
  notes: string;
  status: ClientStatus;
  created_at?: string;
  updated_at?: string;
}
