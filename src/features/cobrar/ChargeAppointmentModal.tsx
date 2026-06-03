import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog } from '@/ui/Dialog';
import { Button } from '@/ui/Button';
import { Input } from '@/ui/Input';
import { FormField } from '@/ui/FormField';
import { cn } from '@/lib/cn';
import { formatCLP } from '@/lib/money';
import { formatTime, parseISOToDate } from '@/lib/dates';
import { useChargeAppointment } from './hooks/useChargeAppointment';
import { METHOD_LABEL, type PaymentMethod } from './types';
import type { AppointmentWithRefs } from '@/features/citas/types';

interface ChargeAppointmentModalProps {
  appointment: AppointmentWithRefs;
  onClose: () => void;
  onDone?: () => void;
}

const METHOD_BUTTONS: { key: PaymentMethod; icon: string }[] = [
  { key: 'cash', icon: '💵' },
  { key: 'card', icon: '💳' },
  { key: 'transfer', icon: '📱' },
];

const TIP_PRESETS: { label: string; value: number | null }[] = [
  { label: 'Sin', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
];

export function ChargeAppointmentModal({
  appointment,
  onClose,
  onDone,
}: ChargeAppointmentModalProps) {
  const charge = useChargeAppointment();
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tipPreset, setTipPreset] = useState<number | 'manual'>(0);
  const [tipManual, setTipManual] = useState<string>('');

  const basePrice = Number(appointment.price_amount);
  const tipAmount =
    tipPreset === 'manual'
      ? Math.max(0, Math.round(Number(tipManual) || 0))
      : Math.round((basePrice * (tipPreset as number)) / 100);
  const total = basePrice + tipAmount;
  const commissionPct = Number(appointment.commission_percent);
  const barberCommission = Math.round((basePrice * commissionPct) / 100);
  const barberTotal = barberCommission + tipAmount;

  async function handleSubmit() {
    try {
      await charge.mutateAsync({
        appointmentId: appointment.id,
        method,
        tipAmount,
      });
      toast.success(
        `Cobrado ${formatCLP(total)} · ${appointment.barber?.full_name ?? 'Barbero'} +${formatCLP(barberTotal)}`,
      );
      if (onDone) onDone();
      else onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cobrar';
      toast.error(msg);
    }
  }

  const starts = parseISOToDate(appointment.starts_at);
  const ends = parseISOToDate(appointment.ends_at);

  return (
    <Dialog open onClose={onClose} title="Cobrar cita">
      <div className="mb-3 text-sm">
        <p className="font-semibold text-gray-900">
          {appointment.client?.full_name ?? '—'}
        </p>
        <p className="text-xs text-gray-500">
          {formatTime(starts)} – {formatTime(ends)} · con{' '}
          {appointment.barber?.full_name ?? '—'} · {appointment.service?.name ?? '—'}
        </p>
      </div>

      <div className="mb-3 rounded-md bg-gray-50 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">{appointment.service?.name ?? 'Servicio'}</span>
          <span>{formatCLP(basePrice)}</span>
        </div>
      </div>

      <FormField label="Método de pago" htmlFor="method">
        <div id="method" className="grid grid-cols-3 gap-1.5">
          {METHOD_BUTTONS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMethod(m.key)}
              className={cn(
                'rounded-md border px-2 py-2 text-xs font-medium transition-colors',
                method === m.key
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {m.icon} {METHOD_LABEL[m.key]}
            </button>
          ))}
        </div>
      </FormField>

      <FormField
        label={`Propina para ${appointment.barber?.full_name ?? 'el barbero'} (opcional)`}
        htmlFor="tip"
      >
        <div id="tip" className="grid grid-cols-5 gap-1.5">
          {TIP_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setTipPreset(p.value as number)}
              className={cn(
                'rounded-md border px-2 py-1.5 text-xs font-medium',
                tipPreset === p.value
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
              )}
            >
              {p.label}
            </button>
          ))}
          <Input
            type="number"
            min="0"
            step="500"
            placeholder="$ manual"
            value={tipPreset === 'manual' ? tipManual : ''}
            onChange={(e) => {
              setTipPreset('manual');
              setTipManual(e.target.value);
            }}
            onFocus={() => setTipPreset('manual')}
            className="text-xs"
          />
        </div>
      </FormField>

      {tipAmount > 0 && (
        <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Total a cobrar: <b>{formatCLP(total)}</b> (incluye propina {formatCLP(tipAmount)} · 100%
          para {appointment.barber?.full_name ?? 'el barbero'})
        </div>
      )}
      {tipAmount === 0 && (
        <div className="mb-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
          Total a cobrar: <b>{formatCLP(total)}</b> · comisión del barbero{' '}
          {formatCLP(barberCommission)} ({commissionPct}%)
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={charge.isPending}>
          Cancelar
        </Button>
        <Button type="button" variant="success" onClick={handleSubmit} disabled={charge.isPending}>
          {charge.isPending ? 'Cobrando...' : `✓ Confirmar cobro ${formatCLP(total)}`}
        </Button>
      </div>
    </Dialog>
  );
}
