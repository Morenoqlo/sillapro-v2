import { describe, it, expect } from 'vitest';
import { paymentsToCSV } from '@/features/caja/exportPaymentsCSV';
import type { PaymentWithRefs } from '@/features/cobrar/types';

function mkPayment(overrides: Partial<PaymentWithRefs> = {}): PaymentWithRefs {
  return {
    id: 'p1',
    appointment_id: 'a1',
    barbershop_id: 's1',
    method: 'cash',
    amount: 12000,
    tip_amount: 1000,
    paid_at: '2026-06-09T13:30:00.000Z',
    appointment: {
      id: 'a1',
      client: { full_name: 'Cristian Rojas' },
      barber: { id: 'b1', full_name: 'Diego Soto' },
      service: { name: 'Corte clásico' },
    },
    ...overrides,
  };
}

describe('paymentsToCSV', () => {
  it('returns just the header row for empty payments', () => {
    const csv = paymentsToCSV([]);
    expect(csv.trim()).toBe(
      'Fecha,Hora,Cliente,Barbero,Servicio,Método,Monto,Propina,Total',
    );
  });

  it('writes one row per payment with totals', () => {
    const csv = paymentsToCSV([mkPayment()]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('Cristian Rojas');
    expect(lines[1]).toContain('Diego Soto');
    expect(lines[1]).toContain('Corte clásico');
    expect(lines[1]).toContain('Efectivo');
    expect(lines[1]).toContain('12000');
    expect(lines[1]).toContain('1000');
    expect(lines[1]).toContain('13000');
  });

  it('escapes commas, quotes and newlines (RFC 4180)', () => {
    const csv = paymentsToCSV([
      mkPayment({
        appointment: {
          id: 'a1',
          client: { full_name: 'Rojas, Cristian' },
          barber: { id: 'b1', full_name: 'Diego "El Maestro" Soto' },
          service: { name: 'Corte\ncon barba' },
        },
      }),
    ]);
    expect(csv).toContain('"Rojas, Cristian"');
    expect(csv).toContain('"Diego ""El Maestro"" Soto"');
    expect(csv).toContain('"Corte\ncon barba"');
  });

  it('handles missing refs gracefully (cliente/barbero/servicio en blanco)', () => {
    const csv = paymentsToCSV([mkPayment({ appointment: null })]);
    const lines = csv.trim().split('\n');
    // 9 columns → 8 commas; empty middle fields ok
    expect((lines[1]?.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(8);
  });

  it('formats every payment method label in Spanish', () => {
    const csv = paymentsToCSV([
      mkPayment({ id: 'p1', method: 'cash' }),
      mkPayment({ id: 'p2', method: 'card' }),
      mkPayment({ id: 'p3', method: 'transfer' }),
      mkPayment({ id: 'p4', method: 'other' }),
    ]);
    expect(csv).toContain('Efectivo');
    expect(csv).toContain('Tarjeta');
    expect(csv).toContain('Transferencia');
    expect(csv).toContain('Otro');
  });
});
