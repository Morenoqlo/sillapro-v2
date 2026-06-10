import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { todayBusinessDate, formatDateLong } from '@/lib/dates';
import { DateRangeSelector, type RangePreset } from './DateRangeSelector';
import { PaymentsSummaryCards } from './PaymentsSummaryCards';
import { DayCloseoutPanel } from './DayCloseoutPanel';
import { TodayPaymentsTable } from './TodayPaymentsTable';
import { usePaymentsByRange } from './hooks/usePaymentsByRange';
import { downloadPaymentsCSV } from './exportPaymentsCSV';

export function CajaPage() {
  const today = todayBusinessDate();
  const [preset, setPreset] = useState<RangePreset>('today');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const { data, isLoading } = usePaymentsByRange(startDate, endDate);
  const payments = data ?? [];

  const isSingleDay = startDate === endDate;

  function handleCustomChange(start: string, end: string) {
    setStartDate(start);
    setEndDate(end);
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">Operación</p>
        <h2 className="text-2xl font-bold text-gray-900">Caja</h2>
        <p className="mt-1 text-sm text-gray-500">
          {isSingleDay
            ? formatDateLong(new Date(`${startDate}T12:00:00Z`))
            : `${startDate} → ${endDate}`}
        </p>
      </div>

      <div className="mb-4">
        <DateRangeSelector
          preset={preset}
          customStart={startDate}
          customEnd={endDate}
          onPresetChange={setPreset}
          onCustomChange={handleCustomChange}
        />
      </div>

      {isSingleDay && (
        <div className="mb-4">
          <DayCloseoutPanel date={startDate} />
        </div>
      )}

      <div className="mb-4">
        <PaymentsSummaryCards payments={payments} />
      </div>

      <div className="mb-2 flex items-end justify-between">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Pagos{' '}
          {isSingleDay ? 'del día' : `del ${startDate} al ${endDate}`} (
          {payments.length})
        </p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={payments.length === 0}
          onClick={() => {
            try {
              downloadPaymentsCSV(payments, startDate, endDate);
              toast.success('CSV descargado');
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Error al exportar');
            }
          }}
          aria-label="Exportar pagos del rango actual a CSV"
        >
          ⬇ Exportar CSV
        </Button>
      </div>
      <TodayPaymentsTable payments={payments} isLoading={isLoading} />
    </div>
  );
}
