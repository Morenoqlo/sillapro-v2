import { METHOD_LABEL, type PaymentWithRefs } from '@/features/cobrar/types';

/**
 * Escape a value for CSV (RFC 4180): wrap in quotes if it contains
 * comma/quote/newline; double any embedded quotes.
 */
function csvField(value: string | number): string {
  const s = String(value);
  if (/[,"\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const HEADERS = [
  'Fecha',
  'Hora',
  'Cliente',
  'Barbero',
  'Servicio',
  'Método',
  'Monto',
  'Propina',
  'Total',
];

/**
 * Builds a CSV string from a payments list. Used by CajaPage's
 * "Exportar CSV" button.
 *
 * The output is intentionally simple (no BOM, plain UTF-8) so it
 * imports cleanly into Google Sheets and Excel via "Importar texto".
 * For Excel with regional comma-as-decimal, the user can also use
 * "Datos → Texto en columnas".
 */
export function paymentsToCSV(payments: PaymentWithRefs[]): string {
  const rows = [HEADERS.map(csvField).join(',')];

  for (const p of payments) {
    const dt = new Date(p.paid_at);
    const fecha = dt.toLocaleDateString('es-CL');
    const hora = dt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
    const cliente = p.appointment?.client?.full_name ?? '';
    const barbero = p.appointment?.barber?.full_name ?? '';
    const servicio = p.appointment?.service?.name ?? '';
    const metodo = METHOD_LABEL[p.method];
    const monto = Number(p.amount);
    const propina = Number(p.tip_amount);
    const total = monto + propina;

    rows.push(
      [fecha, hora, cliente, barbero, servicio, metodo, monto, propina, total]
        .map(csvField)
        .join(','),
    );
  }

  return rows.join('\n') + '\n';
}

/**
 * Triggers a download of the payments CSV in the browser.
 */
export function downloadPaymentsCSV(
  payments: PaymentWithRefs[],
  startDate: string,
  endDate: string,
): void {
  const csv = paymentsToCSV(payments);
  // Prefix with UTF-8 BOM so Excel auto-detects the encoding for accents
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    startDate === endDate
      ? `sillapro-pagos-${startDate}.csv`
      : `sillapro-pagos-${startDate}-a-${endDate}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
