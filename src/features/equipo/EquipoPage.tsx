import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { EmptyState } from '@/ui/EmptyState';
import { StatusBadge } from '@/ui/StatusBadge';
import { ConfirmDialog } from '@/ui/ConfirmDialog';
import { BarberModal } from './BarberModal';
import { useBarbers, useBarberMutations } from './hooks/useBarbers';
import type { Barber } from './types';

export function EquipoPage() {
  const { list } = useBarbers();
  const { toggleActive } = useBarberMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [toToggle, setToToggle] = useState<Barber | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(barber: Barber) {
    setEditing(barber);
    setModalOpen(true);
  }

  async function confirmToggle() {
    if (!toToggle) return;
    try {
      await toggleActive.mutateAsync({ id: toToggle.id, active: !toToggle.active });
      toast.success(toToggle.active ? 'Barbero desactivado' : 'Barbero activado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    } finally {
      setToToggle(null);
    }
  }

  const barbers = list.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Equipo</h2>
          <p className="mt-1 text-sm text-gray-500">Barberos, sillas y comisión por defecto.</p>
        </div>
        <Button onClick={openCreate}>+ Barbero</Button>
      </div>

      {list.isLoading && <p className="text-sm text-gray-500">Cargando...</p>}

      {!list.isLoading && barbers.length === 0 && (
        <EmptyState
          title="Sin barberos aún"
          description="Agrega a tu equipo para asignar citas."
          action={<Button onClick={openCreate}>+ Barbero</Button>}
        />
      )}

      {barbers.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Silla</th>
                <th className="px-4 py-2 font-medium">Comisión</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {barbers.map((b) => (
                <tr key={b.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <span>{b.full_name}</span>
                      {b.experience_level && (
                        <span className="inline-block rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-accent">
                          {b.experience_level}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{b.chair_label}</td>
                  <td className="px-4 py-2 text-gray-600">{b.commission_default}%</td>
                  <td className="px-4 py-2">
                    <StatusBadge tone={b.active ? 'active' : 'inactive'}>
                      {b.active ? 'Activo' : 'Inactivo'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/admin/equipo/${b.id}`} className="mr-3 text-brand hover:underline">
                      Ver detalle
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="mr-3 text-brand hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setToToggle(b)}
                      className="text-gray-500 hover:underline"
                    >
                      {b.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && <BarberModal barber={editing} onClose={() => setModalOpen(false)} />}

      <ConfirmDialog
        open={toToggle !== null}
        title={toToggle?.active ? 'Desactivar barbero' : 'Activar barbero'}
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
