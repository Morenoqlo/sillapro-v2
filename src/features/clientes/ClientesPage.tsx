import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { Input } from '@/ui/Input';
import { EmptyState } from '@/ui/EmptyState';
import { StatusBadge } from '@/ui/StatusBadge';
import { TableSkeleton } from '@/ui/Skeleton';
import { ClientModal } from './ClientModal';
import { useClients, useClientMutations } from './hooks/useClients';
import type { Client, ClientStatus } from './types';

const STATUS_LABEL: Record<ClientStatus, string> = {
  active: 'Activo',
  inactive: 'Inactivo',
  blocked: 'Bloqueado',
};

export function ClientesPage() {
  const [search, setSearch] = useState('');
  const { list } = useClients(search);
  const { setStatus } = useClientMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(client: Client) {
    setEditing(client);
    setModalOpen(true);
  }

  async function handleStatusChange(client: Client, status: ClientStatus) {
    try {
      await setStatus.mutateAsync({ id: client.id, status });
      toast.success('Estado actualizado');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error');
    }
  }

  const clients = list.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clientes</h2>
          <p className="mt-1 text-sm text-gray-500">Contactos, teléfono y notas.</p>
        </div>
        <Button onClick={openCreate}>+ Cliente</Button>
      </div>

      <div className="mb-3">
        <Input
          type="search"
          placeholder="🔍 Buscar por nombre o teléfono..."
          aria-label="Buscar clientes por nombre o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {list.isLoading && <TableSkeleton rows={6} cols={4} />}

      {!list.isLoading && clients.length === 0 && (
        <EmptyState
          title={search ? 'Sin resultados' : 'Sin clientes aún'}
          description={search ? 'Prueba otro nombre o teléfono.' : 'Crea tu primer cliente.'}
          action={!search ? <Button onClick={openCreate}>+ Cliente</Button> : undefined}
        />
      )}

      {clients.length > 0 && (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Notas</th>
                <th className="px-4 py-2 font-medium">Estado</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-medium text-gray-900">{c.full_name}</td>
                  <td className="px-4 py-2 text-gray-600">{c.phone || '—'}</td>
                  <td className="max-w-xs truncate px-4 py-2 text-gray-500">{c.notes || '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge tone={c.status}>{STATUS_LABEL[c.status]}</StatusBadge>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link to={`/admin/clientes/${c.id}`} className="mr-3 text-brand hover:underline">
                      Ver detalle
                    </Link>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="mr-3 text-brand hover:underline"
                    >
                      Editar
                    </button>
                    {c.status === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c, 'inactive')}
                        className="text-gray-500 hover:underline"
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(c, 'active')}
                        className="text-gray-500 hover:underline"
                      >
                        Activar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {modalOpen && <ClientModal client={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
