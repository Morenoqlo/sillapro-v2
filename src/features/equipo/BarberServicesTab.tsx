import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { formatCLP } from '@/lib/money';
import {
  useToggleBarberService,
  useUpdateBarberServiceOverride,
  type ServiceWithCommission,
} from './hooks/useBarberServiceCommissions';

interface Props {
  barberId: string;
  services: ServiceWithCommission[];
  loading: boolean;
}

/**
 * Tab "Servicios asignados": permite asignar/quitar servicios al barbero
 * y editar precio/comisión específicos del barbero por cada servicio.
 */
export function BarberServicesTab({ barberId, services, loading }: Props) {
  const toggleService = useToggleBarberService(barberId);
  const updateOverride = useUpdateBarberServiceOverride(barberId);

  async function handleToggle(serviceId: string, currentlyEnabled: boolean) {
    try {
      await toggleService.mutateAsync({ serviceId, enabled: !currentlyEnabled });
      toast.success(currentlyEnabled ? 'Servicio removido' : 'Servicio asignado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleSaveOverride(
    serviceId: string,
    price: number | null,
    commission: number | null,
  ) {
    try {
      await updateOverride.mutateAsync({ serviceId, price, commission });
      toast.success('Precio actualizado');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Cargando servicios...</p>;

  if (services.length === 0) {
    return (
      <EmptyState
        title="Sin servicios activos"
        description="Crea servicios en la sección Servicios para asignarlos aquí."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <p className="border-b border-gray-100 bg-amber-50/50 px-4 py-2 text-xs text-gray-600">
        💡 Para cada servicio asignado puedes sobrescribir el <strong>precio</strong> y la{' '}
        <strong>comisión</strong> específicos de este barbero. Si dejas el campo vacío, se
        usa el precio base del servicio.
      </p>
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-2 font-medium">Servicio</th>
            <th className="px-4 py-2 font-medium">Precio base</th>
            <th className="px-4 py-2 font-medium">Precio del barbero</th>
            <th className="px-4 py-2 font-medium">Comisión</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <ServiceRow
              key={s.id}
              service={s}
              onToggle={() => handleToggle(s.id, s.is_assigned)}
              onSaveOverride={(price, commission) =>
                handleSaveOverride(s.id, price, commission)
              }
              togglePending={toggleService.isPending}
              savePending={updateOverride.isPending}
            />
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────
// ServiceRow — encapsula el draft local + validación del override

interface ServiceRowProps {
  service: ServiceWithCommission;
  onToggle: () => void;
  onSaveOverride: (price: number | null, commission: number | null) => Promise<void>;
  togglePending: boolean;
  savePending: boolean;
}

function ServiceRow({
  service,
  onToggle,
  onSaveOverride,
  togglePending,
  savePending,
}: ServiceRowProps) {
  const initialPrice = service.override_price != null ? String(service.override_price) : '';
  const initialComm =
    service.override_commission != null ? String(service.override_commission) : '';

  const [priceDraft, setPriceDraft] = useState(initialPrice);
  const [commDraft, setCommDraft] = useState(initialComm);

  const isAssigned = service.is_assigned;
  const dirty = priceDraft !== initialPrice || commDraft !== initialComm;

  async function handleSave() {
    const price = priceDraft.trim() === '' ? null : Number(priceDraft);
    const commission = commDraft.trim() === '' ? null : Number(commDraft);
    if (price != null && (!Number.isFinite(price) || price < 0)) return;
    if (commission != null && (!Number.isFinite(commission) || commission < 0 || commission > 100)) {
      return;
    }
    await onSaveOverride(price, commission);
  }

  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-2 font-medium text-gray-900">{service.name}</td>
      <td className="px-4 py-2 text-gray-500">{formatCLP(service.price_amount)}</td>
      <td className="px-4 py-2">
        {isAssigned ? (
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={String(service.price_amount)}
            value={priceDraft}
            onChange={(e) => setPriceDraft(e.target.value)}
            className="w-28 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
          />
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2">
        {isAssigned ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              placeholder={String(service.commission_percent)}
              value={commDraft}
              onChange={(e) => setCommDraft(e.target.value)}
              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/40"
            />
            <span className="text-xs text-gray-500">%</span>
          </div>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="flex items-center justify-end gap-3">
          {isAssigned && dirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={savePending}
              className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50"
            >
              Guardar
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="text-sm text-brand hover:underline"
            disabled={togglePending}
          >
            {isAssigned ? 'Quitar' : 'Asignar'}
          </button>
        </div>
      </td>
    </tr>
  );
}
