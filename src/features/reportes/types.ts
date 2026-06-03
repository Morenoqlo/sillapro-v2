export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface BarberCommission {
  name: string;
  commission: number;
  revenue: number;
  tips: number;
}

export interface TopService {
  name: string;
  count: number;
  revenue: number;
}

export interface FrequentClient {
  name: string;
  visits: number;
  totalSpend: number;
}

export interface ReportData {
  dailyRevenue: DailyRevenue[];
  barberCommissions: BarberCommission[];
  topServices: TopService[];
  frequentClients: FrequentClient[];
  totalRevenue: number;
  totalCommissions: number;
  totalTips: number;
  totalAppointments: number;
}

export type RangePreset = 'week' | 'month' | 'last30';

export const RANGE_LABELS: Record<RangePreset, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  last30: 'Últimos 30 días',
};
