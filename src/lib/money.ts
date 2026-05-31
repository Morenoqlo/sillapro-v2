const CLP_FORMATTER = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

export function formatCLP(amount: number): string {
  return CLP_FORMATTER.format(Math.round(amount));
}

export function parseCLP(input: string): number {
  const cleaned = input.replace(/[^\d-]/g, '');
  if (cleaned === '' || cleaned === '-') return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function calculateCommission(priceAmount: number, percent: number): number {
  return Math.round((priceAmount * percent) / 100);
}
