export interface Barber {
  id: string;
  barbershop_id: string;
  full_name: string;
  chair_label: string;
  commission_default: number;
  active: boolean;
  /** Free-text level shown in profile and public reservation. "" if unset. */
  experience_level: string;
}
