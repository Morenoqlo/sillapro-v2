import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { StatusBadge } from '@/ui/StatusBadge';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { TableSkeleton } from '@/ui/Skeleton';
import { formatCLP } from '@/lib/money';
import { ServiceModal } from './ServiceModal';
import { useServices, useServiceMutations } from './hooks/useServices';
import type { Service } from './types';

export function ServiciosPage() {
  const { list } = useServices();
  const { toggleActive } = useServiceMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toToggle, setToToggle] = useState<Service | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(service: Service) {
    setEditing(service);
    setModalOpen(true);
  }

  async function confirmToggle() {
    if (!toToggle) return;
    try {
      await toggleActive.mutateAsync({ id: toToggle.id, active: !toToggle.active });
      toast.success(toToggle.active ? 'Servicio desactivado' : 'Servicio activado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setToToggle(null);
    }
  }

  const services = list.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Servicios</h2>
          <p className="mt-1 text-sm text-gray-500">Catálogo, precios, duración y comisión.</p>
        </div>
        <Button onClick={openCreate}>+ Servicio</Button>
      </div>

      {list.isLoading && <TableSkeleton rows={4} cols={4} />}

      {!list.isLoading && services.length === 0 && (
        <EmptyState
          title="Sin servicios aún"
          description="Crea tu primer servicio para empezar a agendar."
          action={<Button onClick={openCreate}>+ Servicio</Button>}
        />
      )}

      {services.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Categoría</th>
                <th className="px-4 py-2 font-medium">Duración</th>
                <th className="px-4 py-2 font-medium">Precio</th>
                <th className="px-4 py-2 font-medium">Comisión</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-2 text-gray-600">{s.category}</td>
                  <td className="px-4 py-2 text-gray-600">{s.duration_minutes} min</td>
                  <td className="px-4 py-2 text-gray-600">{formatCLP(s.price_amount)}</td>
                  <td className="px-4 py-2 text-gray-600">{s.commission_percent}%</td>
                  <td className="px-4 py-2">
                    <StatusBadge tone={s.active ? 'active' : 'inactive'}>
                      {s.active ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(s)}
                      className="mr-3 text-brand hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setToToggle(s)}
                      className="text-gray-500 hover:underline"
                    >
                      {s.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && <ServiceModal service={editing} onClose={() => setModalOpen(false)} />}

      <ConfirmDialog
        open={toToggle !== null}
        title={toToggle?.active ? 'Desactivar servicio' : 'Activar servicio'}
        message={
          toToggle?.active
            ? 'No aparecerá al crear nuevas citas. Las citas existentes no se afectan.'
            : 'Volverá a estar disponible al crear citas.'
        }
        confirmLabel={toToggle?.active ? 'Desactivar' : 'Activar'}
        variant={toToggle?.active ? 'danger' : 'primary'}
        loading={toggleActive.isPending}
        onConfirm={confirmToggle}
        onCancel={() => setToToggle(null)}
      />
    </div>
  );
}
