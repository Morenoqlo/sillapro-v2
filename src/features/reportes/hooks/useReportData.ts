import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTenant } from '@/hooks/useTenant';
import { todayBusinessDate } from '@/lib/dates';
import type { PaymentWithRefs } from '@/features/cobrar/types';
import type { AppointmentWithRefs } from '@/features/citas/types';
import type { ReportData, RangePreset } from '../types';

function getRangeDates(preset: RangePreset): { startDate: string; endDate: string } {
  const today = todayBusinessDate();
  const [y, m, d] = today.split('-').map(Number);
  if (preset === 'last30') {
    const start = new Date(Date.UTC(y!, m! - 1, d! - 29));
    return { startDate: start.toISOString().slice(0, 10), endDate: today };
  }
  if (preset === 'month') {
    return { startDate: `${today.slice(0, 7)}-01`, endDate: today };
  }
  // week: Mon of current week
  const dt = new Date(Date.UTC(y!, m! - 1, d!));
  const dow = dt.getUTCDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  dt.setUTCDate(dt.getUTCDate() + offset);
  return { startDate: dt.toISOString().slice(0, 10), endDate: today };
}

function buildReportData(
  payments: PaymentWithRefs[],
  appointments: AppointmentWithRefs[],
  startDate: string,
  endDate: string,
): ReportData {
  // Daily revenue map — pre-populate every date with 0
  const dailyMap: Record<string, number> = {};
  const startMs = new Date(`${startDate}T12:00:00Z`).getTime();
  const endMs = new Date(`${endDate}T12:00:00Z`).getTime();
  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    const ymd = new Date(ms).toISOString().slice(0, 10);
    dailyMap[ymd] = 0;
  }
  for (const p of payments) {
    const day = p.paid_at.slice(0, 10);
    dailyMap[day] = (dailyMap[day] ?? 0) + Number(p.amount) + Number(p.tip_amount);
  }
  const dailyRevenue = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  // Map payment.appointment_id → tip_amount (sum) to attribute tips per barber
  const tipByAppointment: Record<string, number> = {};
  for (const p of payments) {
    const t = Number(p.tip_amount) || 0;
    if (t === 0) continue;
    tipByAppointment[p.appointment_id] = (tipByAppointment[p.appointment_id] ?? 0) + t;
  }

  // Barber commissions from completed appointments, plus tips
  const barberMap: Record<
    string,
    { name: string; commission: number; revenue: number; tips: number }
  > = {};
  for (const a of appointments) {
    if (a.status !== 'completed') continue;
    const name = a.barber?.full_name ?? 'Desconocido';
    const id = a.barber_id;
    if (!barberMap[id]) barberMap[id] = { name, commission: 0, revenue: 0, tips: 0 };
    barberMap[id]!.revenue += Number(a.price_amount);
    barberMap[id]!.commission += Math.round(
      (Number(a.price_amount) * Number(a.commission_percent)) / 100,
    );
    barberMap[id]!.tips += tipByAppointment[a.id] ?? 0;
  }
  const barberCommissions = Object.values(barberMap).sort(
    (a, b) => b.commission + b.tips - (a.commission + a.tips),
  );

  // Top services by revenue
  const serviceMap: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const a of appointments) {
    if (a.status !== 'completed') continue;
    const name = a.service?.name ?? 'Desconocido';
    const id = a.service_id;
    if (!serviceMap[id]) serviceMap[id] = { name, count: 0, revenue: 0 };
    serviceMap[id]!.count += 1;
    serviceMap[id]!.revenue += Number(a.price_amount);
  }
  const topServices = Object.values(serviceMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Frequent clients by visits
  const clientMap: Record<string, { name: string; visits: number; totalSpend: number }> = {};
  for (const a of appointments) {
    if (a.status !== 'completed') continue;
    const name = a.client?.full_name ?? 'Desconocido';
    const id = a.client_id;
    if (!clientMap[id]) clientMap[id] = { name, visits: 0, totalSpend: 0 };
    clientMap[id]!.visits += 1;
    clientMap[id]!.totalSpend += Number(a.price_amount);
  }
  const frequentClients = Object.values(clientMap)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalTips = payments.reduce((s, p) => s + Number(p.tip_amount), 0);
  const totalCommissions = barberCommissions.reduce((s, b) => s + b.commission, 0);
  const totalAppointments = appointments.filter((a) => a.status === 'completed').length;

  return {
    dailyRevenue,
    barberCommissions,
    topServices,
    frequentClients,
    totalRevenue,
    totalCommissions,
    totalTips,
    totalAppointments,
  };
}

export function useReportData(preset: RangePreset) {
  const { data: tenant } = useTenant();
  const barbershopId = tenant?.barbershop_id;
  const { startDate, endDate } = getRangeDates(preset);

  return useQuery({
    queryKey: ['report', barbershopId, preset],
    queryFn: async (): Promise<ReportData> => {
      const rangeStart = new Date(`${startDate}T00:00:00-04:00`).toISOString();
      const rangeEnd = new Date(`${endDate}T24:00:00-04:00`).toISOString();

      const [paymentsRes, appointmentsRes] = await Promise.all([
        supabase
          .from('payments')
          .select('*')
          .eq('barbershop_id', barbershopId!)
          .gte('paid_at', rangeStart)
          .lt('paid_at', rangeEnd),
        supabase
          .from('appointments')
          .select(
            `*,
            client:clients(id, full_name),
            barber:barbers(id, full_name),
            service:services(id, name)`,
          )
          .eq('barbershop_id', barbershopId!)
          .gte('starts_at', rangeStart)
          .lt('starts_at', rangeEnd),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (appointmentsRes.error) throw appointmentsRes.error;

      const payments = paymentsRes.data as unknown as PaymentWithRefs[];
      const appointments = appointmentsRes.data as unknown as AppointmentWithRefs[];

      return buildReportData(payments, appointments, startDate, endDate);
    },
    enabled: !!barbershopId,
  });
}

export { getRangeDates };
